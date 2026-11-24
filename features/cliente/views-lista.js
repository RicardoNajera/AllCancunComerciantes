/**
 * All Cancún Comercios — Vista: lista de comercios
 * Solo pinta. Los datos llegan ya consultados desde datos.js.
 */

import { escape } from "../shared/escape.js";
import { CATEGORIAS, categoriaLabel, fotoNegocio, img } from "./bits.js";

function tarjetaNegocio(n) {
  const foto = fotoNegocio(n);
  const cat = categoriaLabel(n.categoria);
  const inicial = (n.nombre || "·").charAt(0).toUpperCase();

  return `
    <a class="cl-negocio" href="#/negocio/${escape(n.slug || "")}">
      <div class="cl-negocio__media">
        ${img("cl-negocio__img", foto)}
        ${foto ? "" : `<span class="cl-negocio__inicial" aria-hidden="true">${escape(inicial)}</span>`}
      </div>
      <div class="cl-negocio__body">
        <h2 class="cl-negocio__name">${escape(n.nombre)}</h2>
        <p class="cl-negocio__meta">${cat ? escape(cat) : "Sin categoría"}${
          n.colonia ? ` · ${escape(n.colonia)}` : ""
        }</p>
      </div>
      <span class="cl-negocio__go" aria-hidden="true">›</span>
    </a>`;
}

export function listaHTML({ negocios = [], categoria = "" } = {}) {
  const filtros = `
    <nav class="cl-filtros" aria-label="Filtrar por categoría">
      <a class="cl-chip${categoria ? "" : " is-on"}" href="#/">Todos</a>
      ${CATEGORIAS.filter((c) => c.id !== "otro")
        .map(
          (c) => `<a class="cl-chip${categoria === c.id ? " is-on" : ""}"
            href="#/categoria/${escape(c.id)}">${escape(c.label)}</a>`
        )
        .join("")}
    </nav>`;

  const cuerpo = negocios.length
    ? `<ul class="cl-lista">${negocios
        .map((n) => `<li>${tarjetaNegocio(n)}</li>`)
        .join("")}</ul>`
    : `<div class="cl-vacio">
         <p class="cl-vacio__title">${
           categoria
             ? "Todavía no hay comercios en esta categoría"
             : "Todavía no hay comercios publicados"
         }</p>
         <p class="cl-vacio__lead">
           Los negocios aparecen aquí en cuanto publican su tienda.
         </p>
         ${categoria ? `<a class="cl-btn cl-btn--ghost" href="#/">Ver todos</a>` : ""}
       </div>`;

  return `
    <div class="cl-lista-wrap">
      ${filtros}
      ${
        negocios.length
          ? `<p class="cl-cuenta" role="status">${negocios.length} ${
              negocios.length === 1 ? "comercio" : "comercios"
            }</p>`
          : ""
      }
      ${cuerpo}
    </div>`;
}
