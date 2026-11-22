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
ok("hay iconos solidos", solidos.length >= 9);
ok(
  "cada solido referencia un tono de la paleta",
  solidos.every((n) => tonos.some((t) => ico[n].includes(`ico--${t}`)))
);

console.log("\n--- El relleno apunta a una variable CSS ---");
ok(
  "relleno con var(--ico-...)",
  solidos.every((n) => /fill="var\(--ico-[a-z]+\)"/.test(ico[n]))
);

console.log("\n--- Iconos clave presentes ---");
["store", "menu", "bag", "gear", "pencil", "trash", "plus", "check", "camera"].forEach(
  (n) => ok(n + " existe", Boolean(ico[n]))
);

console.log("\n" + pasa + " PASA / " + falla + " FALLA");
process.exit(falla ? 1 : 0);
