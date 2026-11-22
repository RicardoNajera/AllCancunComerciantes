/**
 * Verifica que cada icono del panel se pinte, que los sólidos declaren
 * un tono existente en la paleta y que ninguno quede sin SVG.
 */

import { ico } from "../features/panel/content.js";

let pasa = 0;
let falla = 0;
const ok = (n, c) => {
  if (c) {
    pasa++;
    console.log("PASA   " + n);
  } else {
    falla++;
    console.log("FALLA  " + n);
  }
};

const nombres = Object.keys(ico);
const tonos = [
  "aqua",
  "violeta",
  "ambar",
  "rosa",
  "cielo",
  "lima",
  "coral",
  "rojo",
];

console.log("--- Todos los iconos pintan ---");
ok("hay iconos", nombres.length >= 18);
ok("todos traen svg", nombres.every((n) => ico[n].includes("<svg")));
ok("todos cierran svg", nombres.every((n) => ico[n].includes("</svg>")));
ok("todos son aria-hidden", nombres.every((n) => ico[n].includes('aria-hidden="true"')));

console.log("\n--- Los solidos usan tonos validos ---");
const solidos = nombres.filter((n) => ico[n].includes('class="ico ico--'));
/* Siete sólidos quedan en el panel: los cuatro de pestañas pasaron a línea
   para heredar el color activo sin archivos duplicados. */
ok("hay iconos solidos", solidos.length >= 7);

ok(
  "cada solido referencia un tono de la paleta",
  solidos.every((n) => tonos.some((t) => ico[n].includes(`ico--${t}`)))
);

console.log("\n--- El relleno apunta a una variable CSS ---");
ok(
  "relleno con var(--ico-...)",
  solidos.every((n) => /fill="var\(--ico-[a-z]+\)"/.test(ico[n]))
);

/* Los cuatro de la barra de pestañas son de línea: heredan el color del
   texto para que se pinten solos al cambiar de pestaña activa. */
console.log("\n--- Iconos de las pestañas son de linea ---");
const pestanas = ["tabStore", "menu", "bag", "gear"];
ok(
  "las pestanas heredan el color del texto",
  pestanas.every((n) => ico[n].includes('stroke="currentColor"'))
);
ok(
  "las pestanas no llevan relleno de color",
  pestanas.every((n) => !/fill="#[0-9A-Fa-f]{3,6}"/.test(ico[n]))
);
ok(
  "las pestanas comparten el mismo viewBox 24",
  pestanas.every((n) => ico[n].includes('viewBox="0 0 24 24"'))
);
ok(
  "las pestanas no quedan como solidos",
  pestanas.every((n) => !ico[n].includes('class="ico ico--'))
);

console.log("\n--- Iconos clave presentes ---");
["store", "menu", "bag", "gear", "tabStore", "pencil", "trash", "plus", "check", "camera"].forEach(
  (n) => ok(n + " existe", Boolean(ico[n]))
);

console.log("\n" + pasa + " PASA / " + falla + " FALLA");
process.exit(falla ? 1 : 0);
