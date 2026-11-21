/**
 * All Cancún Comercios — Arranque
 *
 * Ciclo de vida:
 *   1. ¿Falta configurar Supabase?  → pantalla de aviso
 *   2. ¿Hay sesión?                 → no: pantalla de login con Google
 *   3. ¿Tiene sesión?               → carga su perfil y sus permisos
 *   4. Pinta el panel según lo que tenga:
 *        - sin negocio     → "Abre tu negocio" (alta)
 *        - con negocio     → panel con su tienda y su menú
 *
 * La app no decide nada por sí sola: la base dice quién vende y qué tienda
 * es suya. Si alguien intenta tocar el negocio de otro, RLS lo rechaza.
 */

import { mountPanel } from "./features/panel/index.js";
import {
  isConfigured,
  getSession,
  onAuthChange,
} from "./features/shared/supabase.js";

const screen = document.getElementById("app-screen");
const topbar = document.getElementById("app-topbar");
const dock = document.getElementById("app-dock");

let dispose = null;
let unlisten = null;

/* Libera la vista actual antes de pintar otra */
function clear() {
  if (typeof dispose === "function") dispose();
  dispose = null;
  if (screen) screen.innerHTML = "";
}

async function boot() {
  if (!screen) return;

  if (!isConfigured()) {
    screen.innerHTML = `
      <div class="cm-setup">
        <p class="cm-setup__title">Falta conectar Supabase</p>
        <p class="cm-setup__text">
          Añade <code>ALL_CANCUN_SUPABASE_URL</code> y
          <code>ALL_CANCUN_SUPABASE_ANON_KEY</code> en <code>config.js</code>.
        </p>
      </div>`;
    return;
  }

  const session = await getSession();
  await paint(session);

  /* Cambios de sesión (login, logout, refresh del token) */
  unlisten = await onAuthChange(async (next) => {
    await paint(next);
  });
}

async function paint(session) {
  clear();
  if (topbar) {
    topbar.hidden = true;
    topbar.innerHTML = "";
  }
  if (dock) {
    dock.hidden = true;
    dock.innerHTML = "";
  }

  dispose = await mountPanel(screen, {
    session,
    topbar,
    dock,
    onSignedOut: () => paint(null),
    onSignedIn: () => paint(null),
  });
}

window.addEventListener("pagehide", () => {
  clear();
  unlisten?.();
});

boot();

/* Service worker: solo en producción con https o localhost */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
