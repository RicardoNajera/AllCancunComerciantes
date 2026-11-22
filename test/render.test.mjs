/**
 * Prueba de render: monta las plantillas y verifica que el HTML sale
 * coherente, sin inyección y SIN DATOS SIMULADOS.
 *
 * El punto importante de este archivo es el bloque "nada simulado":
 * si alguien mete un producto de ejemplo, un precio inventado o una
 * reseña falsa, el test falla.
 *
 * Ejecutar: node test/render.test.mjs
 */

import {
  loginHTML,
  loadingHTML,
  drawerHTML,
  topbarHTML,
  emptyHTML,
  sinNegocioHTML,
  tiendaHTML,
  tarjetaClienteHTML,
} from "../features/panel/views.js";
import { menuHTML, pedidosHTML } from "../features/panel/views-menu.js";
import { ajustesHTML } from "../features/panel/views-ajustes.js";
import { negocioFormHTML } from "../features/panel/views-form-negocio.js";
import { productoFormHTML } from "../features/panel/views-form-producto.js";
import {
  photoSlot,
  productsCount,
  precioTexto,
  oGuion,
  oFalta,
  estadoLabel,
  estadoTone,
  categoriaLabel,
  initial,
} from "../features/panel/bits.js";

let pass = 0;
let fail = 0;

const ok = (name, cond, extra = "") => {
  if (cond) pass += 1;
  else fail += 1;
  console.log(`${cond ? "PASA " : "FALLA"}  ${name}${cond ? "" : `\n        ${extra}`}`);
};

/* Negocio mínimo: solo lo que la base exige. Todo lo demás nulo. */
const negocio = {
  id: "n1",
  nombre: "Abarrotes <script>alert(1)</script>",
  categoria: "comercios",
  colonia: null,
  whatsapp: null,
  descripcion: null,
  estado: "borrador",
  foto_url: null,
};

console.log("--- Login ---");
const login = loginHTML();
ok("pinta boton de Google", login.includes("data-cm-login"));
ok("tiene titulo", login.includes("Tu negocio, en orden"));
ok("tiene zona de mensaje", login.includes("data-cm-msg"));
ok("no expone datos de sesion", !login.includes("u1"));

