const express = require("express");
const { Firestore } = require("@google-cloud/firestore");

const app = express();
const db = new Firestore();

app.use(express.json());

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const BRAND = "DragoTeo 🐉 | Universidad Mondragón México";
const SIGNATURE = "— DragoTeo 🐉";
const ROOT_NODE_ID = "audience_selector";
const MAIN_MENU_ID = "main_menu";
const SUPPORT_MENU_ID = "support_menu";
const CONTACT_MENU_ID = "contacts_menu";
const URGENT_LEAF_ID = "urgent_support";

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

function createEmptyMetrics() {
  return {
    commandCount: 0,
    menuViews: 0,
    leafViews: 0,
    fallbackCount: 0,
    ambiguousCount: 0,
    restartCount: 0,
    supportCount: 0,
    contactCount: 0,
    urgentCount: 0,
    unrecognizedCount: 0,
    lastCommand: null,
    lastMatchedNodeId: null,
    lastUnrecognizedInput: null
  };
}

function createDefaultSession(rootNodeId) {
  return {
    audience: null,
    currentNodeId: rootNodeId,
    stack: [],
    updatedAt: new Date().toISOString(),
    metrics: createEmptyMetrics()
  };
}

function mergeMetrics(savedMetrics = {}) {
  return {
    ...createEmptyMetrics(),
    ...savedMetrics
  };
}

function bumpMetric(session, key, amount = 1) {
  session.metrics[key] = (session.metrics[key] || 0) + amount;
}

function registerCommand(session, command) {
  bumpMetric(session, "commandCount");
  session.metrics.lastCommand = command;
}

function registerFallback(session, input) {
  bumpMetric(session, "fallbackCount");
  bumpMetric(session, "unrecognizedCount");
  session.metrics.lastUnrecognizedInput = input || null;
}

function registerMatch(session, nodeId, type) {
  session.metrics.lastMatchedNodeId = nodeId;
  if (type === "menu") bumpMetric(session, "menuViews");
  if (type === "leaf") bumpMetric(session, "leafViews");
}

function isSessionExpired(updatedAt) {
  if (!updatedAt) return false;
  const last = new Date(updatedAt).getTime();
  if (Number.isNaN(last)) return false;
  return Date.now() - last > SESSION_TIMEOUT_MS;
}

function isVisibleForAudience(nodeAudience = "both", selectedAudience = "both") {
  if (selectedAudience === "ambas") return true;
  return nodeAudience === "both" || nodeAudience === selectedAudience;
}

function getNode(nodes, id) {
  return nodes[id] || null;
}

function getVisibleChildren(node, nodes, selectedAudience) {
  return (node?.children || [])
    .map((id) => getNode(nodes, id))
    .filter(Boolean)
    .filter((child) => {
      if (child.type === "audience_option") return true;
      return isVisibleForAudience(child.audience, selectedAudience);
    });
}

function getAudienceLabel(selectedAudience) {
  if (selectedAudience === "prepa") return "Contexto: Preparatoria";
  if (selectedAudience === "universidad") return "Contexto: Universidad";
  if (selectedAudience === "ambas") return "Contexto: Preparatoria y Universidad";
  return "Contexto: Sin definir";
}

function getNodeIcon(node) {
  if (!node) return "📌";

  const id = node.id || "";
  const label = normalizeText(node.label || "");

  if (node.type === "audience_option") return "🧭";
  if (id.includes("classes") || label.includes("clases") || label.includes("horarios")) return "📚";
  if (id.includes("evaluation") || label.includes("evaluacion") || label.includes("parciales")) return "📝";
  if (id.includes("spaces") || label.includes("aulas") || label.includes("espacios")) return "🏫";
  if (id.includes("requests") || label.includes("solicitudes") || label.includes("formatos")) return "📄";
  if (id.includes("rules") || label.includes("reglamentos") || label.includes("lineamientos")) return "📘";
  if (id.includes("support") || label.includes("soporte") || label.includes("incidencias")) return "🛠️";
  if (id.includes("contact") || label.includes("contactos")) return "☎️";
  if (id.includes("alert") || label.includes("avisos")) return "📢";
  if (label.includes("urgente")) return "🚨";
  return node.type === "menu" ? "📂" : "📌";
}

function formatOptions(children) {
  return children.map((child, index) => `${index + 1}. ${getNodeIcon(child)} ${child.label}`);
}

function buildResponse(lines) {
  return [BRAND, ...lines.filter(Boolean), SIGNATURE].join("\n");
}

