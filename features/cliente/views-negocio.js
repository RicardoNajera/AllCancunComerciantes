/**
 * All Cancún Comercios — Vista: el menú de un negocio
 * Solo pinta. Los datos llegan ya consultados desde datos.js.
 */

import { escape } from "../shared/escape.js";
import { categoriaLabel, precioTexto, tieneWhatsApp, img } from "./bits.js";

function productoFila(p, negocio) {
  const precio = precioTexto(p.precio_centavos);
  const hay = p.disponible !== false;
  const foto = String(p.foto_url || "").trim();

  return `
    <li class="cl-prod${hay ? "" : " is-off"}" data-cl-prod="${escape(p.id)}">
      ${foto ? `<div class="cl-prod__media">${img("cl-prod__img", foto)}</div>` : ""}
      <div class="cl-prod__body">
        <h3 class="cl-prod__name">${escape(p.nombre)}</h3>
        ${p.descripcion ? `<p class="cl-prod__desc">${escape(p.descripcion)}</p>` : ""}
        <p class="cl-prod__pie">
          ${precio ? `<span class="cl-prod__precio">${escape(precio)}</span>` : ""}
          ${hay ? "" : `<span class="cl-prod__agotado">Agotado hoy</span>`}
        </p>
      </div>
      ${
        hay && tieneWhatsApp(negocio)
          ? `<button type="button" class="cl-btn cl-btn--sm" data-cl-pedir
               data-cl-prod-nombre="${escape(p.nombre)}">Pedir</button>`
          : ""
      }
    </li>`;
}

export function negocioHTML({ negocio, productos = [] }) {
  const n = negocio || {};
  const portada = String(n.foto_url || "").trim();
  const logo = String(n.logo_url || "").trim();
  const cat = categoriaLabel(n.categoria);
  const hayWhats = tieneWhatsApp(n);

  const disponibles = productos.filter((p) => p.disponible !== false);
  const agotados = productos.filter((p) => p.disponible === false);

  const menu = productos.length
    ? `${
        disponibles.length
          ? `<ul class="cl-prods">${disponibles
              .map((p) => productoFila(p, n))
              .join("")}</ul>`
          : ""
      }
      ${
        agotados.length
          ? `<h2 class="cl-seccion">Hoy no hay</h2>
             <ul class="cl-prods">${agotados
               .map((p) => productoFila(p, null))
               .join("")}</ul>`
          : ""
      }`
    : `<div class="cl-vacio">
         <p class="cl-vacio__title">Este negocio aún no publica su menú</p>
         <p class="cl-vacio__lead">${
           hayWhats
             ? "Escríbele por WhatsApp y pregúntale qué tiene hoy."
             : "Vuelve más tarde: está preparando su catálogo."
         }</p>
       </div>`;

  return `
    <article class="cl-ficha">
      <div class="cl-hero">
        ${
          portada
            ? img("cl-hero__img", portada)
            : `<div class="cl-hero__vacio" aria-hidden="true"></div>`
        }
        <a class="cl-hero__volver" href="#/" aria-label="Volver a la lista">‹</a>
      </div>

      <header class="cl-cabecera">
        ${logo ? img("cl-cabecera__logo", logo) : ""}
        <h1 class="cl-cabecera__name">${escape(n.nombre)}</h1>
        <p class="cl-cabecera__meta">${cat ? escape(cat) : "Sin categoría"}${
          n.colonia ? ` · ${escape(n.colonia)}` : ""
        }</p>
        ${n.descripcion ? `<p class="cl-cabecera__desc">${escape(n.descripcion)}</p>` : ""}
        ${
          hayWhats
            ? `<button type="button" class="cl-btn cl-btn--wa" data-cl-pedir>
                 Escribir por WhatsApp
               </button>`
            : `<p class="cl-cabecera__sin-wa">Este negocio no tiene WhatsApp registrado.</p>`
        }
      </header>

      <section class="cl-menu" aria-label="Menú">${menu}</section>
    </article>`;
}
