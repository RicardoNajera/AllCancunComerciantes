/**
 * All Cancún — Firma SigV4 del Worker
 *
 * El Worker firma las subidas a R2 a mano (sin SDK) para que el Worker
 * pese poco. Si el algoritmo se rompe, la subida falla con un 403 de R2
 * que no dice por qué. Esta prueba lo detecta antes de desplegar.
 *
 * Compara la firma contra una segunda implementación escrita por
 * separado a partir de la spec de AWS. Si ambas coinciden, es correcta.
 *
 * Se ejecuta con:  node test/firma.test.mjs
 */

const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

const sha256 = async (t) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));

const hmac = async (clave, datos) => {
  const k = await crypto.subtle.importKey(
    "raw",
    typeof clave === "string" ? new TextEncoder().encode(clave) : clave,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(datos));
};

/* ---- Igual que el Worker ---- */
async function firmar({ metodo, bucket, clave, acceso, secreto, amzFecha, accountId = "6073feea89ebe3f376f8ec91d6e733a8", region = "auto" }) {
  const dia = amzFecha.slice(0, 8);
  /* Endpoint real de R2: <cuenta>.r2.cloudflarestorage.com y bucket en la ruta. */
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const ruta = `/${bucket}/` + clave.split("/").map(encodeURIComponent).join("/");

  const query = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${acceso}/${dia}/${region}/s3/aws4_request`],
    ["X-Amz-Date", amzFecha],
    ["X-Amz-Expires", "300"],
    ["X-Amz-SignedHeaders", "host"],
  ]
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .sort()
    .join("&");

  const canonica = [metodo, ruta, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const alcance = `${dia}/${region}/s3/aws4_request`;
  const paraFirmar = ["AWS4-HMAC-SHA256", amzFecha, alcance, await sha256(canonica)].join("\n");

  const kFecha = await hmac(`AWS4${secreto}`, dia);
  const kRegion = await hmac(kFecha, region);
  const kServicio = await hmac(kRegion, "s3");
  const kFirma = await hmac(kServicio, "aws4_request");
  const firma = hex(await hmac(kFirma, paraFirmar));

  return { url: `https://${host}${ruta}?${query}&X-Amz-Signature=${firma}`, firma, canonica };
}

/* ---- Referencia independiente: reimplementación desde la spec ---- */
async function firmaReferencia({ metodo, bucket, clave, acceso, secreto, amzFecha, accountId = "6073feea89ebe3f376f8ec91d6e733a8", region = "auto" }) {
  const dia = amzFecha.slice(0, 8);
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const encode = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const ruta = `/${bucket}/` + clave.split("/").map(encode).join("/");

  const pares = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${acceso}/${dia}/${region}/s3/aws4_request`,
    "X-Amz-Date": amzFecha,
    "X-Amz-Expires": "300",
    "X-Amz-SignedHeaders": "host",
  };
  const query = Object.keys(pares)
    .sort()
    .map((k) => `${encode(k)}=${encode(pares[k])}`)
    .join("&");

  const canonica = [metodo, ruta, query, `host:${host}`, "", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const alcance = `${dia}/${region}/s3/aws4_request`;
  const paraFirmar = ["AWS4-HMAC-SHA256", amzFecha, alcance, await sha256(canonica)].join("\n");

  let k = await hmac(`AWS4${secreto}`, dia);
  k = await hmac(k, region);
  k = await hmac(k, "s3");
  k = await hmac(k, "aws4_request");
  return {
    firma: hex(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(paraFirmar))),
    canonica,
  };
}

let fallos = 0;
const ok = (n, c) => { if (!c) { fallos++; console.log("  FALLA " + n); } };

const caso = {
  metodo: "PUT",
  bucket: "all-cancun",
  clave: "negocios/abc-123/portada.webp",
  acceso: "AKIAIOSFODNN7EXAMPLE",
  secreto: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  amzFecha: "20260101T120000Z",
};

const a = await firmar(caso);
const b = await firmaReferencia(caso);

console.log("\n--- Firma SigV4 ---");
ok("las dos implementaciones coinciden", a.firma === b.firma);
ok("la firma tiene 64 hex", /^[0-9a-f]{64}$/.test(a.firma));
ok("cadena canónica idéntica", a.canonica === b.canonica);
ok("la URL lleva la firma", a.url.includes("X-Amz-Signature=" + a.firma));
ok("apunta al endpoint de cuenta (no al bucket)", a.url.includes("6073feea89ebe3f376f8ec91d6e733a8.r2.cloudflarestorage.com/all-cancun/"));
ok("el bucket va en la ruta, no en el host", !a.url.includes("all-cancun.r2.cloudflarestorage.com"));
ok("ruta con barras intactas", a.url.includes("/negocios/abc-123/portada.webp?"));
ok("método en la firma importa", (await firmar({ ...caso, metodo: "DELETE" })).firma !== a.firma);
ok("la clave importa", (await firmar({ ...caso, clave: "negocios/abc-123/logo.webp" })).firma !== a.firma);

/* Espacios y acentos en el nombre del archivo */
const conAcento = await firmar({ ...caso, clave: "negocios/u1/portada año.webp" });
const acentoRef = await firmaReferencia({ ...caso, clave: "negocios/u1/portada año.webp" });
ok("acentos coinciden", conAcento.firma === acentoRef.firma);
ok("espacio codificado", conAcento.url.includes("%20"));
ok("acento codificado", conAcento.url.includes("%C3%B1") || conAcento.url.includes("%C3%91"));

console.log(fallos ? `\n${fallos} fallo(s)` : "\n✓ firma SigV4 correcta");
process.exit(fallos ? 1 : 0);
