const { Firestore } = require("@google-cloud/firestore");

const db = new Firestore();
const nodes = {};

function addMenu(id, label, children = [], audience = "both") {
  nodes[id] = { id, label, type: "menu", audience, children };
}

function addLeaf(id, label, audience = "both", response = null) {
  const node = { id, label, type: "leaf", audience };
  if (response) node.response = response;
  nodes[id] = node;
}

function addAliases(id, aliases) {
  if (!nodes[id]) {
    throw new Error(`No existe el nodo para asignar alias: ${id}`);
  }

  nodes[id].aliases = aliases;
}

function addKeywords(id, keywords) {
  if (!nodes[id]) {
    throw new Error(`No existe el nodo para asignar keywords: ${id}`);
  }

  nodes[id].keywords = keywords;
}

function addAudienceOption(id, label, value) {
  nodes[id] = {
    id,
    label,
    type: "audience_option",
    audience: "both",
    value
  };
}

/* =========================
   CONTEXTO INICIAL
========================= */

addMenu("audience_selector", "Seleccione su contexto docente", [
  "aud_prepa",
  "aud_universidad",
  "aud_ambas",
  "aud_no_seguro"
]);

addAudienceOption("aud_prepa", "Preparatoria", "prepa");
addAudienceOption("aud_universidad", "Universidad", "universidad");
addAudienceOption("aud_ambas", "Ambas", "ambas");
addAudienceOption("aud_no_seguro", "No estoy seguro", "ambas");

/* =========================
   MENÚ PRINCIPAL
========================= */

addMenu("main_menu", "Ruta docente", [
  "classes_menu",
  "evaluation_menu",
  "spaces_menu",
  "requests_menu",
  "rules_menu",
  "support_menu",
  "contacts_menu",
  "alerts_menu"
]);

/* =========================
   CLASES Y HORARIOS
========================= */

addMenu("classes_menu", "Clases y horarios", [
  "class_schedule",
  "class_groups",
  "class_assignment",
  "class_calendar",
  "class_attendance"
]);

addLeaf(
  "class_schedule",
  "Ver horario docente",
  "both",
  "Revise su horario y grupo asignado.\nSi hay diferencia, escriba soporte."
);
addLeaf(
  "class_groups",
  "Identificar grupo y clase",
  "both",
  "Ubique materia, grupo y salón desde su horario activo."
);
addLeaf(
  "class_assignment",
  "Clases asignadas",
  "both",
  "Confirme carga docente y grupos vigentes.\nSi falta una clase, use soporte."
);
addLeaf(
  "class_calendar",
  "Calendario académico",
  "both",
  "Consulte fechas de clase, parciales y cierres del periodo."
);
addLeaf(
  "class_attendance",
  "Asistencia y seguimiento",
  "both",
  "Ubique pase de lista y seguimiento del grupo desde su ruta académica."
);

/* =========================
   EVALUACIÓN Y PARCIALES
========================= */

addMenu("evaluation_menu", "Evaluación y parciales", [
  "eval_grading",
  "eval_rubrics",
  "eval_partial_dates",
  "eval_capture_errors",
  "eval_records"
]);

addLeaf(
  "eval_grading",
  "Captura de calificaciones",
  "both",
  "Utilice la captura vigente del periodo.\nSi hay bloqueo, escriba soporte."
);
addLeaf(
  "eval_rubrics",
  "Rúbricas y criterios",
  "both",
  "Revise el tipo de rúbrica y el criterio aplicable al curso."
);
addLeaf(
  "eval_partial_dates",
  "Fechas de parciales",
  "both",
  "Consulte el calendario institucional del periodo antes de capturar."
);
addLeaf(
  "eval_capture_errors",
  "Errores de captura",
  "both",
  "Si la captura no coincide con el grupo o la materia, use soporte."
);
addLeaf(
  "eval_records",
  "Actas y reportes",
  "both",
  "Ubique la ruta institucional para reportes, actas y cierre académico."
);

/* =========================
   AULAS Y ESPACIOS
========================= */

addMenu("spaces_menu", "Aulas y espacios", [
  "space_room",
  "space_change",
  "space_virtual",
  "space_resources",
  "space_library"
]);

addLeaf(
  "space_room",
  "Aula asignada",
  "both",
  "Verifique salón y sede en su horario vigente."
);
addLeaf(
  "space_change",
  "Cambio de aula o espacio",
  "both",
  "Para un ajuste, siga la solicitud institucional de operaciones."
);
addLeaf(
  "space_virtual",
  "Aulas virtuales",
  "both",
  "Revise aula virtual, grupos y acceso a Classroom."
);
addLeaf(
  "space_resources",
  "Espacios y recursos",
  "both",
  "Solicite apoyo si requiere un espacio o recurso no disponible."
);
addLeaf(
  "space_library",
  "Biblioteca y salas",
  "both",
  "Consulte préstamo, salas y biblioteca digital desde esta ruta."
);

