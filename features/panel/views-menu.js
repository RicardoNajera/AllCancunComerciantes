/**
 * All Cancún Comercios — Vistas de Menú y Pedidos
 * Separadas de views.js para que cada archivo quepa en la cabeza.
 */

import { escape } from "../shared/escape.js";
import { content, ico } from "./content.js";
import { photoSlot, productsCount, precioTexto } from "./bits.js";

/* ==========================================================================
   Pestaña: Menú
   ========================================================================== */

export function menuHTML({ productos = [] }) {
  const total = productos.length;

  return `
    <div class="cm-tab cm-tab--menu">

      <div class="cm-toolbar">
        <span class="cm-toolbar__count">${escape(productsCount(total))}</span>
        ${
          total > 0
            ? `<button type="button" class="cm-btn cm-btn--sm" data-cm-nuevo-producto>
                 ${ico.plus}<span>${escape(content.menu.cta)}</span>
               </button>`
            : ""
        }
      </div>

      ${
        total === 0
          ? `<div class="cm-empty">
               <span class="cm-empty__ico" aria-hidden="true">${ico.menu}</span>
               <h2 class="cm-empty__title">${escape(content.menu.empty)}</h2>
               <p class="cm-empty__lead">${escape(content.menu.emptyLead)}</p>
               <button type="button" class="cm-btn" data-cm-nuevo-producto>
                 ${ico.plus}<span>${escape(content.menu.cta)}</span>
               </button>
             </div>`
          : `<ul class="cm-prods">
               ${productos.map(prodHTML).join("")}
             </ul>`
      }

      <p class="cm-msg" data-cm-msg role="status" hidden></p>
    </div>`;
}

/** Un producto del menú: foto, nombre, precio, disponible/agotado */
function prodHTML(p) {
  const disponible = p.disponible !== false;

  return `
    <li class="cm-prod${disponible ? "" : " is-off"}" data-cm-prod-id="${escape(
      p.id
    )}">
      <div class="cm-prod__media">
        ${photoSlot({
          label: content.menu.photoLabel,
          variant: "thumb",
          hasImage: Boolean(p.foto_url),
          src: p.foto_url || "",
        })}
      </div>
      <div class="cm-prod__body">
        <h3 class="cm-prod__name">${escape(p.nombre)}</h3>
        ${
          p.descripcion
            ? `<p class="cm-prod__desc">${escape(p.descripcion)}</p>`
            : ""
        }
        <p class="cm-prod__price">${escape(precioTexto(p.precio_centavos))}</p>
      </div>
      <div class="cm-prod__side">
        <button type="button" class="cm-pill${disponible ? " is-on" : ""}"
          data-cm-toggle="${escape(p.id)}"
          data-disponible="${disponible ? "1" : "0"}"
          aria-label="${escape(
            disponible ? content.menu.toggleOff : content.menu.toggleOn
          )}">
          ${disponible ? ico.check : ""}
          <span>${
            disponible ? content.menu.available : content.menu.unavailable
          }</span>
        </button>
        <button type="button" class="cm-icon-btn" data-cm-edit="${escape(p.id)}"
          aria-label="${escape(content.menu.editCta)}">
          ${ico.pencil}
        </button>
        <button type="button" class="cm-icon-btn" data-cm-del="${escape(p.id)}"
          aria-label="${escape(content.menu.deleteCta)}">
          ${ico.trash}
        </button>
      </div>
    </li>`;
}

/* ==========================================================================
   Pestaña: Pedidos
   ========================================================================== */

export function pedidosHTML({ pedidos = [], publicado = false }) {
  const total = pedidos.length;

  return `
    <div class="cm-tab cm-tab--pedidos">

      ${
        total === 0
          ? `<div class="cm-empty">
               <span class="cm-empty__ico" aria-hidden="true">${ico.bag}</span>
               <h2 class="cm-empty__title">${escape(content.pedidos.empty)}</h2>
               <p class="cm-empty__lead">${escape(content.pedidos.emptyLead)}</p>
               <p class="cm-empty__hint">${escape(content.pedidos.emptyHint)}</p>
               ${
                 publicado
                   ? ""
                   : `<button type="button" class="cm-btn" data-cm-tab="tienda">
                        <span>${escape(content.pedidos.goPublish)}</span>
                      </button>`
               }
             </div>`
          : `<ul class="cm-pedidos">${pedidos.map(pedidoHTML).join("")}</ul>`
      }
    </div>`;
}

function pedidoHTML(p) {
  const estado = p.estado || "nuevo";
  const etiqueta = content.pedidoEstados[estado] || estado;

  return `
    <li class="cm-pedido cm-pedido--${escape(estado)}">
      <div class="cm-pedido__top">
        <span class="cm-chip cm-pedido__estado">${escape(etiqueta)}</span>
        <span class="cm-pedido__total">${escape(
          precioTexto(p.total_centavos)
        )}</span>
      </div>
      <p class="cm-pedido__cliente">${escape(p.cliente || "")}</p>
      <p class="cm-pedido__lineas">${escape(String(p.lineas || 0))} artículos</p>
    </li>`;
}
