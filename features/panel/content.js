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
    priceEmpty: "Sin precio",
  },

  productFormTitle: "Nuevo producto",
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
    pauseCta: "Pausar mi negocio",
    pauseHint: "Dejas de aparecer en la app. Puedes reactivarlo.",
    editCta: "Editar",
    notSet: "Sin definir",
  },

  settingsLabel: "Ajustes de cuenta",
  signOut: "Cerrar sesión",
  signOutArm: "Toca otra vez para salir",

  /* --- Navegación --- */
  back: "Volver",
  save: "Guardar",
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

export const ico = {
  store: svg(
    `<path d="M4 9.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V9.5"/>` +
      `<path d="M3 9.5 5.2 4h13.6L21 9.5"/><path d="M8.5 20.5v-6h7v6"/>`
  ),

  menu: svg(`<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/>`),

  bag: svg(
    `<path d="M4.5 8h15l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.4H7.2a1.6 1.6 0 0 1-1.6-1.4Z"/>` +
      `<path d="M8.8 8V6.2a3.2 3.2 0 0 1 6.4 0V8"/>`
  ),

  gear: svg(
    `<circle cx="12" cy="12" r="3"/>` +
      `<path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3` +
      ` 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1` +
      `a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1` +
      `A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3` +
      `H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1` +
      `a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1` +
      `a1.6 1.6 0 0 0-1.5 1Z"/>`
  ),

  plus: svg(`<path d="M12 5v14M5 12h14"/>`, 18, 2.1),

  chevron: svg(`<path d="m9.5 6 6 6-6 6"/>`, 16, 2.1),

  arrowLeft: svg(`<path d="m14.5 6-6 6 6 6"/>`, 20, 2),

  logout: svg(
    `<path d="M15 17l5-5-5-5"/><path d="M20 12H9"/>` +
      `<path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/>`
  ),

  close: svg(`<path d="m6 6 12 12M18 6 6 18"/>`, 18, 2.1),

  check: svg(`<path d="m4.5 12.5 5 5 10-11"/>`, 16, 2.2),

  star: svg(
    `<path d="m12 3.6 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.3 10l6-.9Z"/>`,
    16
  ),

  /* Cámara: el espacio de imagen */
  camera: svg(
    `<path d="M3.5 8.5h2.8l1.4-2.2h8.6l1.4 2.2h2.8a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18V10a1.5 1.5 0 0 1 1.5-1.5Z"/>` +
      `<circle cx="12" cy="13.5" r="3.4"/>`,
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

  trash: svg(
    `<path d="M4 7h16"/><path d="M9.5 7V4.8h5V7"/>` +
      `<path d="M6.5 7l1 13h9l1-13"/>`
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
  { id: "tienda", icon: "store" },
  { id: "menu", icon: "menu" },
  { id: "pedidos", icon: "bag" },
  { id: "ajustes", icon: "gear" },
];