/* =========================
   FORMATOS Y SOLICITUDES
========================= */

addMenu("requests_menu", "Formatos y solicitudes", [
  "req_absence",
  "req_documents",
  "req_constancy",
  "req_schedule_change",
  "req_reports"
]);

addLeaf(
  "req_absence",
  "Solicitud de ausencia",
  "both",
  "Use la vía institucional de operaciones docentes para ausencias."
);
addLeaf(
  "req_documents",
  "Actualización de datos y documentos",
  "both",
  "Prepare su solicitud con datos vigentes y soporte documental."
);
addLeaf(
  "req_constancy",
  "Constancia laboral",
  "both",
  "Solicite la constancia por la ruta institucional correspondiente."
);
addLeaf(
  "req_schedule_change",
  "Cambio de horario",
  "both",
  "Valide primero el impacto académico antes de solicitar un cambio."
);
addLeaf(
  "req_reports",
  "Formatos y reportes frecuentes",
  "both",
  "Ubique el formato correcto antes de enviar una solicitud."
);

/* =========================
   REGLAMENTOS Y LINEAMIENTOS
========================= */

addMenu("rules_menu", "Reglamentos y lineamientos", [
  "rule_academic",
  "rule_evaluation",
  "rule_attendance",
  "rule_classroom",
  "rule_period"
]);

addLeaf(
  "rule_academic",
  "Lineamientos académicos",
  "both",
  "Consulte la norma académica vigente aplicable a su programa."
);
addLeaf(
  "rule_evaluation",
  "Lineamientos de evaluación",
  "both",
  "Revise criterios, parciales y cierre antes de capturar."
);
addLeaf(
  "rule_attendance",
  "Reglas de asistencia",
  "both",
  "Aplique la regla vigente del periodo y del nivel correspondiente."
);
addLeaf(
  "rule_classroom",
  "Uso de Classroom y plataformas",
  "both",
  "Consulte la ruta institucional para uso correcto de plataformas."
);
addLeaf(
  "rule_period",
  "Fechas y cierres del periodo",
  "both",
  "Revise fechas clave antes de cualquier ajuste o captura."
);

/* =========================
   SOPORTE E INCIDENCIAS
========================= */

addMenu("support_menu", "Soporte e incidencias", [
  "support_technical",
  "support_academic",
  "support_operations",
  "support_platforms",
  "urgent_support"
]);

addLeaf(
  "support_technical",
  "Incidencia técnica",
  "both",
  "Si hay falla de acceso, captura o sistema, repórtela por soporte."
);
addLeaf(
  "support_academic",
  "Incidencia académica",
  "both",
  "Si afecta grupo, materia o evaluación, escale por la ruta académica."
);
addLeaf(
  "support_operations",
  "Soporte de operaciones",
  "both",
  "Si el tema es horario, aula o trámite, use operaciones docentes."
);
addLeaf(
  "support_platforms",
  "Soporte de plataformas",
  "both",
  "Para Classroom o herramientas digitales, documente la incidencia y escale."
);
addLeaf(
  "urgent_support",
  "Atención urgente",
  "both",
  "Escale de inmediato con su coordinación académica o soporte institucional."
);

/* =========================
   CONTACTOS CLAVE
========================= */

addMenu("contacts_menu", "Contactos clave", [
  "contact_coordination",
  "contact_operations",
  "contact_support",
  "contact_directory",
  "contact_reports"
]);

addLeaf(
  "contact_coordination",
  "Coordinación académica",
  "both",
  "Use esta ruta cuando el tema afecte grupo, materia, evaluación o calendario."
);
addLeaf(
  "contact_operations",
  "Operaciones docentes",
  "both",
  "Use esta ruta para horarios, aulas, ausencias o trámites."
);
addLeaf(
  "contact_support",
  "Soporte institucional",
  "both",
  "Use esta ruta para incidencias técnicas o bloqueos de plataforma."
);
addLeaf(
  "contact_directory",
  "Directorio institucional",
  "both",
  "Consulte directorio solo cuando necesite canalización específica."
);
addLeaf(
  "contact_reports",
  "Reportes y seguimiento",
  "both",
  "Si el tema requiere seguimiento formal, levante el reporte correspondiente."
);

/* =========================
   AVISOS IMPORTANTES
========================= */

addMenu("alerts_menu", "Avisos importantes", [
  "alert_calendar",
  "alert_changes",
  "alert_maintenance",
  "alert_deadlines"
]);