console.log("\n--- Transición de carga ---");
const boot = loadingHTML();
ok("es una transicion a pantalla completa", boot.includes("cm-boot"));
ok("NO escribe texto visible de carga", !boot.replace(/aria-label="[^"]*"/g, "").includes("Cargando"));
ok("usa tarjeta de cristal", boot.includes("cm-boot__glass"));
ok("el cristal es decorativo", /cm-boot__glass[^>]*aria-hidden="true"/.test(boot));
ok("el logo va dentro del cristal", /cm-boot__glass"[^>]*>\s*<span class="cm-boot__mark"/.test(boot));
ok("no queda el halo mareante", !boot.includes("cm-boot__halo"));
ok("los lectores de pantalla sí saben que carga", boot.includes('role="status"') && boot.includes("aria-label="));
ok("no usa la barra de progreso inventada", !boot.includes("<progress"));

console.log("\n--- Menú lateral (única navegación) ---");
const lateral = drawerHTML({ activa: "tienda", nombre: "Ana", sub: "Taquería El Primo" });
ok("es el menú de la esquina", lateral.includes("cm-drawer"));
ok("pinta las 4 secciones", (lateral.match(/data-cm-tab=/g) || []).length === 4);
ok("tienda activa", lateral.includes('aria-current="page"'));
ok("marca la activa", lateral.includes("is-active"));
ok("incluye Pedidos", lateral.includes("Pedidos"));
ok("se puede cerrar", lateral.includes("data-cm-menu-close"));
ok("muestra el negocio", lateral.includes("Taquería El Primo"));
const lateralMenu = drawerHTML({ activa: "menu", nombre: "Ana" });
ok("cambia de activa segun la seccion", /cm-drawer__item is-active[^>]*data-cm-tab="menu"/.test(lateralMenu));
ok("escapa el nombre", drawerHTML({ activa: "tienda", nombre: "<b>x</b>" }).includes("&lt;b&gt;"));
ok("sin barra inferior", !lateral.includes("dock-tab"));

console.log("\n--- Cabecera ---");
const bar = topbarHTML({ titulo: "Mi tienda", estado: "borrador" });
ok("pinta titulo", bar.includes("Mi tienda"));
ok("pinta estado", bar.includes("Borrador"));
ok("sin estado no pinta pastilla", !topbarHTML({ titulo: "Menú" }).includes("cm-status"));
ok("escapa el titulo", topbarHTML({ titulo: "<b>x</b>" }).includes("&lt;b&gt;"));

console.log("\n--- Estado vacio generico ---");
const vacio = emptyHTML({ icono: "<svg></svg>", titulo: "Nada aqui", lead: "Aun no hay" });
ok("pinta titulo", vacio.includes("Nada aqui"));
ok("pinta lead", vacio.includes("Aun no hay"));
ok("sin cta no pinta boton", !vacio.includes("<button"));
const conCta = emptyHTML({
  icono: "<svg></svg>",
  titulo: "T",
  lead: "L",
  cta: "Agregar",
  accion: 'data-cm-x="1"',
});
ok("con cta pinta boton", conCta.includes("<button"));
ok("el boton lleva su accion", conCta.includes('data-cm-x="1"'));

console.log("\n--- Sin negocio ---");
const onboard = sinNegocioHTML();
ok("dice que abras tu negocio", onboard.includes("Abre tu negocio"));
ok("tiene boton de alta", onboard.includes("data-cm-nuevo-negocio"));
ok("muestra el espacio de portada", onboard.includes("cm-photo"));
ok("no inventa un nombre de negocio", !onboard.includes("Jugos"));


console.log("\n--- Pestana Tienda ---");
const tienda = tiendaHTML({ negocio });
ok("pinta el nombre escapado", tienda.includes("&lt;script&gt;"));
ok("NO inyecta el script", !tienda.includes("<script>alert"));
ok("pinta la categoria", tienda.includes("Tienda / abarrotes"));
ok("el badge de estado vive en la cabecera", topbarHTML({ titulo: "Tienda", estado: "borrador" }).includes("cm-status--draft"));
ok("explica el estado borrador", tienda.includes("Solo lo ves tú"));
ok("muestra el espacio de portada", tienda.includes("Foto de portada"));
ok("muestra el espacio de logo", tienda.includes("Logo"));

/* --- Fotos reales ---
   Sin foto_url la vista pinta el recuadro punteado; con foto_url
   tiene que salir un <img> y no un recuadro vacío. */
ok("sin foto no pinta img", !tienda.includes("<img"));
ok("portada y logo son pulsables", tienda.includes('data-cm-foto="portada"') && tienda.includes('data-cm-foto="logo"'));
ok("hay input de archivo", tienda.includes("data-cm-foto-input"));

const tiendaConFoto = tiendaHTML({
  negocio: {
    ...negocio,
    foto_url: "https://pub-abc.r2.dev/negocios/u1/portada.webp",
    logo_url: "https://pub-abc.r2.dev/negocios/u1/logo.webp",
  },
});
ok("con portada pinta img", tiendaConFoto.includes("<img"));
ok("la portada apunta al bucket", tiendaConFoto.includes("negocios/u1/portada.webp"));
ok("el logo apunta al bucket", tiendaConFoto.includes("negocios/u1/logo.webp"));
ok("marca has-image", tiendaConFoto.includes("has-image"));

/* El comerciante no controla la URL, pero un dato raro en la base no
   debe poder inyectar HTML en la página. */
const tiendaInyectada = tiendaHTML({
  negocio: { ...negocio, foto_url: 'x" onerror="alert(1)' },
});
ok("escapa la url de la foto", tiendaInyectada.includes("&quot;") && !tiendaInyectada.includes('onerror="alert(1)"'));

/* Sin Worker configurado los botones quedan desactivados: mejor no
   ofrecer una subida que va a fallar. */
ok("sin worker los botones van desactivados", (tienda.match(/disabled/g) || []).length >= 2);
ok("avisa que falta la colonia", tienda.includes("Sin colonia"));
ok("avisa que falta el WhatsApp", tienda.includes("Sin WhatsApp"));
ok("avisa que falta el horario", tienda.includes("Sin horario"));
ok("avisa que falta la descripcion", tienda.includes("Todavía no escribiste"));
ok("tiene boton publicar", tienda.includes("data-cm-publicar"));
ok("tiene boton editar", tienda.includes("data-cm-editar-negocio"));
ok("la vista previa dice que no hay resenas", tienda.includes("Sin reseñas todavía"));

const activo = tiendaHTML({ negocio: { ...negocio, estado: "activo" } });
ok("publicado NO muestra boton publicar", !activo.includes("data-cm-publicar"));
ok("publicado confirma que esta visible", activo.includes("ya está visible"));

console.log("\n--- Tarjeta del cliente ---");
const tarjeta = tarjetaClienteHTML(negocio);
ok("pinta el nombre", tarjeta.includes("&lt;script&gt;"));
ok("lleva el acento de la categoria", tarjeta.includes("cm-tarjeta--comercios"));
ok("no inventa estrellas", !tarjeta.includes("4.8"));
ok("dice que no hay resenas", tarjeta.includes("Sin reseñas"));

console.log("\n--- Pestana Menu vacio ---");
const menuVacio = menuHTML({ productos: [] });
ok("dice que no hay productos", menuVacio.includes("Aún no tienes productos"));
ok("invita a agregar", menuVacio.includes("Agregar producto"));
ok("el contador dice Sin productos", menuVacio.includes("Sin productos"));
ok("NO inventa productos", !menuVacio.includes("Jugo verde"));
ok("tiene boton de alta", menuVacio.includes("data-cm-nuevo-producto"));

console.log("\n--- Pestana Menu con productos ---");
const producto = {
  id: "p1",
  nombre: "Agua 600ml",
  descripcion: null,
  precio_centavos: 1500,
  disponible: true,
  foto_url: null,
};
const menu = menuHTML({ productos: [producto] });
ok("pinta el producto", menu.includes("Agua 600ml"));
ok("pinta el precio en pesos", menu.includes("$15"));
ok("dice 1 producto", menu.includes("1 producto"));
ok("pinta espacio de foto del producto", menu.includes("Foto del producto"));
ok("pinta la pill disponible", menu.includes("is-on"));
ok("tiene toggle", menu.includes('data-cm-toggle="p1"'));
ok("tiene borrar", menu.includes('data-cm-del="p1"'));
ok("sin foto no inventa imagen", !menu.includes("<img"));

const agotado = menuHTML({ productos: [{ ...producto, disponible: false }] });
ok("agotado se marca is-off", agotado.includes("is-off"));
ok("agotado dice Agotado", agotado.includes("Agotado"));

const dos = menuHTML({ productos: [producto, { ...producto, id: "p2" }] });
ok("pluraliza el contador", dos.includes("2 productos"));

console.log("\n--- Pestana Pedidos vacia ---");
const pedidos = pedidosHTML({ pedidos: [], publicado: false });
ok("dice que no hay pedidos", pedidos.includes("No tienes pedidos todavía"));
ok("explica cuando apareceran", pedidos.includes("aparecerá aquí"));
ok("sin publicar manda a publicar", pedidos.includes("Ir a publicar"));
ok("NO inventa pedidos", !pedidos.includes("$"));

const pedidosPub = pedidosHTML({ pedidos: [], publicado: true });
ok("publicado no manda a publicar", !pedidosPub.includes("Ir a publicar"));

console.log("\n--- Pestana Ajustes ---");
const ajustes = ajustesHTML({
  negocio,
  nombreCuenta: "Juana Pérez",
  email: "juana@ejemplo.com",
});
ok("pinta los datos del negocio", ajustes.includes("Datos del negocio"));
ok("pinta el nombre", ajustes.includes("&lt;script&gt;"));
ok("pinta el correo", ajustes.includes("juana@ejemplo.com"));
ok("pinta la inicial del avatar", ajustes.includes(">J<"));
ok("tiene cerrar sesion", ajustes.includes("data-cm-signout"));
ok("avisa lo que falta", ajustes.includes("Sin colonia"));

console.log("\n--- Formulario de negocio ---");
const fNeg = negocioFormHTML();
ok("es alta (sin negocio)", fNeg.includes("data-cm-form-negocio"));
ok("titula el alta", fNeg.includes("Nuevo negocio"));
ok("campo nombre", fNeg.includes('name="nombre"'));
ok("campo categoria", fNeg.includes('name="categoria"'));
ok("campo colonia", fNeg.includes('name="colonia"'));
ok("campo whatsapp", fNeg.includes('name="whatsapp"'));
ok("campo descripcion", fNeg.includes('name="descripcion"'));
ok("trae las 9 categorias", (fNeg.match(/<option /g) || []).length === 10); // 9 + placeholder
ok("boton guardar", fNeg.includes('type="submit"'));
ok("boton cancelar", fNeg.includes("data-cm-cancelar"));
ok("zona de mensaje", fNeg.includes("data-cm-msg"));
ok("alta empieza vacia", fNeg.includes('name="nombre" type="text" required maxlength="80"'));

const fEdit = negocioFormHTML({ negocio });
ok("es edicion", fEdit.includes("data-cm-form-negocio"));
ok("precarga el nombre escapado", fEdit.includes('value="Abarrotes &lt;script&gt;'));
ok("no inyecta en el value", !fEdit.includes('value="Abarrotes <script>'));
ok("marca la categoria actual", fEdit.includes('value="comercios" selected'));

console.log("\n--- Formulario de producto ---");
const fProd = productoFormHTML();
ok("titula producto", fProd.includes("producto"));
ok("campo nombre", fProd.includes('name="nombre"'));
ok("campo precio", fProd.includes('name="precio"'));
ok("signo de peso visible", fProd.includes("cm-money__sign"));
ok("campo descripcion opcional", fProd.includes('name="descripcion"'));
ok("boton guardar", fProd.includes('type="submit"'));
ok("boton cancelar", fProd.includes("data-cm-cancelar"));
ok("no inventa precio", !fProd.includes('value="15'));
ok("el alta de producto empieza vacia", fProd.includes('name="nombre" type="text" required maxlength="60"'));
ok("sin precio precargado", /name="precio"[^>]*value=""/.test(fProd));
ok("alta sin nombre precargado", /name="nombre"[^>]*value=""/.test(fProd));
ok("alta sin descripcion precargada", /name="descripcion"[^>]*value=""/.test(fProd));

/* Editar: el formulario se prellena con el producto que recibe */
const fProdEdit = productoFormHTML({
  producto: {
    id: "p-1",
    nombre: "Jugo verde",
    descripcion: "Con nopal",
    precio_centavos: 3550,
    disponible: true,
  },
});
ok("edicion trae el titulo de editar", fProdEdit.includes("Editar producto"));
ok("edicion precarga el nombre", fProdEdit.includes('value="Jugo verde"'));
ok("edicion precarga la descripcion", fProdEdit.includes('value="Con nopal"'));
ok("edicion convierte centavos a pesos", fProdEdit.includes('value="35.50"'));
ok("edicion escapa el nombre", !fProdEdit.includes('value="<'));

console.log("\n--- Piezas puras ---");
const slotVacio = photoSlot({ label: "Foto de portada" });
ok("slot vacio no pinta img", !slotVacio.includes("<img"));
ok("slot vacio lleva la etiqueta", slotVacio.includes("Foto de portada"));
ok("slot vacio trae icono de camara", slotVacio.includes("<svg"));
ok("slot vacio usa role img", slotVacio.includes('role="img"'));
ok("slot variante cover", photoSlot({ label: "x", variant: "cover" }).includes("cm-photo--cover"));

const slotConFoto = photoSlot({ label: "Logo", hasImage: true, src: "https://x/y.png" });
ok("slot con foto pinta img", slotConFoto.includes("<img"));
ok("slot con foto marca has-image", slotConFoto.includes("has-image"));
ok("slot escapa la url", photoSlot({ label: "L", hasImage: true, src: 'x"onerror="a' }).includes("&quot;"));

ok("productsCount 0", productsCount(0) === "Sin productos");
ok("productsCount 1", productsCount(1) === "1 producto");
ok("productsCount n", productsCount(5) === "5 productos");

ok("precioTexto centavos", precioTexto(1500) === "$15");
ok("precioTexto decimales", precioTexto(1550) === "$15.50");
ok("precioTexto grande", precioTexto(1234500) === "$12,345");
ok("precioTexto cero dice Sin precio", precioTexto(0) === "Sin precio");
ok("precioTexto vacio dice Sin precio", precioTexto(null) === "Sin precio");

ok("oGuion con valor", oGuion("Centro") === "Centro");
ok("oGuion sin valor", oGuion(null) === "—");
ok("oGuion con vacio", oGuion("") === "—");

const falta = oFalta(null, "Sin colonia");
ok("oFalta envuelve en cm-muted", falta.includes("cm-muted"));
ok("oFalta dice que falta", falta.includes("Sin colonia"));
ok("oFalta con valor", oFalta("Centro", "Sin colonia") === "Centro");
ok("oFalta escapa el valor", oFalta("<b>x</b>", "y").includes("&lt;b&gt;"));

ok("estadoLabel borrador", estadoLabel("borrador") === "Borrador");
ok("estadoLabel activo", estadoLabel("activo") === "Publicado");
ok("estadoTone borrador", estadoTone("borrador") === "draft");
ok("estadoTone activo", estadoTone("activo") === "ok");
ok("categoriaLabel desconocida vacia", categoriaLabel("noexiste") === "");
ok("categoriaLabel valida", categoriaLabel("comida").length > 0);
ok("initial con nombre", initial("juana") === "J");
ok("initial vacio", initial("") === "·");

/* ==========================================================================
   Regresión: el menú lateral NO existe en el DOM si está cerrado.
   El bug real fue ver su texto (nombre, correo, "Cerrar menú") suelto
   debajo de la barra inferior. Montarlo solo al abrirlo hace imposible
   que eso vuelva a pasar, aunque el CSS falte o esté cacheado viejo.
   ========================================================================== */

import { readFileSync } from "node:fs";

console.log("\n--- Menú lateral fuera del flujo ---");

const css = readFileSync(new URL("../styles/panel.css", import.meta.url), "utf8");
const fuentePanel = readFileSync(
  new URL("../features/panel/index.js", import.meta.url),
  "utf8"
);
const fuenteApp = readFileSync(new URL("../app.js", import.meta.url), "utf8");

const reglaCompartida = css.match(/\.cm-overlay,\s*\.cm-drawer\s*\{([^}]*)\}/);
const cuerposDrawer = [...css.matchAll(/(?:^|\n)\.cm-drawer\s*\{([^}]*)\}/g)];
const cuerpoDrawer = cuerposDrawer.length
  ? cuerposDrawer[cuerposDrawer.length - 1][1]
  : "";

