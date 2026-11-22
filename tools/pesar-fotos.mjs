/**
 * All Cancún — Revisar el peso de las fotos del bucket
 *
 * Dice cuánto pesa cada imagen subida y avisa de las que se colaron
 * sin comprimir. Sirve para confirmar que la compresión funciona.
 *
 * Uso:
 *   node tools/pesar-fotos.mjs <R2_ACCESO> <R2_SECRETO>
 *
 * Las credenciales salen de Cloudflare → R2 → Manage R2 API Tokens.
 * No se guardan en ningún archivo: se pasan y se olvidan.
 */
import { firmarS3 } from "../worker/index.js";

const CUENTA = "6073feea89ebe3f376f8ec91d6e733a8";
const BUCKET = "all-cancun";
const PUBLICO = "https://pub-29c2c6b56ddd4b2681e97331c0334d1f.r2.dev";

/* Límites de "está bien" por tipo de foto. Una portada puede pesar más
   que un logo porque se ve a pantalla completa. */
const LIMITES = {
  portada: 400 * 1024,
  logo: 80 * 1024,
  producto: 250 * 1024,
};

const [acceso, secreto] = process.argv.slice(2);
if (!acceso || !secreto) {
  console.log("\nFaltan las credenciales.\n");
  console.log("  node tools/pesar-fotos.mjs <R2_ACCESO> <R2_SECRETO>\n");
  console.log("Se sacan de Cloudflare → R2 → Manage R2 API Tokens.\n");
  process.exit(1);
}

const kb = (b) => `${Math.round(b / 1024)} KB`;

/* Lista todo el bucket. Devuelve [{clave, bytes}]. */
async function listar() {
  const url = await firmarS3({
    metodo: "GET",
    bucket: BUCKET,
    clave: "",
    acceso,
    secreto,
    accountId: CUENTA,
    params: { "list-type": "2" },
  });

  const r = await fetch(url);
  if (!r.ok) {
    console.log(`\nR2 respondió ${r.status}. Revisa las credenciales.\n`);
    console.log((await r.text()).slice(0, 300) + "\n");
    process.exit(1);
  }

  /* El XML trae <Contents><Key>…</Key><Size>123</Size></Contents> */
  const xml = await r.text();
  const objetos = [];
  for (const trozo of xml.split("<Contents>").slice(1)) {
    const clave = trozo.match(/<Key>([^<]*)<\/Key>/)?.[1];
    const bytes = Number(trozo.match(/<Size>(\d+)<\/Size>/)?.[1] || 0);
    if (clave) objetos.push({ clave, bytes });
  }
  return objetos;
}

const objetos = await listar();

if (!objetos.length) {
  console.log("\nEl bucket está vacío. Sube una foto desde el panel y vuelve a mirar.\n");
  process.exit(0);
}

console.log(`\n${objetos.length} archivo(s) en el bucket "${BUCKET}":\n`);
console.log("  PESO      TIPO       ESTADO  RUTA");
console.log("  " + "-".repeat(66));

let pesadas = 0;
for (const { clave, bytes } of objetos.sort((a, b) => b.bytes - a.bytes)) {
  const tipo = clave.includes("portada")
    ? "portada"
    : clave.includes("logo")
      ? "logo"
      : clave.endsWith(".webp")
        ? "producto"
        : "otro";

  const limite = LIMITES[tipo];
  const estado = !limite ? "  -- " : bytes <= limite ? "  ✓  " : " ¡!  ";
  if (limite && bytes > limite) pesadas++;

  console.log(`  ${kb(bytes).padEnd(9)} ${tipo.padEnd(10)} ${estado}  ${clave}`);
}

const total = objetos.reduce((s, o) => s + o.bytes, 0);
console.log("  " + "-".repeat(66));
console.log(`  Total: ${kb(total)} de 10 GB gratis\n`);

if (pesadas) {
  console.log(`⚠ ${pesadas} foto(s) pasan del límite recomendado.`);
  console.log("  Comprueba que la compresión corre antes de subir.");
  console.log("  Revisa: ¿se subió desde el panel o desde otro sitio?\n");
} else {
  console.log("✓ Todas las fotos están en peso óptimo para web.\n");
}

console.log(`Para abrir una: ${PUBLICO}/<ruta>\n`);