addLeaf(
  "alert_calendar",
  "Fechas clave",
  "both",
  "Consulte parciales, cierres y fechas de entrega vigentes."
);
addLeaf(
  "alert_changes",
  "Cambios recientes",
  "both",
  "Revise cambios operativos o académicos comunicados para el periodo."
);
addLeaf(
  "alert_maintenance",
  "Mantenimientos e incidencias",
  "both",
  "Confirme si hay afectaciones activas en sistemas o plataformas."
);
addLeaf(
  "alert_deadlines",
  "Pendientes críticos",
  "both",
  "Revise cierres, capturas y entregables próximos del periodo."
);

/* =========================
   ALIAS DE BÚSQUEDA
========================= */

addAliases("aud_prepa", ["prepa", "preparatoria", "bachillerato"]);
addAliases("aud_universidad", ["uni", "universidad", "licenciatura"]);
addAliases("aud_ambas", ["ambas", "los dos", "ambos"]);
addAliases("aud_no_seguro", ["no se", "no estoy seguro", "no seguro", "duda"]);

addAliases("classes_menu", ["horarios", "clases", "grupo", "calendario"]);
addAliases("evaluation_menu", ["evaluacion", "parciales", "calificaciones", "rubrica"]);
addAliases("spaces_menu", ["aulas", "salon", "espacios", "classroom"]);
addAliases("requests_menu", ["formatos", "solicitudes", "tramites", "documentos"]);
addAliases("rules_menu", ["reglamento", "lineamientos", "reglas", "normas"]);
addAliases("support_menu", ["soporte", "incidencias", "error", "problema"]);
addAliases("contacts_menu", ["contactos", "directorio", "coordinacion"]);
addAliases("alerts_menu", ["avisos", "fechas", "cambios", "mantenimiento"]);

addAliases("class_schedule", ["horario", "horarios", "mi horario"]);
addAliases("class_groups", ["grupo", "grupos", "clase", "materia"]);
addAliases("class_assignment", ["asignadas", "carga docente", "clases asignadas"]);
addAliases("class_calendar", ["calendario", "fechas", "periodo"]);
addAliases("class_attendance", ["asistencia", "lista", "pase de lista"]);

addAliases("eval_grading", ["calificaciones", "captura", "subir calificaciones"]);
addAliases("eval_rubrics", ["rubrica", "rubricas", "criterios"]);
addAliases("eval_partial_dates", ["parciales", "fecha parcial", "fechas de parcial"]);
addAliases("eval_capture_errors", ["error captura", "error al capturar", "falla captura"]);
addAliases("eval_records", ["actas", "reportes", "cierre"]);

addAliases("space_room", ["salon", "salon asignado", "aula"]);
addAliases("space_change", ["cambio de aula", "cambio de salon", "cambiar aula"]);
addAliases("space_virtual", ["classroom", "aula virtual", "aulas virtuales"]);
addAliases("space_resources", ["recursos", "espacio", "equipo"]);
addAliases("space_library", ["biblioteca", "salas", "prestamo"]);

addAliases("req_absence", ["ausencia", "falta", "permiso"]);
addAliases("req_documents", ["documentos", "datos", "actualizacion"]);
addAliases("req_constancy", ["constancia", "laboral"]);
addAliases("req_schedule_change", ["cambio de horario", "mover horario"]);
addAliases("req_reports", ["formato", "reportes", "solicitud"]);

addAliases("rule_academic", ["academico", "lineamientos academicos"]);
addAliases("rule_evaluation", ["lineamientos de evaluacion", "evaluacion"]);
addAliases("rule_attendance", ["reglas de asistencia", "asistencia"]);
addAliases("rule_classroom", ["classroom", "plataforma", "plataformas"]);
addAliases("rule_period", ["cierres", "fechas", "periodo"]);

addAliases("support_technical", ["tecnico", "sistema", "error tecnico"]);
addAliases("support_academic", ["academica", "academico", "problema academico"]);
addAliases("support_operations", ["operaciones", "horario", "aula"]);
addAliases("support_platforms", ["plataforma", "classroom", "acceso"]);
addAliases("urgent_support", ["urgente", "emergencia", "prioridad"]);

addAliases("contact_coordination", ["coordinacion", "coordinador"]);
addAliases("contact_operations", ["operaciones docentes", "operaciones"]);
addAliases("contact_support", ["soporte institucional", "soporte"]);
addAliases("contact_directory", ["directorio", "contactos"]);
addAliases("contact_reports", ["seguimiento", "reporte"]);

addAliases("alert_calendar", ["fechas clave", "calendario"]);
addAliases("alert_changes", ["cambios recientes", "cambios"]);
addAliases("alert_maintenance", ["mantenimiento", "incidencia"]);
addAliases("alert_deadlines", ["pendientes", "urgente", "vencimiento"]);

