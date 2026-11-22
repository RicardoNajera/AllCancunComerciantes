/**
 * All Cancún — Pruebas de fotos
 *
 * Cubre lo que se puede probar sin navegador ni red:
 *   - las rutas del bucket (que el dueño vaya en el nombre)
 *   - la URL pública
 *   - el cálculo de tamaño al comprimir
 *   - la validación del archivo
 *
 * Se ejecuta con:  node test/fotos.test.mjs
 */

import {
  rutaFoto,
  urlFoto,
  rutaDesdeUrl,
  fotosConfiguradas,
  subidaConfigurada,
} from "../features/shared/fotos.js";

import {
  calcularDestino,
  tipoAceptado,
  revisarArchivo,
  nombreLimpio,
  pesoTexto,
  TAMANOS,
  MAX_BYTES_ENTRADA,
} from "../features/shared/imagen.js";

/* Configuración falsa: el módulo lee window para no hardcodear. */
globalThis.window = {
  ALL_CANCUN_FOTOS_URL: "https://pub-abc.r2.dev",
  ALL_CANCUN_FOTOS_WORKER: "",
};

let fails = 0;
let total = 0;
const ok = (nombre, condicion) => {
  total += 1;
  if (!condicion) {
    fails += 1;
    console.log(`  FALLA  ${nombre}`);
  }
};

console.log("\n--- Rutas del bucket ---");
ok("portada", rutaFoto({ tipo: "portada", duenoId: "u1" }) === "negocios/u1/portada.webp");
ok("logo", rutaFoto({ tipo: "logo", duenoId: "u1" }) === "negocios/u1/logo.webp");
ok(
  "producto",
  rutaFoto({ tipo: "producto", negocioId: "n1", productoId: "p1" }) ===
    "productos/n1/p1.webp"
);
ok("perfil", rutaFoto({ tipo: "perfil", duenoId: "u1" }) === "perfiles/u1.webp");
ok("extensión jpeg", rutaFoto({ tipo: "portada", duenoId: "u1", extension: "jpeg" }).endsWith(".jpeg"));
ok("extensión con punto", rutaFoto({ tipo: "portada", duenoId: "u1", extension: ".webp" }).endsWith("/portada.webp"));

console.log("\n--- Rutas inválidas ---");
ok("portada sin dueño", rutaFoto({ tipo: "portada" }) === "");
ok("logo sin dueño", rutaFoto({ tipo: "logo", duenoId: "" }) === "");
ok("producto sin negocio", rutaFoto({ tipo: "producto", productoId: "p1" }) === "");
ok("producto sin producto", rutaFoto({ tipo: "producto", negocioId: "n1" }) === "");
ok("tipo desconocido", rutaFoto({ tipo: "otro", duenoId: "u1" }) === "");

console.log("\n--- URL pública ---");
ok("url normal", urlFoto("negocios/u1/portada.webp") === "https://pub-abc.r2.dev/negocios/u1/portada.webp");
ok("url con barra inicial", urlFoto("/negocios/u1/logo.webp") === "https://pub-abc.r2.dev/negocios/u1/logo.webp");
ok("url vacía si no hay ruta", urlFoto("") === "");
ok("url vacía si no hay base", (() => {
  const guardado = globalThis.window.ALL_CANCUN_FOTOS_URL;
  globalThis.window.ALL_CANCUN_FOTOS_URL = "";
  const res = urlFoto("negocios/u1/logo.webp");
  globalThis.window.ALL_CANCUN_FOTOS_URL = guardado;
  return res === "";
})());

console.log("\n--- Ruta desde URL (para borrar) ---");
ok(
  "extrae la ruta",
  rutaDesdeUrl("https://pub-abc.r2.dev/negocios/u1/portada.webp") === "negocios/u1/portada.webp"
);
ok(
  "quita el ?v=",
  rutaDesdeUrl("https://pub-abc.r2.dev/negocios/u1/portada.webp?v=123") ===
    "negocios/u1/portada.webp"
);
ok(
  "ignora otra base",
  rutaDesdeUrl("https://otro-sitio.com/negocios/u1/portada.webp") === ""
);
ok("ignora vacío", rutaDesdeUrl("") === "");

