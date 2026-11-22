/* All Cancún Comercios — Service Worker
 *
 * Estrategia deliberadamente simple: el panel no sirve de nada sin red
 * (necesita leer y escribir en Supabase), así que no intentamos offline
 * completo. Cacheamos el cascarón para que abra rápido y muestre el panel
 * en cuanto haya conexión.
 */

const CACHE_VERSION = "v8";
const CACHE_NAME = `all-cancun-comercios-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./config.js",
  "./app.js",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/panel.css",
  "./features/shared/supabase.js",
  "./features/shared/escape.js",
  "./features/shared/negocio.js",
  "./features/shared/imagen.js",
  "./features/shared/fotos.js",
  "./features/panel/index.js",
  "./features/panel/views.js",
  "./features/panel/views-menu.js",
  "./features/panel/views-ajustes.js",
  "./features/panel/views-form-negocio.js",
  "./features/panel/views-form-producto.js",
  "./features/panel/content.js",
  "./features/panel/bits.js",
];

/* Instalación: precarga el cascarón */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

/* Activación: borra cachés viejas de esta app */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("all-cancun-comercios-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* El panel avisa cuando quiere el relevo inmediato del SW (ver app.js) */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "skip-waiting") {
    self.skipWaiting();
  }
});

/* Fetch */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* Las fotos viven en R2 (otro origen): el navegador y Cloudflare ya
     las cachean. Aquí no se tocan, y así el SW nunca intercepta un PUT
     de subida ni sirve una portada vieja. */

  /* Navegación: red primero, caché como respaldo */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || Response.error()))
    );
    return;
  }

  /* Estáticos: red primero, caché solo si no hay red.
     Antes era "caché primero" y eso dejaba al usuario viendo CSS y JS
     viejos aunque el archivo ya estuviera corregido en el servidor:
     el panel pintaba el HTML nuevo con los estilos viejos. Si hay red,
     siempre gana lo que está publicado. */
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || Response.error()))
  );
});
