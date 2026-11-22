/**
 * All Cancún Comercios — Piezas pequeñas del panel
 * Funciones puras que no tocan la red: se pueden probar de una.
 *
 * Aquí vive todo lo que hay que poder probar sin navegador:
 * espacios de imagen vacíos, contadores, etiquetas de estado.
 */

import { escape } from "../shared/escape.js";
import { CATEGORIAS, content, ico } from "./content.js";

/** Logo de Google, inline para no depender de red */
export const googleLogo = () => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2.1 3.7-5.1 3.7-8.6z"/>
  <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5l-.1.1-3.6 2.8-.1.1C3.4 21.3 7.4 24 12 24z"/>
  <path fill="#FBBC05" d="M5.3 14.4c-.3-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4V9.5L1.5 6.7l-.1.1C.5 8.4 0 10.1 0 12s.5 3.6 1.4 5.2l3.9-2.8z"/>
  <path fill="#EA4335" d="M12 4.7c2.2 0 3.7.9 4.5 1.7l3.3-3.2C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.7l3.9 2.9c.9-2.9 3.6-4.9 6.7-4.9z"/>
</svg>`;

/** "Juana Pérez" → "J" (inicial para el avatar) */
export function initial(nombre) {
  const limpio = String(nombre || "").trim();
  if (!limpio) return "·";
  return limpio.charAt(0).toUpperCase();
}

/**
 * La cara del menú: la foto de Gmail de la persona, no la del negocio.
 * El menú abre con "tu cuenta", así que ahí va tu cara.
 *
 * Prioridad:
 *   1. `foto_perfil_url` — la que se guardó del alta con Google
 *   2. `avatar_url` / `picture` del token — por si el perfil no la tiene
 *   3. logo del negocio → portada — respaldo cuando no hay foto de Google
 *   4. "" — `drawerHTML` pinta entonces la inicial
 */
export function fotoMenu({ perfil, meta = {}, negocio } = {}) {
  const dePerfil = String(perfil?.foto_perfil_url || "").trim();
  if (dePerfil) return dePerfil;

  const deGoogle = String(meta?.avatar_url || meta?.picture || "").trim();
  if (deGoogle) return deGoogle;

  const n = negocio || {};
  return String(n.logo_url || n.foto_url || "").trim();
}

/** id de categoría → etiqueta legible */
export function categoriaLabel(id) {
  const found = CATEGORIAS.find((c) => c.id === id);
  return found ? found.label : "";
}

/** id de categoría → acento de color (para el borde de la tarjeta) */
export function categoriaAccent(id) {
  const found = CATEGORIAS.find((c) => c.id === id);
  return found ? found.accent : "hogar";
}

/** Pinta un mensaje de estado en el panel */
export function setMsg(node, texto, tone = "error") {
  if (!node) return;
  node.textContent = texto || "";
  node.dataset.tone = tone;
  node.hidden = !texto;
}

/** Etiqueta del estado del negocio */
export function estadoLabel(estado) {
  if (estado === "activo") return content.statusActivo;
  if (estado === "suspendido") return content.statusSuspendido;
  return content.statusBorrador;
}

/** Pista que explica qué significa el estado */
export function estadoHint(estado) {
  if (estado === "activo") return content.statusHintActivo;
  if (estado === "suspendido") return content.statusHintSuspendido;
  return content.statusHintBorrador;
}

/** Clase CSS del estado, para pintar el color correcto */
export function estadoTone(estado) {
  if (estado === "activo") return "ok";
  if (estado === "suspendido") return "bad";
  return "draft";
}

/**
 * Espacio de imagen. SIEMPRE se dibuja, tenga o no foto.
 * Sin foto: recuadro punteado con el icono y el texto de qué va ahí.
 * Es visible a propósito: el comerciante ve dónde falta la foto.
 */
export function photoSlot({ label, hint = "", variant = "square", hasImage = false, src = "" }) {
  const clase = `cm-photo cm-photo--${variant}${hasImage ? " has-image" : ""}`;
  if (hasImage && src) {
    /* data-cm-foto-fallback: si la URL existe en la base pero el archivo
       ya no está en el bucket (por ejemplo se borró a mano), el <img>
       quedaría roto. El JS lo cambia al recuadro punteado. */
    return `<div class="${clase}">
      <img class="cm-photo__img" src="${escape(src)}" alt="${escape(label)}" loading="lazy"
        data-cm-foto-fallback="${escape(label)}" />
    </div>`;
  }
  return `<div class="${clase}" role="img" aria-label="${escape(label)}">
    <span class="cm-photo__ico" aria-hidden="true">${ico.camera}</span>
    <span class="cm-photo__label">${escape(label)}</span>
    ${hint ? `<span class="cm-photo__hint">${escape(hint)}</span>` : ""}
  </div>`;
}

/** Contador de productos en palabras. 0 → "Sin productos" (nunca "0 productos") */
export function productsCount(n) {
  const total = Number(n) || 0;
  if (total === 0) return content.menu.countNone;
  if (total === 1) return content.menu.countOne;
  return content.menu.countMany.replace("{n}", String(total));
}

/** Valor vacío con guion: nunca inventamos un dato que no existe */
export function oGuion(valor) {
  const limpio = String(valor ?? "").trim();
  return limpio || "—";
}

/** Texto cuando el campo está vacío: dice qué falta, no un ejemplo falso */
export function oFalta(valor, textoFalta) {
  const limpio = String(valor ?? "").trim();
  return limpio
    ? escape(limpio)
    : `<span class="cm-muted">${escape(textoFalta)}</span>`;
}

/** Precio en centavos → "$35" / "$35.50". Sin precio → "Sin precio". */
export function precioTexto(centavos, fallback = content.menu.priceEmpty) {
  if (centavos === null || centavos === undefined || centavos === "") {
    return fallback;
  }
  const n = Number(centavos);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  const pesos = Math.floor(n / 100);
  const cents = n % 100;
  const miles = pesos.toLocaleString("es-MX");
  return cents === 0 ? `$${miles}` : `$${miles}.${String(cents).padStart(2, "0")}`;
}

export { escape };