console.log("\n--- Estado de configuración ---");
ok("fotos configuradas", fotosConfiguradas() === true);
ok("sin worker no hay subida", subidaConfigurada() === false);

/* En este archivo window es un objeto simple, pero el módulo tiene que
   funcionar también donde window no existe (Node, service worker). */
ok("sin window no revienta", (() => {
  const guardado = globalThis.window;
  delete globalThis.window;
  try {
    return fotosConfiguradas() === false && subidaConfigurada() === false;
  } finally {
    globalThis.window = guardado;
  }
})());

console.log("\n--- Cálculo de tamaño ---");
/* 4032x3024 (4:3) entra en la caja 1600x900 limitado por el ALTO:
   900 de alto deja 1200 de ancho. Si se limitara por ancho daría
   1600x1200, que se sale de la caja. */
const grande = calcularDestino(4032, 3024, TAMANOS.portada);
ok("portada 4:3 limitada por alto", grande.alto === 900 && grande.ancho === 1200);
ok("portada mantiene proporción", Math.abs(grande.ancho / grande.alto - 4032 / 3024) < 0.01);
ok("portada no se sale de la caja", grande.ancho <= 1600 && grande.alto <= 900);

const cuadrada = calcularDestino(3000, 3000, TAMANOS.logo);
ok("logo cuadrado 512", cuadrada.ancho === 512 && cuadrada.alto === 512);

const chica = calcularDestino(200, 150, TAMANOS.portada);
ok("no amplía imagen pequeña", chica.ancho === 200 && chica.alto === 150);

const vertical = calcularDestino(1000, 2000, TAMANOS.producto);
ok("vertical limita alto", vertical.alto === 1000);
ok("vertical proporcional", vertical.ancho === 500);

const alta = calcularDestino(2000, 1000, TAMANOS.portada);
ok("apaisada limita ancho", alta.ancho === 1600 && alta.alto === 800);

ok("dimensiones cero", calcularDestino(0, 0, TAMANOS.portada).ancho === 0);
ok("no devuelve cero px", calcularDestino(1, 10000, TAMANOS.logo).ancho >= 1);

console.log("\n--- Tipos aceptados ---");
ok("jpeg", tipoAceptado("image/jpeg"));
ok("png", tipoAceptado("image/png"));
ok("webp", tipoAceptado("image/webp"));
ok("gif", tipoAceptado("image/gif"));
ok("no pdf", !tipoAceptado("application/pdf"));
ok("no vacío", !tipoAceptado(""));
ok("no heic", !tipoAceptado("image/heic"));

console.log("\n--- Revisión de archivo ---");
ok("sin archivo", revisarArchivo(null) !== "");
ok("jpeg válido", revisarArchivo({ type: "image/jpeg", size: 1024 }) === "");
ok(
  "heic explica cómo cambiarla",
  /HEIC/i.test(revisarArchivo({ type: "image/heic", size: 1024 }))
);
ok(
  "pdf rechazado",
  /Formato/i.test(revisarArchivo({ type: "application/pdf", size: 10 }))
);
ok(
  "excede el peso",
  /20 MB|máximo/i.test(revisarArchivo({ type: "image/jpeg", size: MAX_BYTES_ENTRADA + 1 }))
);

console.log("\n--- Nombre limpio ---");
ok("acentos fuera", nombreLimpio("Portada Año NUEVO.jpg") === "portada-ano-nuevo");
ok("espacios a guion", nombreLimpio("mi foto.png") === "mi-foto");
ok("sin extensión de reserva", nombreLimpio("") === "imagen");
ok("no deja guiones sueltos", nombreLimpio("---x---.webp") === "x");
ok("recorta a 60", nombreLimpio("a".repeat(100)).length === 60);

console.log("\n--- Peso en texto ---");
ok("bytes", pesoTexto(500) === "500 B");
ok("kilobytes", pesoTexto(250 * 1024) === "250 KB");
ok("megabytes", pesoTexto(2 * 1024 * 1024) === "2.0 MB");
ok("cero", pesoTexto(0) === "0 B");

console.log(`\n${total - fails}/${total} correctas`);
if (fails) {
  console.log(`✗ ${fails} fallo(s)`);
  process.exit(1);
} else {
  console.log("✓ fotos: todas las pruebas pasan");
}
