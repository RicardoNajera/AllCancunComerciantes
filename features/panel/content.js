/**
 * All Cancún Comercios — Textos del panel
 * Todo el texto visible vive aquí: si hay que cambiar una palabra,
 * se cambia en un solo sitio.
 *
 * Regla de oro: NADA simulado. Cada estado vacío dice qué falta de
 * verdad; nunca pone un ejemplo inventado.
 */

export const content = {
  /* --- Login --- */
  loginTitle: "Tu negocio, en orden",
  loginLead:
    "Entra con tu cuenta de Google para gestionar tu tienda en Cancún.",
  loginButton: "Continuar con Google",
  loginLegal: "Al entrar aceptas que usemos tu nombre y foto de Google.",

  /* --- Estados --- */
  loading: "Cargando tu negocio…",

  /* --- Sin negocio: alta --- */
  emptyEyebrow: "Primer paso",
  emptyTitle: "Abre tu negocio",
  emptyLead:
    "Crea tu tienda, arma tu menú y empieza a recibir clientes de Cancún.",
  emptyCta: "Crear mi negocio",

  /* --- Formulario de alta --- */
  formTitle: "Nuevo negocio",
  formLead: "Solo lo esencial. Lo demás lo puedes editar después.",
  fields: {
    nombre: {
      label: "Nombre del negocio",
      placeholder: "Cómo te conocen tus clientes",
      hint: "Tal como quieres que aparezca en la app.",
    },
    categoria: {
      label: "Categoría",
      placeholder: "Elige una",
      hint: "Sirve para que te encuentren en la sección correcta.",
    },
    colonia: {
      label: "Colonia",
      placeholder: "Dónde te encuentran",
      hint: "Solo la colonia. La dirección exacta es opcional.",
    },
    whatsapp: {
      label: "WhatsApp",
      placeholder: "10 dígitos",
      hint: "Por aquí te llegarán los pedidos.",
    },
    descripcion: {
      label: "Descripción",
      placeholder: "Qué vendes, en tus palabras",
      hint: "Máximo 280 caracteres. Di lo que haces.",
    },
  },
  formSave: "Crear negocio",
  formCancel: "Cancelar",

  /* --- Estados del negocio --- */
  statusBorrador: "Borrador",
  statusActivo: "Publicado",
  statusSuspendido: "Suspendido",

  statusHintBorrador: "Solo lo ves tú. Publícalo cuando esté listo.",
  statusHintActivo: "Visible para clientes en la app de All Cancún.",
  statusHintSuspendido: "Un moderador lo bajó. Escríbenos para revisarlo.",

  publishCta: "Publicar mi negocio",
  publishDone: "Tu negocio ya está visible",

  /* --- Pestañas de la barra inferior --- */
  tabs: {
    tienda: "Tienda",
    menu: "Menú",
    pedidos: "Pedidos",
    ajustes: "Ajustes",
  },

  /* --- Pestaña: Tienda --- */
  tienda: {
    title: "Mi tienda",
    coverLabel: "Foto de portada",
    coverHint: "Aquí va la foto que verán tus clientes primero.",
    coverAction: "Elegir foto",
    logoLabel: "Logo",
    logoHint: "Tu marca, cuadrada.",
    logoAction: "Elegir logo",

    aboutLabel: "Sobre tu negocio",
    aboutEmpty: "Todavía no escribiste una descripción.",

    locationLabel: "Ubicación",
    locationEmpty: "Sin colonia",
    hoursLabel: "Horario",
    hoursEmpty: "Sin horario",
    contactLabel: "Contacto",
    contactEmpty: "Sin WhatsApp",

    editCta: "Editar datos",

    /* Interruptor de atención: dice a los clientes si el negocio está
       atendiendo ahora mismo. Es distinto de "publicado": un negocio
       publicado puede estar cerrado porque ya terminó su horario.
       Los textos están escritos como se lo diría un amigo, no un manual:
       el comerciante tiene que sentir que depende de él, no que la app
       lo regaña. */
    atencionTitle: "¿Estás atendiendo?",
    atencionAbierto: "Abierto",
    atencionCerrado: "Cerrado",
    atencionHintAbierto:
      "Tus clientes ven que puedes tomar pedidos ahora.",
    atencionHintCerrado:
      "Tus clientes ven que estás cerrado. Tu negocio sigue en la app.",

    summaryTitle: "Cómo te ven tus clientes",
    summaryHint:
      "Así se ve tu tarjeta en la app. Se llena sola cuando guardas tus datos.",
  },

  /* --- Pestaña: Menú --- */
  menu: {
    title: "Mi menú",
    empty: "Aún no tienes productos",
    emptyLead: "Cada producto que agregues aparece en tu tienda.",
    cta: "Agregar producto",
    photoLabel: "Foto del producto",
    photoHint: "Una foto clara, con buena luz.",
    countOne: "1 producto",
    countMany: "{n} productos",
    countNone: "Sin productos",
    available: "Disponible",
    unavailable: "Agotado",
    toggleOn: "Marcar disponible",
    toggleOff: "Marcar agotado",
    deleteCta: "Quitar del menú",
    editCta: "Editar producto",
    priceEmpty: "Sin precio",
  },

  productFormTitle: "Nuevo producto",
  productEditTitle: "Editar producto",
  productFields: {
    nombre: {
      label: "Nombre",
      placeholder: "Qué es",
      hint: "Como lo pediría un cliente.",
    },
    precio: {
      label: "Precio",
      placeholder: "0.00",
      hint: "En pesos. Puedes editarlo cuando quieras.",
    },
    descripcion: {
      label: "Descripción",
      placeholder: "Qué lleva",
      hint: "Opcional. Ayuda a que lo elijan.",
    },
  },
  productSave: "Guardar producto",

  /* --- Pestaña: Pedidos --- */
  pedidos: {
    title: "Pedidos",
    empty: "No tienes pedidos todavía",
    emptyLead:
      "Cuando un cliente te compre por la app, el pedido aparecerá aquí.",
    emptyHint: "Para recibir pedidos, tu negocio tiene que estar publicado.",
    goPublish: "Ir a publicar",
    filterAll: "Todos",
    filterNew: "Nuevos",
    filterPrep: "Preparando",
    filterDone: "Listos",
  },

  /* --- Estados de un pedido --- */
  pedidoEstados: {
    nuevo: "Nuevo",
    preparando: "Preparando",
    listo: "Listo",
    entregado: "Entregado",
    cancelado: "Cancelado",
  },

  /* --- Pestaña: Ajustes --- */
  ajustes: {
    title: "Ajustes",
    businessLabel: "Datos del negocio",
    businessHint: "Nombre, categoría, colonia y descripción.",
    contactLabel: "Contacto",
    contactHint: "Tu WhatsApp de ventas.",
    hoursLabel: "Horario",
    hoursHint: "Cuándo abres y cierras.",
    accountLabel: "Cuenta",
    accountHint: "La cuenta de Google con la que entraste.",
    dangerLabel: "Zona de riesgo",
    stateOk: "Completo",
    statePending: "Incompleto",
    version: "All Cancún · Comercios",
    pauseCta: "Pausar mi negocio",
    pauseHint: "Dejas de aparecer en la app. Puedes reactivarlo.",
    editCta: "Editar",
    notSet: "Sin definir",
  },

  settingsLabel: "Ajustes de cuenta",
  signOut: "Cerrar sesión",
  signOutArm: "Toca otra vez para salir",

  /* --- Menú lateral --- */
  menuButton: "Abrir menú",
  menuTitle: "Secciones",
  menuClose: "Cerrar menú",
  accountFallback: "Tu cuenta",

  /* --- Estado del negocio en la cabecera --- */
  statusStateLabel: "Estado de tu negocio",

  /* --- Navegación --- */
  back: "Volver",
  save: "Guardar",
  edit: "Editar",
  cancel: "Cancelar",
  close: "Cerrar",
  optional: "opcional",

  /* --- Errores --- */
  errorGeneric: "Algo salió mal. Intenta de nuevo.",
  errorNoRole: "Necesitas una cuenta para continuar.",
  errorNetwork: "Sin conexión. Revisa tu internet.",
  errorRequiredName: "Escribe el nombre de tu negocio.",
  errorRequiredCategory: "Elige una categoría.",
  errorPrice: "Escribe un precio válido.",
};

