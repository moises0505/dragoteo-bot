const express = require("express");
const { Firestore } = require("@google-cloud/firestore");

const app = express();
const db = new Firestore();

app.use(express.json());

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

function normalizeText(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/^@[\w.-]+\s*/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSessionId(body) {
  const space = body?.space?.name || "no-space";
  const user = body?.user?.name || "no-user";
  return `${space}__${user}`;
}

function isVisibleForAudience(nodeAudience = "both", selectedAudience = "both") {
  if (selectedAudience === "ambas") return true;
  return nodeAudience === "both" || nodeAudience === selectedAudience;
}

function getNode(nodes, id) {
  return nodes[id] || null;
}

function getVisibleChildren(node, nodes, selectedAudience) {
  return (node.children || [])
    .map((id) => getNode(nodes, id))
    .filter(Boolean)
    .filter((child) => {
      if (child.type === "audience_option") return true;
      return isVisibleForAudience(child.audience, selectedAudience);
    });
}

function buildMenuMessage(title, children, selectedAudience) {
  const numbered = children.map((child, index) => ({
    ...child,
    optionNumber: index + 1
  }));

  const general = numbered.filter((c) => (c.audience || "both") === "both");
  const uni = numbered.filter((c) => c.audience === "universidad");
  const prepa = numbered.filter((c) => c.audience === "prepa");

  let body = `${title}\n\n`;

  if (selectedAudience === "ambas" && (uni.length || prepa.length)) {
    if (general.length) {
      body += `🌐 Generales:\n${general.map((c) => `${c.optionNumber}. ${c.label}`).join("\n")}\n\n`;
    }
    if (uni.length) {
      body += `🎓 Universidad:\n${uni.map((c) => `${c.optionNumber}. ${c.label}`).join("\n")}\n\n`;
    }
    if (prepa.length) {
      body += `🏫 Preparatoria:\n${prepa.map((c) => `${c.optionNumber}. ${c.label}`).join("\n")}\n\n`;
    }
  } else {
    body += `Opciones disponibles:\n${numbered.map((c) => `${c.optionNumber}. ${c.label}`).join("\n")}\n\n`;
  }

  body += `✍️ Puedes escribir el número, el nombre o una parte del nombre.\n`;
  body += `↩️ También puedes escribir "volver", "menú", "inicio", "reiniciar" o "ayuda".`;

  return body;
}

function buildLeafMessage(node, selectedAudience) {
  const configured = node.response?.trim();

  let audienceLine = "🌐 Esta ruta aplica de forma general.";
  if (node.audience === "prepa") audienceLine = "🏫 Esta ruta corresponde a Preparatoria.";
  if (node.audience === "universidad") audienceLine = "🎓 Esta ruta corresponde a Universidad.";
  if (selectedAudience === "ambas" && node.audience === "both") {
    audienceLine = "🔀 Esta ruta aplica tanto a Preparatoria como a Universidad.";
  }

  const body =
    configured ||
    `📌 Por ahora esta es una respuesta temporal.\n🛠️ Aquí irá la respuesta configurada para esta duda.`;

  return `✅ Ya llegaste a la sección correcta: ${node.label}.\n\n${audienceLine}\n\n${body}\n\n↩️ Escribe "volver" para regresar, "inicio" para volver al menú principal o "reiniciar" para comenzar desde cero.`;
}

function scoreMatch(input, label) {
  const text = normalizeText(input);
  const normalizedLabel = normalizeText(label);

  if (!text || !normalizedLabel) return 0;
  if (text === normalizedLabel) return 100;
  if (normalizedLabel.startsWith(text)) return 90;
  if (text.startsWith(normalizedLabel)) return 85;
  if (normalizedLabel.includes(text)) return 75;

  const textTokens = text.split(" ").filter(Boolean);
  const labelTokens = normalizedLabel.split(" ").filter(Boolean);

  let overlap = 0;
  for (const token of textTokens) {
    if (labelTokens.some((labelToken) => labelToken.startsWith(token) || token.startsWith(labelToken))) {
      overlap++;
    }
  }

  if (overlap > 0) return 50 + overlap;
  return 0;
}

function findMatchingOption(userText, children) {
  const normalized = normalizeText(userText);

  if (!normalized) return { match: null, ambiguous: false, suggestions: [] };

  if (/^\d+$/.test(normalized)) {
    const index = Number(normalized) - 1;
    if (index >= 0 && index < children.length) {
      return { match: children[index], ambiguous: false, suggestions: [] };
    }
  }

  const ranked = children
    .map((child) => ({
      child,
      score: scoreMatch(normalized, child.label)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return { match: null, ambiguous: false, suggestions: [] };
  }

  if (ranked.length > 1 && ranked[0].score === ranked[1].score && ranked[0].score < 100) {
    return {
      match: null,
      ambiguous: true,
      suggestions: ranked.slice(0, 3).map((item) => item.child.label)
    };
  }

  return { match: ranked[0].child, ambiguous: false, suggestions: [] };
}

function createDefaultSession(rootNodeId) {
  return {
    audience: null,
    currentNodeId: rootNodeId,
    stack: [],
    updatedAt: new Date().toISOString()
  };
}

function isSessionExpired(updatedAt) {
  if (!updatedAt) return false;
  const last = new Date(updatedAt).getTime();
  if (Number.isNaN(last)) return false;
  return Date.now() - last > SESSION_TIMEOUT_MS;
}

app.get("/", (req, res) => {
  res.send("DRAGOTEO está vivo.");
});

app.post("/chat", async (req, res) => {
  try {
    const body = req.body || {};
    const eventType = body?.type || body?.eventType || "";
    const incomingText =
      body?.message?.argumentText ||
      body?.message?.text ||
      body?.text ||
      "";

    const userText = normalizeText(incomingText);

    const menuDoc = await db.collection("publishedMenus").doc("main").get();
    if (!menuDoc.exists) {
      return res.json({ text: "No encontré el menú publicado." });
    }

    const config = menuDoc.data();
    const nodes = config.nodes || {};
    const rootNodeId = config.rootNodeId || "audience_selector";

    const sessionId = getSessionId(body);
    const sessionRef = db.collection("chatSessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    let session = createDefaultSession(rootNodeId);

    if (sessionSnap.exists) {
      const saved = sessionSnap.data();
      session = {
        audience: saved.audience || null,
        currentNodeId: saved.currentNodeId || rootNodeId,
        stack: Array.isArray(saved.stack) ? saved.stack : [],
        updatedAt: saved.updatedAt || null
      };
    }

    const saveSession = async () => {
      await sessionRef.set(
        {
          audience: session.audience,
          currentNodeId: session.currentNodeId,
          stack: session.stack,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    };

    if (sessionSnap.exists && isSessionExpired(session.updatedAt)) {
      session = createDefaultSession(rootNodeId);
      await saveSession();

      const rootNode = getNode(nodes, rootNodeId);
      const rootChildren = getVisibleChildren(rootNode, nodes, "both");

      return res.json({
        text:
          `⏳ La conversación anterior se cerró automáticamente por falta de respuesta.\n\n` +
          `Vamos a comenzar de nuevo.\n\n` +
          buildMenuMessage(rootNode.label, rootChildren, "both")
      });
    }

    if (userText === "ayuda") {
      return res.json({
        text:
          `🧭 Puedes navegar escribiendo una opción.\n\n` +
          `También puedes usar:\n` +
          `• el número de la opción\n` +
          `• el nombre completo\n` +
          `• una parte del nombre\n\n` +
          `Comandos disponibles:\n` +
          `• inicio\n` +
          `• menú\n` +
          `• volver\n` +
          `• reiniciar\n` +
          `• ayuda`
      });
    }

    if (userText === "reiniciar") {
      session = createDefaultSession(rootNodeId);
      await saveSession();

      const rootNode = getNode(nodes, rootNodeId);
      const rootChildren = getVisibleChildren(rootNode, nodes, "both");

      return res.json({
        text:
          `🔄 He reiniciado la conversación.\n\n` +
          `Vamos a comenzar desde cero.\n\n` +
          buildMenuMessage(rootNode.label, rootChildren, "both")
      });
    }

    if (userText === "inicio") {
      if (session.audience) {
        session.currentNodeId = "main_menu";
        session.stack = ["main_menu"];
      } else {
        session.currentNodeId = rootNodeId;
        session.stack = [];
      }

      await saveSession();

      const node = getNode(nodes, session.currentNodeId);
      const children = getVisibleChildren(node, nodes, session.audience || "both");
      return res.json({
        text: buildMenuMessage(node.label, children, session.audience || "both")
      });
    }

    if (userText === "menu" || userText === "menus" || userText === "menú") {
      const node = getNode(nodes, session.currentNodeId) || getNode(nodes, rootNodeId);
      const children = getVisibleChildren(node, nodes, session.audience || "both");
      return res.json({
        text: buildMenuMessage(node.label, children, session.audience || "both")
      });
    }

    if (userText === "volver") {
      if (session.stack.length > 1) {
        session.stack.pop();
        session.currentNodeId = session.stack[session.stack.length - 1];
      } else if (session.audience) {
        session.currentNodeId = "main_menu";
        session.stack = ["main_menu"];
      } else {
        session.currentNodeId = rootNodeId;
        session.stack = [];
      }

      await saveSession();

      const node = getNode(nodes, session.currentNodeId);
      const children = getVisibleChildren(node, nodes, session.audience || "both");
      return res.json({
        text: buildMenuMessage(node.label, children, session.audience || "both")
      });
    }

    if (
      eventType === "ADDED_TO_SPACE" ||
      !userText ||
      userText === "hola" ||
      userText === "start"
    ) {
      if (!session.audience) {
        session.currentNodeId = rootNodeId;
        session.stack = [];
        await saveSession();

        const node = getNode(nodes, rootNodeId);
        const children = getVisibleChildren(node, nodes, "both");
        return res.json({
          text: buildMenuMessage(node.label, children, "both")
        });
      }

      session.currentNodeId = "main_menu";
      session.stack = ["main_menu"];
      await saveSession();

      const node = getNode(nodes, "main_menu");
      const children = getVisibleChildren(node, nodes, session.audience);
      return res.json({
        text: buildMenuMessage(node.label, children, session.audience)
      });
    }

    const node = getNode(nodes, session.currentNodeId) || getNode(nodes, rootNodeId);

    if (node.type !== "menu") {
      session.currentNodeId = session.audience ? "main_menu" : rootNodeId;
      session.stack = session.audience ? ["main_menu"] : [];
      await saveSession();

      const resetNode = getNode(nodes, session.currentNodeId);
      const children = getVisibleChildren(resetNode, nodes, session.audience || "both");
      return res.json({
        text: buildMenuMessage(resetNode.label, children, session.audience || "both")
      });
    }

    const children = getVisibleChildren(node, nodes, session.audience || "both");
    const result = findMatchingOption(userText, children);

    if (result.ambiguous) {
      return res.json({
        text:
          `🤔 Encontré varias opciones parecidas.\n\n` +
          `Quizá quisiste decir:\n` +
          result.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n") +
          `\n\n✍️ Escribe el nombre más completo o el número de la opción correcta.`
      });
    }

    if (!result.match) {
      return res.json({
        text:
          `🤔 No encontré esa opción en la sección actual.\n\n` +
          buildMenuMessage(node.label, children, session.audience || "both")
      });
    }

    const matched = result.match;

    if (matched.type === "audience_option") {
      session.audience = matched.value;
      session.currentNodeId = "main_menu";
      session.stack = ["main_menu"];
      await saveSession();

      const mainMenu = getNode(nodes, "main_menu");
      const mainChildren = getVisibleChildren(mainMenu, nodes, session.audience);

      return res.json({
        text:
          `✅ Perfecto. A partir de ahora te mostraré opciones para: ${matched.label}.\n\n` +
          buildMenuMessage(mainMenu.label, mainChildren, session.audience)
      });
    }

    if (matched.type === "menu") {
      session.currentNodeId = matched.id;
      session.stack.push(matched.id);
      await saveSession();

      const nextChildren = getVisibleChildren(matched, nodes, session.audience || "both");
      return res.json({
        text: buildMenuMessage(matched.label, nextChildren, session.audience || "both")
      });
    }

    if (matched.type === "leaf") {
      await saveSession();
      return res.json({
        text: buildLeafMessage(matched, session.audience || "both")
      });
    }

    return res.json({
      text: "⚠️ La opción seleccionada no tiene una acción válida."
    });
  } catch (error) {
    console.error(error);
    return res.json({
      text: "⚠️ Ocurrió un error al procesar tu solicitud."
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
