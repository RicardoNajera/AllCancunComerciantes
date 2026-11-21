/* All Cancún Comercios — Service Worker
 *
 * Estrategia deliberadamente simple: el panel no sirve de nada sin red
 * (necesita leer y escribir en Supabase), así que no intentamos offline
 * completo. Cacheamos el cascarón para que abra rápido y muestre el panel
 * en cuanto haya conexión.
 */

const CACHE_VERSION = "v1";
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
  "./features/panel/index.js",
  "./features/panel/views.js",
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

/* Fetch */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

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

  /* Estáticos: caché primero, luego red */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
        }
        return res;
      });
    })
  );
});
