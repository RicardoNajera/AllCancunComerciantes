/**
 * All Cancún — Worker de fotos (Cloudflare)
 *
 * Hace tres cosas y ninguna más:
 *   POST /firmar  → devuelve una URL PUT temporal para subir
 *   POST /borrar  → borra un objeto
 *   GET  /salud   → comprobación rápida
 *
 * NO sirve las imágenes: el bucket es público y el <img> va directo a
 * R2. Así el cupo de Worker solo se gasta al subir fotos (unos cientos
 * al mes), no cada vez que alguien mira una.
 *
 * La seguridad tiene dos capas:
 *   1. Sin token de Supabase válido no se firma nada.
 *   2. La ruta pedida tiene que empezar por la carpeta del dueño del
 *      token. Así nadie puede sobrescribir la portada de otro negocio.
 */

const SUPABASE_URL = "https://djyrqcjvcibnhvwwarlq.supabase.co";

/* Cuánto vive la URL firmada. Suficiente para subir 250 KB incluso con
   datos móviles lentos, y corto para que no sirva de nada si se filtra. */
const FIRMA_SEGUNDOS = 300;

const json = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

const sinCuerpo = (status, headers = {}) => new Response(null, { status, headers });

/* ---- R2 con firma SigV4 (sin dependencias externas) ---- */

const hex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function sha256(texto) {
  const datos = typeof texto === "string" ? new TextEncoder().encode(texto) : texto;
  return hex(await crypto.subtle.digest("SHA-256", datos));
}

async function hmac(clave, datos) {
  const claveCrypto = await crypto.subtle.importKey(
    "raw",
    typeof clave === "string" ? new TextEncoder().encode(clave) : clave,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign(
    "HMAC",
    claveCrypto,
    typeof datos === "string" ? new TextEncoder().encode(datos) : datos
  );
}

/**
 * Firma SigV4 de una sola petición. Sirve para PUT (subir), DELETE,
 * GET y para listar el bucket (con `params`).
 * La URL resultante caduca en FIRMA_SEGUNDOS.
 */
async function firmarS3({
  metodo,
  bucket,
  clave,
  acceso,
  secreto,
  accountId,
  region = "auto",
  params = {},
}) {
  const ahora = new Date();
  const amzFecha = ahora.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dia = amzFecha.slice(0, 8);

  /* R2 usa el endpoint con el ID de cuenta y el bucket va en la RUTA.
     El formato <bucket>.r2.cloudflarestorage.com NO existe: daba error
     de TLS y por eso la subida fallaba con "revisa la conexión". */
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const rutaCodificada = `/${bucket}/` + clave.split("/").map(encodeURIComponent).join("/");

  const query = [
    ...Object.entries(params),
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${acceso}/${dia}/${region}/s3/aws4_request`],
    ["X-Amz-Date", amzFecha],
    ["X-Amz-Expires", String(FIRMA_SEGUNDOS)],
    ["X-Amz-SignedHeaders", "host"],
  ]
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .sort()
    .join("&");

  const canonica = [
    metodo,
    rutaCodificada,
    query,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const alcance = `${dia}/${region}/s3/aws4_request`;
  const paraFirmar = ["AWS4-HMAC-SHA256", amzFecha, alcance, await sha256(canonica)].join("\n");

  const kFecha = await hmac(`AWS4${secreto}`, dia);
  const kRegion = await hmac(kFecha, region);
  const kServicio = await hmac(kRegion, "s3");
  const kFirma = await hmac(kServicio, "aws4_request");
  const firma = hex(await hmac(kFirma, paraFirmar));

  return `https://${host}${rutaCodificada}?${query}&X-Amz-Signature=${firma}`;
}

/* ---- Validación del token de Supabase ---- */

async function usuarioDelToken(peticion, entorno) {
  const autorizacion = peticion.headers.get("Authorization") || "";
  const token = autorizacion.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  /* El header `apikey` es obligatorio en Supabase: sin él la respuesta
     es 401 aunque el token del usuario sea perfectamente válido. Sin
     esto, cada subida decía "tu sesión expiró" con la sesión intacta. */
  const anon = entorno?.SUPABASE_ANON_KEY;
  if (!anon) return null;

  /* Se pregunta a Supabase quién es: así la validación es la misma que
     usa la base (incluye expiración y revocación). Decodificar el JWT
     en el Worker aceptaría tokens caducados. */
  try {
    const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!respuesta.ok) return null;
    const usuario = await respuesta.json();
    return usuario?.id ? usuario : null;
  } catch {
    return null;
  }
}

/**
 * Comprueba que la ruta pertenece a quien la pide.
 *
 *   negocios/<dueno_id>/...   → dueno_id debe ser el usuario
 *   productos/<negocio_id>/.. → negocio_id debe ser SU negocio
 *   perfiles/<user_id>.webp   → user_id debe ser el usuario
 *
 * El id del negocio no es el id del dueño, así que para productos hay
 * que confirmarlo contra la base. Es una consulta por subida, no por
 * visita: no pesa.
 */
async function rutaPermitida(ruta, usuarioId, entorno) {
  const partes = String(ruta || "").split("/").filter(Boolean);
  if (partes.length < 2) return false;

  /* Nada de ".." ni barras invertidas. */
  if (partes.some((p) => p === ".." || p.includes("\\"))) return false;

  const [carpeta, dueno] = partes;

  if (carpeta === "negocios" || carpeta === "perfiles") {
    return dueno === usuarioId;
  }

  if (carpeta === "productos") {
    const anon = entorno.SUPABASE_ANON_KEY;
    if (!anon) return false;

    try {
      const consulta =
        `${SUPABASE_URL}/rest/v1/negocios?select=id` +
        `&id=eq.${encodeURIComponent(dueno)}` +
        `&dueno_id=eq.${encodeURIComponent(usuarioId)}&limit=1`;

      const respuesta = await fetch(consulta, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      });
      if (!respuesta.ok) return false;
      const filas = await respuesta.json();
      return Array.isArray(filas) && filas.length === 1;
    } catch {
      return false;
    }
  }

  return false;
}