/* Iconos — mismo trazo que la PWA del cliente */
const svg = (d, size = 18, sw = 1.7) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"` +
  ` stroke="currentColor" stroke-width="${sw}" stroke-linecap="round"` +
  ` stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

/* --------------------------------------------------------------------------
   Iconos sólidos con relleno y color propio.
   Trazo grueso + relleno tonal: se leen a 16px, pesan en la pantalla y
   no dependen del color del texto. Cada uno lleva su tono.
   -------------------------------------------------------------------------- */
const solid = (d, tone, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"` +
  ` stroke="currentColor" stroke-width="1.9" stroke-linecap="round"` +
  ` stroke-linejoin="round" aria-hidden="true" class="ico ico--${tone}">` +
  `<g fill="var(--ico-${tone})" stroke="var(--ico-${tone}-line)">${d}</g></svg>`;

/* --------------------------------------------------------------------------
   Iconos de las cuatro pestañas.
   Trazo de línea, un solo color heredado del texto (currentColor): así el
   ícono toma el color de la pestaña activa sin duplicar archivos. Los SVG
   viven en assets/iconos/ y salen de SVGRepo (licencia libre).
   -------------------------------------------------------------------------- */
const tabIco = (nombre, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"` +
  ` stroke="currentColor" stroke-width="1.7" stroke-linecap="round"` +
  ` stroke-linejoin="round" aria-hidden="true">${TRAZO_PESTANA[nombre]}</svg>`;

/* Los trazos, tal como se descargaron, sin el envoltorio <svg> */
const TRAZO_PESTANA = {
  tienda:
    `<path d="M3.6 8h16.8l-1.1 10.5a1.9 1.9 0 0 1-1.9 1.7H6.6a1.9 1.9 0 0 1-1.9-1.7Z"/>` +
    `<path d="M8.4 8V6.2a3.6 3.6 0 0 1 7.2 0V8"/>` +
    `<path d="M3.6 8h16.8" />`,
  menu:
    `<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3"/>` +
    `<path d="M9.6 3.2v17.6M9.6 12h11.2"/>`,
  pedidos:
    `<path d="M9 7H6.92c-.52 0-.95.4-1 .92L5.09 17.92c-.05.58.41 1.08 1 1.08h11.82c.58 0 1.04-.5 1-1.08L18.08 7.92c-.05-.52-.48-.92-1-.92H15"/>` +
    `<path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>` +
    `<path d="M9 7h6"/>`,
  ajustes:
    `<circle cx="12" cy="12" r="4.5"/>` +
    `<path d="M2 12h5.5M16.5 12H22"/>`,
};

export const ico = {
  store: solid(
    `<path d="M3.6 9.4 5.9 3.8h12.2l2.3 5.6Z"/>` +
      `<path d="M4.6 10.6V19a1.6 1.6 0 0 0 1.6 1.6h11.6A1.6 1.6 0 0 0 19.4 19v-8.4"/>` +
      `<path d="M9.4 20.6v-5.4h5.2v5.4"/>`,
    "aqua"
  ),

  /* Pestañas: línea limpia, heredan el color del texto */
  menu: tabIco("menu"),
  bag: tabIco("pedidos"),
  gear: tabIco("ajustes"),
  tabStore: tabIco("tienda"),

  plus: solid(`<path d="M12 5v14M5 12h14"/>`, "aqua", 18),

  chevron: svg(`<path d="m9.5 6 6 6-6 6"/>`, 16, 2.1),

  arrowLeft: svg(`<path d="m14.5 6-6 6 6 6"/>`, 20, 2),

  logout: solid(
    `<path d="M15 17l5-5-5-5"/><path d="M20 12H9"/>` +
      `<path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/>`,
    "coral",
    18
  ),

  close: svg(`<path d="m6 6 12 12M18 6 6 18"/>`, 18, 2.1),

  /* Hamburguesa: abre el menú lateral */
  burger: svg(`<path d="M4 7h16M4 12h16M4 17h11"/>`, 20, 2),

  check: solid(`<path d="m4.5 12.5 5 5 10-11"/>`, "lima", 16),

  star: svg(
    `<path d="m12 3.6 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.3 10l6-.9Z"/>`,
    16
  ),

  /* Cámara: el espacio de imagen */
  camera: solid(
    `<path d="M3.5 8.5h2.8l1.4-2.2h8.6l1.4 2.2h2.8a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18V10a1.5 1.5 0 0 1 1.5-1.5Z"/>` +
      `<circle cx="12" cy="13.5" r="3.4"/>`,
    "rosa",
    20
  ),

  pin: svg(
    `<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/>` +
      `<circle cx="12" cy="10" r="2.6"/>`
  ),

  clock: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`),

  chat: svg(
    `<path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.8A8 8 0 1 1 20.5 11.5Z"/>`
  ),

  user: svg(
    `<circle cx="12" cy="8" r="3.6"/>` +
      `<path d="M4.8 20.2a7.4 7.4 0 0 1 14.4 0"/>`
  ),

  trash: solid(
    `<path d="M4 7h16"/><path d="M9.5 7V4.8h5V7"/>` +
      `<path d="M6.5 7l1 13h9l1-13"/>`,
    "rojo"
  ),

  pencil: solid(
    `<path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3Z"/>` +
      `<path d="m14 6 3 3"/>`,
    "lima",
    18
  ),

  image: svg(
    `<rect x="3" y="4.5" width="18" height="15" rx="2.2"/>` +
      `<circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>`,
    20
  ),
};