addKeywords("classes_menu", ["clase", "horario", "grupo", "materia"]);
addKeywords("evaluation_menu", ["evaluacion", "parcial", "calificacion", "rubrica"]);
addKeywords("spaces_menu", ["aula", "salon", "espacio", "classroom"]);
addKeywords("requests_menu", ["solicitud", "formato", "tramite", "documento"]);
addKeywords("rules_menu", ["reglamento", "lineamiento", "regla", "norma"]);
addKeywords("support_menu", ["soporte", "incidencia", "problema", "error"]);
addKeywords("contacts_menu", ["contacto", "directorio", "coordinacion", "area"]);
addKeywords("alerts_menu", ["aviso", "cambio", "fecha", "mantenimiento"]);

addKeywords("class_schedule", ["horario", "horarios", "agenda"]);
addKeywords("class_groups", ["grupo", "grupos", "materia", "clase"]);
addKeywords("class_assignment", ["asignacion", "asignadas", "carga"]);
addKeywords("class_calendar", ["calendario", "fechas", "periodo"]);
addKeywords("class_attendance", ["asistencia", "lista", "faltas"]);

addKeywords("eval_grading", ["calificaciones", "captura", "notas"]);
addKeywords("eval_rubrics", ["rubrica", "rubricas", "criterios"]);
addKeywords("eval_partial_dates", ["parciales", "fecha", "fechas"]);
addKeywords("eval_capture_errors", ["error", "captura", "falla"]);
addKeywords("eval_records", ["actas", "reportes", "cierre"]);

addKeywords("space_room", ["aula", "salon", "sede"]);
addKeywords("space_change", ["cambio", "aula", "salon"]);
addKeywords("space_virtual", ["classroom", "virtual", "acceso"]);
addKeywords("space_resources", ["recurso", "equipo", "espacio"]);
addKeywords("space_library", ["biblioteca", "sala", "prestamo"]);

addKeywords("req_absence", ["ausencia", "permiso", "falta"]);
addKeywords("req_documents", ["documentos", "datos", "actualizacion"]);
addKeywords("req_constancy", ["constancia", "laboral"]);
addKeywords("req_schedule_change", ["horario", "cambio"]);
addKeywords("req_reports", ["formato", "reporte", "solicitud"]);

addKeywords("rule_academic", ["academico", "academica", "norma"]);
addKeywords("rule_evaluation", ["evaluacion", "criterio", "parcial"]);
addKeywords("rule_attendance", ["asistencia", "faltas"]);
addKeywords("rule_classroom", ["classroom", "plataforma"]);
addKeywords("rule_period", ["cierres", "periodo", "fechas"]);

addKeywords("support_technical", ["tecnico", "sistema", "error"]);
addKeywords("support_academic", ["academico", "grupo", "materia"]);
addKeywords("support_operations", ["operaciones", "horario", "aula"]);
addKeywords("support_platforms", ["plataforma", "classroom", "acceso"]);
addKeywords("urgent_support", ["urgente", "emergencia", "prioridad"]);

addKeywords("contact_coordination", ["coordinacion", "academica"]);
addKeywords("contact_operations", ["operaciones", "docentes"]);
addKeywords("contact_support", ["soporte", "institucional"]);
addKeywords("contact_directory", ["directorio", "contacto"]);
addKeywords("contact_reports", ["seguimiento", "reporte"]);

addKeywords("alert_calendar", ["fecha", "calendario", "clave"]);
addKeywords("alert_changes", ["cambio", "nuevo", "reciente"]);
addKeywords("alert_maintenance", ["mantenimiento", "incidencia"]);
addKeywords("alert_deadlines", ["pendiente", "cierre", "vencimiento"]);

function validateMenuStructure() {
  const requiredNodes = ["audience_selector", "main_menu", "support_menu", "contacts_menu"];

  for (const id of requiredNodes) {
    if (!nodes[id]) {
      throw new Error(`Falta el nodo requerido: ${id}`);
    }
  }

  for (const node of Object.values(nodes)) {
    if (!["menu", "leaf", "audience_option"].includes(node.type)) {
      throw new Error(`Tipo de nodo inválido en ${node.id}`);
    }

    if (node.type === "menu") {
      for (const childId of node.children || []) {
        if (!nodes[childId]) {
          throw new Error(`El nodo ${node.id} referencia un hijo inexistente: ${childId}`);
        }
      }
    }
  }
}

async function main() {
  validateMenuStructure();

  const data = {
    name: "DragoTeo 🐉",
    status: "published",
    version: 3,
    welcomeMessage: "Seleccione una ruta docente.",
    rootNodeId: "audience_selector",
    nodes
  };

  await db.collection("publishedMenus").doc("main").set(data);
  console.log("✅ Documento publishedMenus/main actualizado correctamente.");
}

main().catch((err) => {
  console.error("❌ Error al cargar el menú:", err);
  process.exit(1);
});
