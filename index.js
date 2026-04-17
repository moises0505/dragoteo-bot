const express = require("express");
const { Firestore } = require("@google-cloud/firestore");

const app = express();
const db = new Firestore();

app.use(express.json());

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const BRAND = "DragoTeo 🐉 | Universidad Mondragón México";
const ROOT_NODE_ID = "audience_selector";
const MAIN_MENU_ID = "main_menu";
const SUPPORT_MENU_ID = "support_menu";
const CONTACT_MENU_ID = "contacts_menu";
const URGENT_LEAF_ID = "urgent_support";
const COMMAND_ALIASES = {
  ayuda: ["ayuda", "ayud", "help", "apoyo"],
  reiniciar: ["reiniciar", "reinicia", "reinicio", "reset"],
  inicio: ["inicio", "iniciar", "empezar", "comenzar", "home"],
  menu: ["menu", "menú", "menus", "opciones", "opcion", "men"],
  volver: ["volver", "regresar", "atras", "atrás", "retroceder", "volverr"],
  soporte: ["soporte", "soport", "ayuda tecnica", "problema", "incidencia"],
  contacto: ["contacto", "contact", "contactos", "directorio", "coordi"],
  urgente: ["urgente", "urgent", "emergencia", "prioridad"]
};

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
    metrics: createEmptyMetrics(),
    pendingSuggestions: [],
    pendingInput: null,
    pendingNodeId: null
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