/* Categorías: espejo del enum categoria_negocio en Supabase */
export const CATEGORIAS = [
  { id: "comida", label: "Comida y bebidas", accent: "comida" },
  { id: "comercios", label: "Tienda / abarrotes", accent: "comercios" },
  { id: "salud", label: "Salud", accent: "salud" },
  { id: "mantenimiento", label: "Mantenimiento", accent: "mantenimiento" },
  { id: "tianguis", label: "Tianguis", accent: "tianguis" },
  { id: "mujeres", label: "Belleza y moda", accent: "mujeres" },
  { id: "hombres", label: "Barbería y moda", accent: "hombres" },
  { id: "estudiantes", label: "Estudiantes", accent: "estudiantes" },
  { id: "otro", label: "Otro", accent: "hogar" },
];

/* Días de la semana para el horario */
export const DIAS = [
  { id: "lun", label: "Lunes" },
  { id: "mar", label: "Martes" },
  { id: "mie", label: "Miércoles" },
  { id: "jue", label: "Jueves" },
  { id: "vie", label: "Viernes" },
  { id: "sab", label: "Sábado" },
  { id: "dom", label: "Domingo" },
];

/* Pestañas de la barra inferior, en orden */
export const TABS = [
  { id: "tienda", icon: "tabStore" },
  { id: "menu", icon: "menu" },
  { id: "pedidos", icon: "bag" },
  { id: "ajustes", icon: "gear" },
];