/* Se exporta la firma para poder probarla contra R2 de verdad sin
   necesitar el token de un usuario. No se usa en producción. */
export { firmarS3 };

/* ---- Entrada del Worker ---- */

export default {
  async fetch(peticion, entorno) {
    const url = new URL(peticion.url);

    /* CORS: el navegador del panel pregunta antes de subir. */
    if (peticion.method === "OPTIONS") {
      return sinCuerpo(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "3600",
      });
    }

    if (url.pathname === "/salud") {
      return json({
        ok: true,
        bucket: entorno.R2_BUCKET || "",
        listo: Boolean(entorno.R2_ACCESO && entorno.R2_SECRETO),
      });
    }

    if (peticion.method !== "POST") {
      return json({ error: "Método no permitido" }, 405);
    }

    const usuario = await usuarioDelToken(peticion, entorno);
    if (!usuario) return json({ error: "No autorizado" }, 401);

    let cuerpo = {};
    try {
      cuerpo = await peticion.json();
    } catch {
      return json({ error: "Cuerpo inválido" }, 400);
    }

    const ruta = String(cuerpo.ruta || "").replace(/^\/+/, "");
    if (!ruta) return json({ error: "Falta la ruta" }, 400);

    if (!(await rutaPermitida(ruta, usuario.id, entorno))) {
      return json({ error: "Esa carpeta no es tuya" }, 403);
    }

    const bucket = entorno.R2_BUCKET;
    const acceso = entorno.R2_ACCESO;
    const secreto = entorno.R2_SECRETO;
    /* El ID de cuenta forma parte del endpoint S3, no es opcional. */
    const accountId = entorno.R2_ACCOUNT_ID;
    if (!bucket || !acceso || !secreto || !accountId) {
      return json({ error: "Worker sin configurar" }, 500);
    }

    if (url.pathname === "/firmar") {
      const firmada = await firmarS3({ metodo: "PUT", bucket, clave: ruta, acceso, secreto, accountId });
      return json({ url: firmada, expira: FIRMA_SEGUNDOS });
    }

    if (url.pathname === "/borrar") {
      const firmada = await firmarS3({ metodo: "DELETE", bucket, clave: ruta, acceso, secreto, accountId });
      const borrado = await fetch(firmada, { method: "DELETE" });
      /* 404 = ya no estaba. Para el usuario es lo mismo: no está. */
      if (!borrado.ok && borrado.status !== 404) {
        return json({ error: `R2 respondió ${borrado.status}` }, 502);
      }
      return json({ ok: true });
    }

    return json({ error: "Ruta desconocida" }, 404);
  },
};
