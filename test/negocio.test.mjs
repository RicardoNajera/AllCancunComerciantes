import { generarSlug, pesosACentavos, formatoPrecio } from "../features/shared/negocio.js";

let pass = 0;
let fail = 0;

const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(
    `${ok ? "PASA " : "FALLA"}  ${name}` +
      (ok ? "" : `\n        got: ${JSON.stringify(got)}\n        exp: ${JSON.stringify(want)}`)
  );
};

console.log("--- generarSlug ---");
eq("nombre simple", generarSlug("Jugos Naturales Juana"), "jugos-naturales-juana");
eq("acentos y enie", generarSlug("Café Ñoño"), "cafe-nono");
eq("espacios de mas", generarSlug("  Tacos    El   Güero  "), "tacos-el-guero");
eq("simbolos", generarSlug("Abarrotes & Más!"), "abarrotes-mas");
eq("solo simbolos", generarSlug("!!!"), "");
eq("numeros y diagonal", generarSlug("Taqueria 24/7"), "taqueria-24-7");
eq("mayusculas", generarSlug("EL PESCADITO"), "el-pescadito");

console.log("\n--- pesosACentavos ---");
eq("entero", pesosACentavos("35"), 3500);
eq("decimal", pesosACentavos("35.50"), 3550);
eq("con simbolo $", pesosACentavos("$35.50"), 3550);
eq("cero", pesosACentavos("0"), 0);
eq("vacio", pesosACentavos(""), null);
eq("texto", pesosACentavos("abc"), null);
eq("letras y numeros", pesosACentavos("35 pesos"), 3500);
eq("muy caro", pesosACentavos("999999"), null);
eq("redondeo 1.999", pesosACentavos("1.999"), 200);
eq("undefined", pesosACentavos(undefined), null);

console.log("\n--- formatoPrecio ---");
eq("3500", formatoPrecio(3500), "$35.00");
eq("3550", formatoPrecio(3550), "$35.50");
eq("0", formatoPrecio(0), "$0.00");
eq("null", formatoPrecio(null), "$0.00");
eq("miles", formatoPrecio(123456), "$1,234.56");

console.log(`\n${pass} PASA / ${fail} FALLA`);
process.exit(fail ? 1 : 0);
