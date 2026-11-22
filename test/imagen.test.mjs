/**
 * All Cancún — Pruebas de la compresión de imágenes
 *
 * Comprueba los cálculos que no dependen del navegador: el encaje de
 * medidas, los topes de peso y los rechazos. Así, si alguien cambia
 * CALIDAD o TAMANOS sin pensar, salta aquí.
 */
import {
  calcularDestino,
  nombreLimpio,
  pesoTexto,
  revisarArchivo,
  tipoAceptado,
  TAMANOS,
  MAX_BYTES_ENTRADA,
} from "../features/shared/imagen.js";

let pasa = 0;
let falla = 0;
const ok = (nombre, condicion) => {
  if (condicion) {
    pasa++;
    console.log("  ✓ " + nombre);
  } else {
    falla++;
    console.log("  ✗ " + nombre);
  }
};

console.log("\n--- Medidas por uso ---");
ok("la portada llega a 1600×900", TAMANOS.portada.ancho === 1600 && TAMANOS.portada.alto === 900);
ok("el logo se queda en 512", TAMANOS.logo.ancho === 512);
ok("el producto no pasa de 1000", TAMANOS.producto.ancho === 1000);

console.log("\n--- Encaje sin deformar ---");
const ancha = calcularDestino(4000, 3000, TAMANOS.portada);
/* 4:3 en un marco 16:9 lo limita el ALTO: 1200×900. El ancho queda en
   1200, no en 1600, porque si no se deformaría. */
ok("foto 4:3 encaja en 1200×900", ancha.ancho === 1200 && ancha.alto === 900);
ok("no supera el ancho máximo", ancha.ancho <= TAMANOS.portada.ancho);
ok("mantiene la proporción", Math.abs(ancha.ancho / ancha.alto - 4000 / 3000) < 0.01);

const panoramica = calcularDestino(4000, 1000, TAMANOS.portada);
ok("panorámica se limita por el ancho", panoramica.ancho === 1600 && panoramica.alto === 400);

const alta = calcularDestino(1000, 4000, TAMANOS.portada);
ok("foto vertical no pasa de 900 de alto", alta.alto === 900);
ok("una vertical no se deforma", Math.abs(alta.ancho / alta.alto - 1000 / 4000) < 0.01);

const pequeña = calcularDestino(400, 300, TAMANOS.portada);
ok("una foto pequeña NO se amplía", pequeña.ancho === 400 && pequeña.alto === 300);

const cuadrada = calcularDestino(2000, 2000, TAMANOS.logo);
ok("cuadrada 2000 en logo → 512×512", cuadrada.ancho === 512 && cuadrada.alto === 512);

console.log("\n--- Casos raros ---");
ok("ancho 0 devuelve 0", calcularDestino(0, 100, TAMANOS.portada).ancho === 0);
ok("valores basura no rompen", calcularDestino(null, undefined, TAMANOS.portada).ancho === 0);

console.log("\n--- Formatos aceptados ---");
ok("JPG entra", tipoAceptado("image/jpeg"));
ok("PNG entra", tipoAceptado("image/png"));
ok("WebP entra", tipoAceptado("image/webp"));
ok("HEIC NO entra", !tipoAceptado("image/heic"));
ok("PDF NO entra", !tipoAceptado("application/pdf"));

console.log("\n--- Rechazos con mensaje claro ---");
ok("sin archivo avisa", revisarArchivo(null).includes("No se eligió"));
ok("HEIC explica qué hacer", revisarArchivo({ type: "image/heic", size: 100 }).includes("JPG"));
ok(
  "más de 20 MB se rechaza",
  revisarArchivo({ type: "image/jpeg", size: MAX_BYTES_ENTRADA + 1 }).includes("máximo")
);
ok("un JPG normal pasa", revisarArchivo({ type: "image/jpeg", size: 3_000_000 }) === "");

console.log("\n--- Nombres de archivo ---");
ok("quita acentos", nombreLimpio("Portada Año Nuevo.jpg") === "portada-ano-nuevo");
ok("quita espacios", nombreLimpio("mi foto.png") === "mi-foto");
ok("no deja guiones sueltos", !nombreLimpio("--hola--.jpg").startsWith("-"));
ok("corta a 60 caracteres", nombreLimpio("a".repeat(200)).length <= 60);

console.log("\n--- Peso legible ---");
ok("bytes", pesoTexto(500) === "500 B");
ok("kilobytes", pesoTexto(219344) === "214 KB");
ok("megabytes", pesoTexto(3_145_728) === "3.0 MB");

console.log(`\n${pasa} PASA / ${falla} FALLA\n`);
process.exit(falla ? 1 : 0);