function buildMenuMessage(title, children, selectedAudience) {
  return buildResponse([
    getAudienceLabel(selectedAudience),
    "",
    `📂 ${title}`,
    "",
    ...formatOptions(children),
    "",
    "Comandos: menú, volver, ayuda"
  ]);
}

function buildLeafMessage(node, selectedAudience) {
  const configured = node.response?.trim();

  return buildResponse([
    getAudienceLabel(selectedAudience),
    "",
    `${getNodeIcon(node)} ${node.label}`,
    "",
    configured || "Ruta sin respuesta cerrada. Use soporte, contacto o menú."
  ]);
}

function buildHelpMessage() {
  return buildResponse([
    "ℹ️ Use el número o el nombre de una opción.",
    "",
    "Comandos: menú, inicio, volver, reiniciar, ayuda.",
    "Atajos: soporte, contacto, urgente."
  ]);
}

function buildFallbackMessage(node, children, selectedAudience) {
  const suggestions = children
    .slice(0, 4)
    .map((child, index) => `${index + 1}. ${child.label}`);

  return buildResponse([
    getAudienceLabel(selectedAudience),
    "",
    `⚠️ No ubiqué esa opción en: ${node.label}.`,
    "",
    ...suggestions,
    "",
    "Use menú, inicio o ayuda."
  ]);
}

function buildAmbiguousMessage(suggestions, selectedAudience) {
  return buildResponse([
    getAudienceLabel(selectedAudience),
    "",
    "⚠️ Ubico más de una ruta posible.",
    "",
    ...suggestions.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Escriba el número o el nombre más completo."
  ]);
}