ok("overlay y drawer comparten bloque", Boolean(reglaCompartida));
ok(
  "ese bloque es position absolute",
  Boolean(reglaCompartida) && /position:\s*absolute/.test(reglaCompartida[1])
);
ok(
  "ese bloque no deja que crezca en flex",
  Boolean(reglaCompartida) && /flex:\s*0\s*0\s*auto/.test(reglaCompartida[1])
);
ok("el drawer cerrado arranca fuera de pantalla", /translateX\(-102%\)/.test(cuerpoDrawer));
ok("abierto vuelve a su sitio", /\.cm-drawer\.is-open\s*\{[^}]*transform:\s*none/.test(css));
ok("tiene animacion de entrada", /@keyframes cm-drawer-in/.test(css));
ok(
  "no hay regla que lo meta en el flujo",
  !/\.cm-drawer\s*\{[^}]*position:\s*static/.test(css)
);

/* Contrato de JS: se monta al abrir y se destruye al cerrar */
ok("el panel tiene desmontarMenu", /function desmontarMenu\s*\(/.test(fuentePanel));
ok(
  "cerrar el menu lo elimina del DOM",
  /function desmontarMenu\s*\([^)]*\)\s*\{[\s\S]*?drawer\.remove\(\)/.test(fuentePanel)
);
ok(
  "abrir el menu se monta solo entonces",
  /function montarMenu\s*\(/.test(fuentePanel) && /if \(open\) \{\s*montarMenu/.test(fuentePanel)
);
ok(
  "el estado no depende del DOM",
  /let menuAbierto = false/.test(fuentePanel)
);
ok(
  "el desmontaje del panel limpia el menu",
  /return \(\) => \{\s*reset\(\);\s*desmontarMenu\(\);/.test(fuentePanel)
);
ok(
  "app.js barre menus huerfanos al repintar",
  /querySelectorAll\("\[data-cm-drawer\], \[data-cm-overlay\]"\)/.test(fuenteApp)
);

console.log(`\n${pass} PASA / ${fail} FALLA`);
if (fail > 0) process.exit(1);
