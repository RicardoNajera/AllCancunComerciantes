/**
 * All Cancún — Fotos en Cloudflare R2
 *
 * El bucket es público para LEER: la foto se sirve directo por su URL
 * y no gasta peticiones del Worker.
 *
 * Para ESCRIBIR hace falta el Secret de R2, que jamás puede estar en el
 * navegador. Por eso se pide una URL firmada al Worker, que valida el
 * token de Supabase antes de firmar. El navegador solo sube a esa URL.
 *
 *   navegador ──(JWT)──> Worker ──(firma)──> URL temporal
 *   navegador ──(PUT)─────────────────────> R2
 */

import { getSession } from "./supabase.js";

/* Lee la configuración de window sin asumir que existe: en Node (tests)
   o en un service worker no hay window. Sin esto, importar el módulo
   desde una prueba reventaría al pedir la URL. */
const global = () => (typeof window !== "undefined" ? window : globalThis);

const config = () => {
  const g = global();
  return {
    base: String(g.ALL_CANCUN_FOTOS_URL || "").replace(/\/+$/, ""),
    worker: String(g.ALL_CANCUN_FOTOS_WORKER || "").replace(/\/+$/, ""),
  };
};

/** true si hay bucket público configurado (se pueden VER fotos). */
export function fotosConfiguradas() {
  return Boolean(config().base);
}

/** true si además hay Worker (se pueden SUBIR fotos). */
export function subidaConfigurada() {
  const { base, worker } = config();
  return Boolean(base && worker);
}

/**
 * Ruta del archivo dentro del bucket.
 * Lleva el dueño en el nombre para que el Worker pueda comprobar que
 * quien firma es el mismo que sube. Sin eso, cualquier usuario podría
 * sobrescribir las fotos de otro negocio.
 *
 *   negocios/<dueno_id>/portada.webp
 *   negocios/<dueno_id>/logo.webp
 *   productos/<negocio_id>/<producto_id>.webp
 *   perfiles/<user_id>.webp
 */
export function rutaFoto({ tipo, duenoId, negocioId, productoId, extension = "webp" }) {
  const ext = String(extension || "webp").replace(/^\./, "").toLowerCase() || "webp";

  if (tipo === "portada" || tipo === "logo") {
    if (!duenoId) return "";
    return `negocios/${duenoId}/${tipo}.${ext}`;
  }

  if (tipo === "producto") {
    if (!negocioId || !productoId) return "";
    return `productos/${negocioId}/${productoId}.${ext}`;
  }

  if (tipo === "perfil") {
    if (!duenoId) return "";
    return `perfiles/${duenoId}.${ext}`;
  }

  return "";
}

/**
 * URL pública de una foto. Devuelve "" si falta la base o la ruta,
 * para que la vista pinte el recuadro vacío en vez de un <img> roto.
 */
export function urlFoto(ruta) {
  const { base } = config();
  const limpia = String(ruta || "").replace(/^\/+/, "");
  if (!base || !limpia) return "";
  return `${base}/${limpia}`;
}

/** Ruta a partir de una URL pública. Sirve para borrar lo que ya se ve. */
export function rutaDesdeUrl(url) {
  const { base } = config();
  const texto = String(url || "").trim();
  if (!base || !texto.startsWith(`${base}/`)) return "";
  return texto.slice(base.length + 1).split("?")[0];
}

/* ---- Subida ---- */

/**
 * Sube un Blob ya comprimido a R2.
 *
 * 1. Pide al Worker una URL firmada (autoriza con el token de Supabase)
 * 2. Hace PUT del blob a esa URL (CORS del bucket permite el origen)
 *
 * @returns {Promise<{url: string|null, ruta: string, error: string}>}
 */
export async function subirFoto(blob, ruta) {
  const destino = String(ruta || "").replace(/^\/+/, "");
  if (!destino) return { url: null, ruta: "", error: "Falta la ruta de la foto." };

  const { worker } = config();
  if (!worker) {
    return { url: null, ruta: destino, error: "La subida de fotos aún no está activada." };
  }
  if (!blob) return { url: null, ruta: destino, error: "No hay imagen que subir." };

  const session = await getSession();
  if (!session?.access_token) {
    return { url: null, ruta: destino, error: "Inicia sesión para subir fotos." };
  }

  let firmada = null;
  try {
    const respuesta = await fetch(`${worker}/firmar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ruta: destino }),
    });

    if (!respuesta.ok) {
      /* El Worker manda 403 cuando la ruta no es del dueño del token:
         es la comprobación que impide tocar fotos ajenas. */
      const mensaje =
        respuesta.status === 403
          ? "No tienes permiso para subir a esa carpeta."
          : respuesta.status === 401
            ? "Tu sesión expiró. Vuelve a entrar."
            : "No se pudo autorizar la subida.";
      return { url: null, ruta: destino, error: mensaje };
    }
    firmada = await respuesta.json();
  } catch {
    return { url: null, ruta: destino, error: "No se pudo contactar al servidor de fotos." };
  }

  const urlPut = firmada?.url;
  if (!urlPut) return { url: null, ruta: destino, error: "El servidor no devolvió la URL de subida." };

  try {
    const subida = await fetch(urlPut, {
      method: "PUT",
      headers: { "Content-Type": blob.type || "image/webp" },
      body: blob,
    });
    if (!subida.ok) {
      return { url: null, ruta: destino, error: `R2 rechazó la subida (${subida.status}).` };
    }
  } catch {
    /* Llegar aquí casi siempre es CORS: el origen de la página no está
       en la política del bucket. */
    return {
      url: null,
      ruta: destino,
      error: "No se pudo enviar la imagen. Revisa la conexión e inténtalo otra vez.",
    };
  }

  /* Se añade la versión para saltarse la caché: si se cambia la portada,
     el mismo nombre apuntaría a la foto vieja en el navegador. */
  return { url: `${urlFoto(destino)}?v=${Date.now()}`, ruta: destino, error: "" };
}

/**
 * Borra una foto del bucket. Sin esto quedarían archivos huérfanos
 * pagando almacenamiento para siempre.
 */
export async function borrarFoto(ruta) {
  const destino = String(ruta || "").replace(/^\/+/, "");
  if (!destino) return { error: "" };

  const { worker } = config();
  if (!worker) return { error: "" };

  const session = await getSession();
  if (!session?.access_token) return { error: "Sin sesión." };

  try {
    const respuesta = await fetch(`${worker}/borrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ruta: destino }),
    });
    if (!respuesta.ok) return { error: `No se pudo borrar la imagen (${respuesta.status}).` };
    return { error: "" };
  } catch {
    return { error: "No se pudo contactar al servidor de fotos." };
  }
}