function buildSystemMessage(message, selectedAudience) {
  return buildResponse([
    getAudienceLabel(selectedAudience),
    message
  ]);
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
      return res.json({
        text: buildResponse([
          "⚠️ No localicé el menú institucional publicado.",
          "Solicite validación del despliegue."
        ])
      });
    }

    const config = menuDoc.data();
    const nodes = config.nodes || {};
    const rootNodeId = config.rootNodeId || ROOT_NODE_ID;

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
        updatedAt: saved.updatedAt || null,
        metrics: mergeMetrics(saved.metrics)
      };
    }

    const saveSession = async () => {
      await sessionRef.set(
        {
          audience: session.audience,
          currentNodeId: session.currentNodeId,
          stack: session.stack,
          metrics: session.metrics,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    };

    const openMenu = async (nodeId, selectedAudience = session.audience || "both") => {
      const node = getNode(nodes, nodeId) || getNode(nodes, rootNodeId);
      const children = getVisibleChildren(node, nodes, selectedAudience);
      registerMatch(session, node.id, "menu");
      await saveSession();
      return res.json({
        text: buildMenuMessage(node.label, children, selectedAudience)
      });
    };

    if (sessionSnap.exists && isSessionExpired(session.updatedAt)) {
      session = createDefaultSession(rootNodeId);
      bumpMetric(session, "restartCount");
      await saveSession();

      const rootNode = getNode(nodes, rootNodeId);
      const rootChildren = getVisibleChildren(rootNode, nodes, "both");

      return res.json({
        text: buildResponse([
          "⏳ La sesión anterior se cerró por inactividad.",
          "",
          `📂 ${rootNode.label}`,
          "",
          ...formatOptions(rootChildren)
        ])
      });
    }

    if (userText === "ayuda") {
      registerCommand(session, "ayuda");
      await saveSession();
      return res.json({ text: buildHelpMessage() });
    }

    if (userText === "reiniciar") {
      session = createDefaultSession(rootNodeId);
      bumpMetric(session, "restartCount");
      registerCommand(session, "reiniciar");
      const rootNode = getNode(nodes, rootNodeId);
      const rootChildren = getVisibleChildren(rootNode, nodes, "both");
      await saveSession();

      return res.json({
        text: buildResponse([
          "🔄 Sesión reiniciada.",
          "",
          `📂 ${rootNode.label}`,
          "",
          ...formatOptions(rootChildren)
        ])
      });
    }

    if (userText === "inicio") {
      registerCommand(session, "inicio");
      if (session.audience) {
        session.currentNodeId = MAIN_MENU_ID;
        session.stack = [MAIN_MENU_ID];
        return openMenu(MAIN_MENU_ID, session.audience);
      }

      session.currentNodeId = rootNodeId;
      session.stack = [];
      return openMenu(rootNodeId, "both");
    }

    if (userText === "menu" || userText === "menus" || userText === "menú") {
      registerCommand(session, "menu");
      const node = getNode(nodes, session.currentNodeId) || getNode(nodes, rootNodeId);
      return openMenu(node.id, session.audience || "both");
    }

    if (userText === "volver") {
      registerCommand(session, "volver");
      if (session.stack.length > 1) {
        session.stack.pop();
        session.currentNodeId = session.stack[session.stack.length - 1];
      } else if (session.audience) {
        session.currentNodeId = MAIN_MENU_ID;
        session.stack = [MAIN_MENU_ID];
      } else {
        session.currentNodeId = rootNodeId;
        session.stack = [];
      }

      return openMenu(session.currentNodeId, session.audience || "both");
    }

    if (userText === "soporte") {
      registerCommand(session, "soporte");
      bumpMetric(session, "supportCount");
      session.currentNodeId = SUPPORT_MENU_ID;
      session.stack = [MAIN_MENU_ID, SUPPORT_MENU_ID];
      return openMenu(SUPPORT_MENU_ID, session.audience || "both");
    }

    if (userText === "contacto") {
      registerCommand(session, "contacto");
      bumpMetric(session, "contactCount");
      session.currentNodeId = CONTACT_MENU_ID;
      session.stack = [MAIN_MENU_ID, CONTACT_MENU_ID];
      return openMenu(CONTACT_MENU_ID, session.audience || "both");
    }

    if (userText === "urgente") {
      registerCommand(session, "urgente");
      bumpMetric(session, "urgentCount");
      const urgentNode = getNode(nodes, URGENT_LEAF_ID);
      registerMatch(session, urgentNode?.id || URGENT_LEAF_ID, "leaf");
      await saveSession();
      return res.json({
        text: buildLeafMessage(urgentNode, session.audience || "both")
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
        return openMenu(rootNodeId, "both");
      }

      session.currentNodeId = MAIN_MENU_ID;
      session.stack = [MAIN_MENU_ID];
      return openMenu(MAIN_MENU_ID, session.audience);
    }

    const node = getNode(nodes, session.currentNodeId) || getNode(nodes, rootNodeId);

    if (node.type !== "menu") {
      session.currentNodeId = session.audience ? MAIN_MENU_ID : rootNodeId;
      session.stack = session.audience ? [MAIN_MENU_ID] : [];
      return openMenu(session.currentNodeId, session.audience || "both");
    }

    const children = getVisibleChildren(node, nodes, session.audience || "both");
    const result = findMatchingOption(userText, children);

    if (result.ambiguous) {
      bumpMetric(session, "ambiguousCount");
      await saveSession();
      return res.json({
        text: buildAmbiguousMessage(result.suggestions, session.audience || "both")
      });
    }

    if (!result.match) {
      registerFallback(session, incomingText);
      await saveSession();
      return res.json({
        text: buildFallbackMessage(node, children, session.audience || "both")
      });
    }

    const matched = result.match;

    if (matched.type === "audience_option") {
      registerMatch(session, matched.id, "menu");
      session.audience = matched.value;
      session.currentNodeId = MAIN_MENU_ID;
      session.stack = [MAIN_MENU_ID];
      await saveSession();

      const mainMenu = getNode(nodes, MAIN_MENU_ID);
      const mainChildren = getVisibleChildren(mainMenu, nodes, session.audience);

      return res.json({
        text: buildResponse([
          getAudienceLabel(session.audience),
          "",
          `✅ Contexto confirmado: ${matched.label}.`,
          "",
          `📂 ${mainMenu.label}`,
          "",
          ...formatOptions(mainChildren)
        ])
      });
    }

    if (matched.type === "menu") {
      session.currentNodeId = matched.id;
      session.stack.push(matched.id);
      registerMatch(session, matched.id, "menu");
      await saveSession();

      const nextChildren = getVisibleChildren(matched, nodes, session.audience || "both");
      return res.json({
        text: buildMenuMessage(matched.label, nextChildren, session.audience || "both")
      });
    }

    if (matched.type === "leaf") {
      registerMatch(session, matched.id, "leaf");
      await saveSession();
      return res.json({
        text: buildLeafMessage(matched, session.audience || "both")
      });
    }

    registerFallback(session, incomingText);
    await saveSession();
    return res.json({
      text: buildSystemMessage("⚠️ La ruta seleccionada no está disponible.", session.audience || "both")
    });
  } catch (error) {
    console.error(error);
    return res.json({
      text: buildResponse([
        "⚠️ Ocurrió un error al procesar la solicitud.",
        "Use menú o contacte soporte."
      ])
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
