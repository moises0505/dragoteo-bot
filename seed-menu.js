const { Firestore } = require("@google-cloud/firestore");

const db = new Firestore();
const nodes = {};

function addMenu(id, label, children = [], audience = "both") {
  // Nodo navegable: muestra opciones hijas y puede filtrarse por audiencia.
  nodes[id] = { id, label, type: "menu", audience, children };
}

function addLeaf(id, label, audience = "both", response = null) {
  // Nodo terminal: representa una duda concreta. El contenido definitivo
  // vive en `response` cuando ya fue redactado y validado.
  const node = { id, label, type: "leaf", audience };
  if (response) node.response = response;
  nodes[id] = node;
}

function addAudienceOption(id, label, value) {
  // Opción especial del filtro inicial. No es una hoja de contenido:
  // fija el contexto de audiencia antes de entrar al menú principal.
  nodes[id] = {
    id,
    label,
    type: "audience_option",
    audience: "both",
    value
  };
}

/* =========================
   FILTRO INICIAL
========================= */

addMenu("audience_selector", "👋 Antes de continuar, dime si tu duda es de:", [
  "aud_prepa",
  "aud_universidad",
  "aud_ambas"
]);

addAudienceOption("aud_prepa", "🏫 Preparatoria", "prepa");
addAudienceOption("aud_universidad", "🎓 Universidad", "universidad");
addAudienceOption("aud_ambas", "🔀 Ambas", "ambas");

/* =========================
   MENÚ PRINCIPAL
========================= */

addMenu("main_menu", "🧭 Menú principal", [
  "m_academic",
  "biblioteca",
  "op_docentes",
  "op_academicas",
  "directorio",
  "classroom",
  "pap",
  "reportes"
]);

/* =========================
   ACADEMIC MANAGER
========================= */

addMenu("m_academic", "📘 Academic Manager", [
  "m_ac1",
  "m_grupos",
  "m_asistencia",
  "m_calificaciones",
  "m_horarios",
  "m_reportes_actas",
  "m_noduda1"
]);

addLeaf("m_ac1", "¿Cómo acceso a Academic Manager?");

addMenu("m_grupos", "👥 Grupos", [
  "m_gr1",
  "m_gr2"
]);

addLeaf("m_gr1", "¿Cómo identificar mi grupo?");
addLeaf("m_gr2", "¿Cómo saber si tengo asignado mi grupo?");

addMenu("m_asistencia", "🗓️ Asistencia", [
  "m_as1",
  "m_as2",
  "m_as3",
  "m_as4"
]);

addLeaf("m_as1", "¿Cómo descargo mi lista de asistencia?");
addLeaf("m_as2", "Lista de asistencia desactualizada o incongruente");
addLeaf("m_as3", "¿Cómo capturo las faltas?");
addLeaf("m_as4", "¿Cómo consulto las faltas?");

addMenu("m_calificaciones", "📝 Calificaciones", [
  "m_ca1",
  "m_ca2",
  "m_ca3"
]);

addLeaf("m_ca1", "Tipos de rúbrica");
addLeaf("m_ca2", "Errores de captura");
addLeaf("m_ca3", "¿Cómo capturar calificaciones?");

addMenu("m_horarios", "🕒 Horarios", [
  "m_ho1"
]);

addMenu("m_ho1", "¿Cómo veo mi horario de clases?", [
  "m_ho1_a",
  "m_ho1_b",
  "m_ho1_c"
]);

addLeaf("m_ho1_a", "¿Cómo identifico mi salón?");
addLeaf("m_ho1_b", "¿Cómo identifico el nombre de mi clase y grupo?");
addLeaf("m_ho1_c", "Solicitud de cambio de horario");

addMenu("m_reportes_actas", "📄 Reportes y actas", [
  "m_re1",
  "m_re2"
]);

addLeaf("m_re1", "¿Cómo genero actas académicas y las envío?");
addLeaf("m_re2", "Tipos de reportes");

addLeaf("m_noduda1", "¿No aparece tu duda? Elige esta opción");

/* =========================
   BIBLIOTECA
========================= */