function clearPendingSuggestions(session) {
  session.pendingSuggestions = [];
  session.pendingInput = null;
  session.pendingNodeId = null;
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

  if (id === "aud_prepa") return "🏫";
  if (id === "aud_universidad") return "🎓";
  if (id === "aud_ambas") return "🔀";
  if (id === "aud_no_seguro") return "❓";
  if (node.type === "audience_option") return "🧭";
  if (label.includes("horario")) return "🕒";
  if (label.includes("grupo")) return "👥";
  if (label.includes("clases asignadas")) return "📚";
  if (label.includes("calendario")) return "🗓️";
  if (label.includes("asistencia")) return "✅";
  if (label.includes("captura de calificaciones")) return "🧮";
  if (label.includes("rubricas") || label.includes("rubrica")) return "📏";
  if (label.includes("fechas de parciales")) return "📅";
  if (label.includes("errores de captura")) return "⚠️";
  if (label.includes("actas y reportes")) return "🗂️";
  if (label.includes("aula asignada")) return "🚪";
  if (label.includes("cambio de aula")) return "🔁";
  if (label.includes("aulas virtuales")) return "💻";
  if (label.includes("espacios y recursos")) return "🧰";
  if (label.includes("biblioteca")) return "📚";
  if (label.includes("ausencia")) return "📝";
  if (label.includes("documentos")) return "🪪";
  if (label.includes("constancia")) return "📃";
  if (label.includes("cambio de horario")) return "🔄";
  if (label.includes("formatos y reportes")) return "🗃️";
  if (label.includes("lineamientos academicos")) return "🎓";
  if (label.includes("lineamientos de evaluacion")) return "📝";
  if (label.includes("reglas de asistencia")) return "📍";
  if (label.includes("classroom") || label.includes("plataformas")) return "💻";
  if (label.includes("fechas y cierres")) return "⏳";
  if (label.includes("incidencia tecnica")) return "🛠️";
  if (label.includes("incidencia academica")) return "📚";
  if (label.includes("soporte de operaciones")) return "🏢";
  if (label.includes("atencion urgente")) return "🚨";
  if (label.includes("coordinacion academica")) return "🎓";
  if (label.includes("operaciones docentes")) return "🏢";
  if (label.includes("soporte institucional")) return "🖥️";
  if (label.includes("directorio")) return "☎️";
  if (label.includes("reportes y seguimiento")) return "📨";
  if (label.includes("fechas clave")) return "📅";
  if (label.includes("cambios recientes")) return "🆕";
  if (label.includes("mantenimientos")) return "🛠️";
  if (label.includes("pendientes criticos")) return "⏰";
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

function getCommandHint(nodeId, hasAudience) {
  if (nodeId === ROOT_NODE_ID && !hasAudience) {
    return "Comandos: menú, ayuda, reiniciar";
  }

  if (nodeId === MAIN_MENU_ID) {
    return "Comandos: menú, reiniciar, ayuda";
  }

  return "Comandos: menú, volver, ayuda";
}

function buildResponse(lines) {
  return [BRAND, "", ...lines].join("\n");
}

function buildMenuMessage(node, children, selectedAudience) {
  return buildResponse([
    getAudienceLabel(selectedAudience),
    "",
    `📂 ${node.label}`,
    "",
    ...formatOptions(children),
    "",
    getCommandHint(node.id, selectedAudience !== "both" || node.id !== ROOT_NODE_ID)
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

function appendCommandHint(lines, nodeId, selectedAudience) {
  return [
    ...lines,
    "",
    getCommandHint(nodeId, selectedAudience !== "both" || nodeId !== ROOT_NODE_ID)
  ];
}

function formatSuggestionItem(item) {
  if (item.parentLabel) {
    return `${getNodeIcon(item)} ${item.label} · ${item.parentLabel}`;
  }

  return `${getNodeIcon(item)} ${item.label}`;
}

function findDeepSuggestedOptions(userText, children, nodes, selectedAudience) {
  const normalized = normalizeText(userText);
  if (!normalized) return [];

  return children
    .filter((child) => child.type === "menu")
    .flatMap((child) =>
      getVisibleChildren(child, nodes, selectedAudience).map((grandchild) => ({
        ...grandchild,
        parentLabel: child.label,
        score: scoreNode(normalized, grandchild)
      }))
    )
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildFallbackMessage(node, children, nodes, selectedAudience, userText) {
  const likely = findSuggestedOptions(userText, children);
  const deepLikely = likely.length ? [] : findDeepSuggestedOptions(userText, children, nodes, selectedAudience);
  const chosenSuggestions = likely.length ? likely : deepLikely;
  const suggestionsSource = chosenSuggestions.length
    ? chosenSuggestions.map((item) => formatSuggestionItem(item))
    : children.slice(0, 4).map((child) => formatSuggestionItem(child));
  const suggestions = suggestionsSource.map((label, index) => `${index + 1}. ${label}`);

  return buildResponse(
    appendCommandHint(
      [
        getAudienceLabel(selectedAudience),
        "",
        `⚠️ No ubiqué esa opción en: ${node.label}.`,
        "",
        ...(chosenSuggestions.length ? ["Posibles rutas:", ""] : []),
        ...suggestions,
        "",
        "Use menú, inicio o ayuda."
      ],
      node.id,
      selectedAudience
    )
  );
}

function buildAmbiguousMessage(suggestions, selectedAudience) {
  return buildResponse(
    appendCommandHint(
      [
        getAudienceLabel(selectedAudience),
        "",
        "⚠️ Ubico más de una ruta posible.",
        "",
        ...suggestions.map((item, index) => `${index + 1}. ${getNodeIcon(item)} ${item.label}`),
        "",
        "Escriba el número o el nombre más completo."
      ],
      MAIN_MENU_ID,
      selectedAudience
    )
  );
}

function buildConfirmationMessage(suggestions, selectedAudience) {
  return buildResponse(
    appendCommandHint(
      [
        getAudienceLabel(selectedAudience),
        "",
        "❓ Detecté una ruta probable.",
        "",
        "Posibles opciones:",
        "",
        ...suggestions.map((item, index) => `${index + 1}. ${getNodeIcon(item)} ${item.label}`),
        "",
        "Escriba el número, el nombre completo o ajuste su texto."
      ],
      MAIN_MENU_ID,
      selectedAudience
    )
  );
}

function buildSystemMessage(message, selectedAudience, nodeId = MAIN_MENU_ID) {
  return buildResponse(
    appendCommandHint(
      [
        getAudienceLabel(selectedAudience),
        "",
        message
      ],
      nodeId,
      selectedAudience
    )
  );
}

function tokenize(text = "") {
  return normalizeText(text).split(" ").filter(Boolean);
}

function getNodeMatchTexts(node) {
  return [node.label, ...(Array.isArray(node.aliases) ? node.aliases : [])]
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function getNodeKeywords(node) {
  return (Array.isArray(node.keywords) ? node.keywords : [])
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function getEditDistance(leftText, rightText) {
  const left = normalizeText(leftText);
  const right = normalizeText(rightText);

  if (!left || !right) return Number.MAX_SAFE_INTEGER;
  if (left === right) return 0;

  const dp = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));

  for (let i = 0; i <= left.length; i++) dp[i][0] = i;
  for (let j = 0; j <= right.length; j++) dp[0][j] = j;

  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[left.length][right.length];
}

function scoreMatch(input, candidate) {
  const text = normalizeText(input);
  const normalizedLabel = normalizeText(candidate);

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

  const distance = getEditDistance(text, normalizedLabel);
  if (distance === 1) return 66;
  if (distance === 2 && text.length >= 5) return 62;

  return 0;
}

function scoreNode(userText, node) {
  const normalized = normalizeText(userText);
  const texts = getNodeMatchTexts(node);
  const keywords = getNodeKeywords(node);

  const textScores = texts.map((candidate) => scoreMatch(normalized, candidate));
  let bestScore = textScores.length ? Math.max(...textScores) : 0;

  const inputTokens = tokenize(normalized);
  const keywordMatches = keywords.filter((keyword) => {
    const keywordTokens = tokenize(keyword);
    return keywordTokens.some((token) =>
      inputTokens.some((inputToken) => inputToken.startsWith(token) || token.startsWith(inputToken))
    );
  }).length;

  if (keywordMatches > 0) {
    bestScore = Math.max(bestScore, 40 + keywordMatches * 8);
  }

  if (texts.some((candidate) => candidate.includes(normalized) && normalized.length >= 4)) {
    bestScore = Math.max(bestScore, 78);
  }

  return bestScore;
}

function scoreCommandMatch(input, candidate) {
  const normalizedInput = normalizeText(input);
  const normalizedCandidate = normalizeText(candidate);

  if (!normalizedInput || !normalizedCandidate) return 0;
  if (normalizedInput === normalizedCandidate) return 100;

  // Los comandos globales deben requerir más certeza que las opciones del menú.
  // Así evitamos que fragmentos cortos como "ver" activen "volver".
  if (normalizedInput.length >= 4 && normalizedCandidate.startsWith(normalizedInput)) return 90;

  if (normalizedInput.length >= 5 && normalizedCandidate.length >= 6) {
    const distance = getEditDistance(normalizedInput, normalizedCandidate);
    if (distance === 1) return 84;
  }

  return 0;
}

function findCommandMatch(userText) {
  const normalized = normalizeText(userText);
  if (!normalized) return null;

  let best = { command: null, score: 0 };

  for (const [command, aliases] of Object.entries(COMMAND_ALIASES)) {
    const score = Math.max(...aliases.map((alias) => scoreCommandMatch(normalized, alias)), 0);
    if (score > best.score) {
      best = { command, score };
    }
  }

  return best.score >= 84 ? best.command : null;
}

function findMatchingOption(userText, children) {
  const normalized = normalizeText(userText);

  if (!normalized) return { match: null, ambiguous: false, suggestions: [] };

  if (/^\d+$/.test(normalized)) {
    const index = Number(normalized) - 1;
    if (index >= 0 && index < children.length) {
      return { match: children[index], ambiguous: false, suggestions: [], needsConfirmation: false };
    }
  }

  const ranked = children
    .map((child) => ({
      child,
      score: scoreNode(normalized, child)
    }))
    .filter((item) => item.score >= 60)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return { match: null, ambiguous: false, suggestions: [], needsConfirmation: false };
  }

  if (ranked[0].score >= 85 && (!ranked[1] || ranked[0].score - ranked[1].score >= 5)) {
    const topCandidateTexts = getNodeMatchTexts(ranked[0].child);
    const exactTextMatch = topCandidateTexts.includes(normalized);
    const exactNumericMatch = /^\d+$/.test(normalized);

    return {
      match: ranked[0].child,
      ambiguous: false,
      suggestions: exactTextMatch || exactNumericMatch ? [] : [ranked[0].child.label],
      needsConfirmation: !(exactTextMatch || exactNumericMatch)
    };
  }

  if (ranked.length > 1 && ranked[0].score === ranked[1].score && ranked[0].score < 100) {
    return {
      match: null,
      ambiguous: true,
      suggestions: ranked.slice(0, 3).map((item) => item.child),
      needsConfirmation: false
    };
  }

  if (ranked[0].score < 85) {
    return {
      match: null,
      ambiguous: true,
      suggestions: ranked.slice(0, 3).map((item) => item.child),
      needsConfirmation: false
    };
  }

  return { match: ranked[0].child, ambiguous: false, suggestions: [], needsConfirmation: false };
}

function findSuggestedOptions(userText, children) {
  const normalized = normalizeText(userText);

  if (!normalized) return [];

  return children
    .map((child) => ({
      child,
      score: scoreNode(normalized, child)
    }))
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.child);
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
        metrics: mergeMetrics(saved.metrics),
        pendingSuggestions: Array.isArray(saved.pendingSuggestions) ? saved.pendingSuggestions : [],
        pendingInput: saved.pendingInput || null,
        pendingNodeId: saved.pendingNodeId || null
      };
    }

    const saveSession = async () => {
      await sessionRef.set(
        {
          audience: session.audience,
          currentNodeId: session.currentNodeId,
          stack: session.stack,
          metrics: session.metrics,
          pendingSuggestions: session.pendingSuggestions,
          pendingInput: session.pendingInput,
          pendingNodeId: session.pendingNodeId,
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
        text: buildMenuMessage(node, children, selectedAudience)
      });
    };

    if (sessionSnap.exists && isSessionExpired(session.updatedAt)) {
      session = createDefaultSession(rootNodeId);
      bumpMetric(session, "restartCount");
      await saveSession();

      const rootNode = getNode(nodes, rootNodeId);
      const rootChildren = getVisibleChildren(rootNode, nodes, "both");

      return res.json({
        text: buildResponse(
          appendCommandHint(
            [
              "⏳ La sesión anterior se cerró por inactividad.",
              "",
              `📂 ${rootNode.label}`,
              "",
              ...formatOptions(rootChildren)
            ],
            rootNode.id,
            "both"
          )
        )
      });
    }

    const matchedCommand = findCommandMatch(userText);

    if (matchedCommand === "ayuda") {
      clearPendingSuggestions(session);
      registerCommand(session, "ayuda");
      await saveSession();
      return res.json({ text: buildHelpMessage() });
    }

    if (matchedCommand === "reiniciar") {
      session = createDefaultSession(rootNodeId);
      bumpMetric(session, "restartCount");
      registerCommand(session, "reiniciar");
      const rootNode = getNode(nodes, rootNodeId);
      const rootChildren = getVisibleChildren(rootNode, nodes, "both");
      await saveSession();

      return res.json({
        text: buildResponse(
          appendCommandHint(
            [
              "🔄 Sesión reiniciada.",
              "",
              `📂 ${rootNode.label}`,
              "",
              ...formatOptions(rootChildren)
            ],
            rootNode.id,
            "both"
          )
        )
      });
    }

    if (matchedCommand === "inicio") {
      clearPendingSuggestions(session);
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

    if (matchedCommand === "menu") {
      clearPendingSuggestions(session);
      registerCommand(session, "menu");
      const node = getNode(nodes, session.currentNodeId) || getNode(nodes, rootNodeId);
      return openMenu(node.id, session.audience || "both");
    }

    if (matchedCommand === "volver") {
      clearPendingSuggestions(session);
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

    if (matchedCommand === "soporte") {
      clearPendingSuggestions(session);
      registerCommand(session, "soporte");
      bumpMetric(session, "supportCount");
      session.currentNodeId = SUPPORT_MENU_ID;
      session.stack = [MAIN_MENU_ID, SUPPORT_MENU_ID];
      return openMenu(SUPPORT_MENU_ID, session.audience || "both");
    }

    if (matchedCommand === "contacto") {
      clearPendingSuggestions(session);
      registerCommand(session, "contacto");
      bumpMetric(session, "contactCount");
      session.currentNodeId = CONTACT_MENU_ID;
      session.stack = [MAIN_MENU_ID, CONTACT_MENU_ID];
      return openMenu(CONTACT_MENU_ID, session.audience || "both");
    }

    if (matchedCommand === "urgente") {
      clearPendingSuggestions(session);
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
      clearPendingSuggestions(session);
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

    if (session.pendingSuggestions.length && session.pendingNodeId === node.id) {
      const pendingChildren = session.pendingSuggestions
        .map((id) => getNode(nodes, id))
        .filter(Boolean);

      const pendingResult = findMatchingOption(userText, pendingChildren);

      if (pendingResult.match && !pendingResult.needsConfirmation) {
        clearPendingSuggestions(session);
        const matched = pendingResult.match;

        if (matched.type === "menu") {
          session.currentNodeId = matched.id;
          session.stack.push(matched.id);
          registerMatch(session, matched.id, "menu");
          await saveSession();

          const nextChildren = getVisibleChildren(matched, nodes, session.audience || "both");
          return res.json({
            text: buildMenuMessage(matched, nextChildren, session.audience || "both")
          });
        }

        if (matched.type === "leaf") {
          registerMatch(session, matched.id, "leaf");
          await saveSession();
          return res.json({
            text: buildLeafMessage(matched, session.audience || "both")
          });
        }
      }
    }

    if (node.type !== "menu") {
      clearPendingSuggestions(session);
      session.currentNodeId = session.audience ? MAIN_MENU_ID : rootNodeId;
      session.stack = session.audience ? [MAIN_MENU_ID] : [];
      return openMenu(session.currentNodeId, session.audience || "both");
    }

    const children = getVisibleChildren(node, nodes, session.audience || "both");
    const result = findMatchingOption(userText, children);

    if (result.ambiguous) {
      bumpMetric(session, "ambiguousCount");
      session.pendingSuggestions = result.suggestions
        .map((child) => child?.id)
        .filter(Boolean);
      session.pendingInput = incomingText;
      session.pendingNodeId = node.id;
      await saveSession();
      return res.json({
        text: buildConfirmationMessage(
          session.pendingSuggestions.map((id) => getNode(nodes, id)).filter(Boolean),
          session.audience || "both"
        )
      });
    }

    if (result.needsConfirmation) {
      bumpMetric(session, "ambiguousCount");
      session.pendingSuggestions = [result.match.id];
      session.pendingInput = incomingText;
      session.pendingNodeId = node.id;
      await saveSession();
      return res.json({
        text: buildConfirmationMessage(
          session.pendingSuggestions.map((id) => getNode(nodes, id)).filter(Boolean),
          session.audience || "both"
        )
      });
    }

    if (!result.match) {
      clearPendingSuggestions(session);
      registerFallback(session, incomingText);
      await saveSession();
      return res.json({
        text: buildFallbackMessage(node, children, nodes, session.audience || "both", incomingText)
      });
    }

    const matched = result.match;
    clearPendingSuggestions(session);

    if (matched.type === "audience_option") {
      registerMatch(session, matched.id, "menu");
      session.audience = matched.value;
      session.currentNodeId = MAIN_MENU_ID;
      session.stack = [MAIN_MENU_ID];
      await saveSession();

      const mainMenu = getNode(nodes, MAIN_MENU_ID);
      const mainChildren = getVisibleChildren(mainMenu, nodes, session.audience);

      return res.json({
        text: buildResponse(
          appendCommandHint(
            [
              getAudienceLabel(session.audience),
              "",
              `✅ Contexto confirmado: ${matched.label}.`,
              "",
              `📂 ${mainMenu.label}`,
              "",
              ...formatOptions(mainChildren)
            ],
            mainMenu.id,
            session.audience
          )
        )
      });
    }

    if (matched.type === "menu") {
      session.currentNodeId = matched.id;
      session.stack.push(matched.id);
      registerMatch(session, matched.id, "menu");
      await saveSession();

      const nextChildren = getVisibleChildren(matched, nodes, session.audience || "both");
      return res.json({
        text: buildMenuMessage(matched, nextChildren, session.audience || "both")
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
