/**
 * All Cancún Comercios — Estados de la página pública
 * Cargando, no encontrado, sin conexión. Nada técnico visible:
 * el cliente nunca debe leer "PGRST116".
 */

import { escape } from "../shared/escape.js";

export const cargandoHTML = () => `
  <div class="cl-splash" role="status" aria-live="polite">
    <span class="cl-splash__dot" aria-hidden="true"></span>
    <p>Cargando comercios de Cancún…</p>
  </div>`;

export const noEncontradoHTML = () => `
  <div class="cl-splash">
    <p class="cl-splash__title">Este comercio no está disponible</p>
    <p class="cl-splash__lead">
      Puede que haya cerrado o que su dueño todavía no lo haya publicado.
    </p>
    <a class="cl-btn" href="#/">Ver otros comercios</a>
  </div>`;

export const sinConexionHTML = (detalle = "") => `
  <div class="cl-splash">
    <p class="cl-splash__title">No pudimos cargar el catálogo</p>
    <p class="cl-splash__lead">Revisa tu conexión y vuelve a intentarlo.</p>
    ${detalle ? `<p class="cl-splash__error">${escape(detalle)}</p>` : ""}
    <button type="button" class="cl-btn" data-cl-reintentar>Reintentar</button>
  </div>`;