addMenu("biblioteca", "📚 Biblioteca y Nido Dragón", [
  "b_prestamo",
  "b_digital",
  "b_salas",
  "b_autores",
  "b_noduda2"
]);

addLeaf("b_prestamo", "Préstamo de libros");
addLeaf("b_digital", "Biblioteca digital");
addLeaf("b_salas", "Reservación de salas");
addLeaf("b_autores", "Programa de Autores Mondragón");
addLeaf("b_noduda2", "¿No aparece tu duda? Elige esta opción");

/* =========================
   OPERACIONES DOCENTES
========================= */

addMenu("op_docentes", "👨‍🏫 Operaciones Docentes", [
  "od_clases",
  "od_ausencia",
  "od_salon",
  "od_nomina",
  "od_datos",
  "od_constancia",
  "od_capacitacion",
  "od_crono",
  "od_noduda3"
]);

addLeaf("od_clases", "Cómo sé qué clases se me asignaron");
addLeaf("od_ausencia", "Solicitud de ausencia");
addLeaf("od_salon", "Solicitud de cambio de salón");
addLeaf("od_nomina", "Dudas sobre contratos y nómina");
addLeaf("od_datos", "Actualización de datos y documentos");
addLeaf("od_constancia", "Constancia laboral");
addLeaf("od_capacitacion", "Capacitación docente");
addLeaf("od_crono", "Cronograma de actividades docentes");
addLeaf("od_noduda3", "¿No aparece tu duda? Elige esta opción");

/* =========================
   OPERACIONES ACADÉMICAS
========================= */

addMenu("op_academicas", "⚙️ Operaciones Académicas", [
  "oa_correo",
  "oa_veranos",
  "oa_noduda4"
]);

addLeaf("oa_correo", "Correo electrónico institucional");
addLeaf("oa_veranos", "Veranos");
addLeaf("oa_noduda4", "¿No aparece tu duda? Elige esta opción");

/* =========================
   DIRECTORIO
========================= */

addMenu("directorio", "📇 Directorio de Academia", [
  "dir_univ",
  "dir_prepa",
  "dir_noduda5"
]);

addMenu("dir_univ", "🎓 Universidad", [
  "du_facultades",
  "du_coords",
  "du_opera",
  "du_vice"
], "universidad");

addMenu("du_facultades", "🏛️ Direcciones de facultades", [
  "du_f1",
  "du_f2",
  "du_f3",
  "du_f4",
  "du_f5",
  "du_f6",
  "du_f7"
], "universidad");

addLeaf("du_f1", "Negocios", "universidad");
addLeaf("du_f2", "Psicología y Educación", "universidad");
addLeaf("du_f3", "Contabilidad, Finanzas y Marketing", "universidad");
addLeaf("du_f4", "Gastronomía, Nutrición y Turismo", "universidad");
addLeaf("du_f5", "Ingeniería", "universidad");
addLeaf("du_f6", "Diseño", "universidad");
addLeaf("du_f7", "Derecho", "universidad");

addMenu("du_coords", "🧩 Coordinaciones y asuntos", [
  "du_c1",
  "du_c2",
  "du_c3",
  "du_c4",
  "du_c5"
], "universidad");

addLeaf("du_c1", "Asuntos Internacionales", "universidad");
addLeaf("du_c2", "Alternancia", "universidad");
addLeaf("du_c3", "Emprendizaje", "universidad");
addLeaf("du_c4", "Inteligencia Artificial", "universidad");
addLeaf("du_c5", "Proyecto de Vida", "universidad");

addMenu("du_opera", "⚙️ Operaciones Acad. y Docentes", [
  "du_o1",
  "du_o2",
  "du_o3",
  "du_o4"
], "universidad");

addLeaf("du_o1", "Dirección de Operaciones", "universidad");
addLeaf("du_o2", "Coord. de Operaciones Acad.", "universidad");
addLeaf("du_o3", "Auxiliar de Operaciones Acad.", "universidad");
addLeaf("du_o4", "Coord. de Operaciones Docentes", "universidad");

addLeaf("du_vice", "Vicerrectoría", "universidad");

addMenu("dir_prepa", "🏫 Preparatoria", [
  "dp_g1",
  "dp_g2",
  "dp_g3",
  "dp_umx",
  "dp_op1",
  "dp_op2"
], "prepa");

addLeaf("dp_g1", "Dirección de Generación 1 y 2", "prepa");
addLeaf("dp_g2", "Dirección de Generación 3 y 4", "prepa");
addLeaf("dp_g3", "Dirección de Generación 5 y 6", "prepa");
addLeaf("dp_umx", "Dirección de Prepa UMX", "prepa");
addLeaf("dp_op1", "Dir. de Operaciones Acad. y Docentes", "prepa");
addLeaf("dp_op2", "Ejecutivo de Operaciones Acad. y Docentes", "prepa");

addLeaf("dir_noduda5", "¿No aparece la persona? Elige esta opción");

/* =========================
   CLASSROOM
========================= */

addMenu("classroom", "💻 Classroom", [
  "c_aulas",
  "c_tutoriales",
  "c_tareas",
  "c_evaluacion",
  "c_alumnos",
  "c_tablon",
  "c_noduda6"
]);

addMenu("c_aulas", "🏫 Aulas virtuales y grupos", [
  "c_au1"
]);

addLeaf("c_au1", "No tengo asignados mis grupos");

addMenu("c_tutoriales", "🎥 Tutoriales", [
  "c_tu1",
  "c_tu2",
  "c_tu3"
]);

addLeaf("c_tu1", "Aulas y código de inscripción");
addLeaf("c_tu2", "¿Cómo veo mis aulas virtuales?");
addLeaf("c_tu3", "¿Cómo veo mi código de inscripción?");

addMenu("c_tareas", "📌 Tareas y materiales", [
  "c_ta1",
  "c_ta2"
]);

addLeaf("c_ta1", "¿Cómo publicar y programar tareas?");
addLeaf("c_ta2", "Tipos de tareas y materiales");

addMenu("c_evaluacion", "📊 Evaluación y calificaciones", [
  "c_ev1",
  "c_ev2",
  "c_ev3"
]);

addLeaf("c_ev1", "¿Cómo capturar calificaciones?");
addLeaf("c_ev2", "¿Cómo descargar calificaciones?");
addLeaf("c_ev3", "¿Cómo configurar una rúbrica?");

addMenu("c_alumnos", "👩‍🎓 Alumnos", [
  "c_al1",
  "c_al2"
]);

addLeaf("c_al1", "¿Cómo veo a mis alumnos inscritos?");
addLeaf("c_al2", "¿Cómo me comunico con un alumno?");

addMenu("c_tablon", "📣 Tablón", [
  "c_tb1",
  "c_tb2"
]);

addLeaf("c_tb1", "¿Cómo uso el tablón de Classroom?");
addLeaf("c_tb2", "¿Cómo programo un aviso?");

addLeaf("c_noduda6", "¿No aparece tu duda? Elige esta opción");

/* =========================
   PAP
========================= */

addMenu("pap", "🧠 Atención Psicológica (PAP)", [
  "p_proceso"
]);

addLeaf("p_proceso", "Proceso y contacto");

/* =========================
   REPORTES Y SUGERENCIAS
========================= */

addMenu("reportes", "⚠️ Reportes y sugerencias", [
  "r_sug",
  "r_rep"
]);

addLeaf("r_sug", "Sugerencia");
addLeaf("r_rep", "Reportes");

/* =========================
   GUARDAR
========================= */

async function main() {
  // Este script publica la versión editable del árbol como documento
  // fuente para el runtime del bot en `publishedMenus/main`.
  const data = {
    name: "DRAGOTEO",
    status: "published",
    version: 2,
    welcomeMessage: "Hola, soy DRAGOTEO. Vamos a ubicar tu duda paso a paso.",
    rootNodeId: "audience_selector",
    nodes
  };

  // `set` reemplaza el documento completo, así que conviene ejecutarlo
  // solo cuando ya se validó la estructura final del menú.
  await db.collection("publishedMenus").doc("main").set(data);
  console.log("✅ Documento publishedMenus/main actualizado correctamente.");
}

main().catch((err) => {
  console.error("❌ Error al cargar el menú:", err);
  process.exit(1);
});
