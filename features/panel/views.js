/**
 * All Cancún Comercios — Plantillas HTML
 * Solo pintan. Los datos llegan ya validados desde shared/negocio.js.
 *
 * REGLA: si un dato no existe, NO se rellena con un ejemplo.
 * Se dibuja el espacio vacío con el texto de qué falta.
 */

import { escape } from "../shared/escape.js";
import { subidaConfigurada } from "../shared/fotos.js";
import { content, ico, CATEGORIAS, TABS } from "./content.js";
import {
  googleLogo,
  initial,
  categoriaLabel,
  categoriaAccent,
  estadoLabel,
  estadoHint,
  estadoTone,
  photoSlot,
  productsCount,
  oFalta,
  precioTexto,
} from "./bits.js";

/* ==========================================================================
   Login
   ========================================================================== */

export function loginHTML() {
  return `
    <div class="cm-login">
      <span class="cm-login__mark" aria-hidden="true">${ico.store}</span>
      <h1 class="cm-login__title">${escape(content.loginTitle)}</h1>
      <p class="cm-login__lead">${escape(content.loginLead)}</p>
      <button type="button" class="cm-btn cm-btn--google" data-cm-login>
        ${googleLogo()}<span>${escape(content.loginButton)}</span>
      </button>
      <p class="cm-login__legal">${escape(content.loginLegal)}</p>
      <p class="cm-msg" data-cm-msg role="alert" hidden></p>
    </div>`;
}

/* ==========================================================================
   Transición de carga
   Cristal inmersivo: una tarjeta de vidrio sobre el fondo de la app,
   con el logo de la marca dentro. Sin texto visible — el aviso de que
   está cargando solo existe para lectores de pantalla.
   `data-cm-boot` lo usa index.js para disolverlo cuando ya hay datos.
   ========================================================================== */

export function loadingHTML() {
  return `
    <div class="cm-boot" data-cm-boot role="status" aria-live="polite" aria-label="${escape(
      content.loading
    )}">
      <span class="cm-boot__glass" aria-hidden="true">
        <span class="cm-boot__mark">${ico.store}</span>
      </span>
    </div>`;
}

/* ==========================================================================
   Cabecera de cada pestaña
   ========================================================================== */

/** Cabecera: menú + título + estado del negocio. La píldora vive aquí
 *  (solo en Tienda) para saber en un vistazo si está publicado. */
export function topbarHTML({ titulo, subtitulo = "", accion = "", estado = "" }) {
  return `
    <button type="button" class="cm-menu-btn" data-cm-menu-open
      aria-label="${escape(content.menuButton)}"
      aria-expanded="false" aria-controls="app-drawer">${ico.burger}</button>
    <div class="cm-topbar__text">
      <h1 class="cm-topbar__title">${escape(titulo)}</h1>
      ${subtitulo ? `<p class="cm-topbar__sub">${escape(subtitulo)}</p>` : ""}
    </div>
    ${
      estado
        ? `<span class="cm-status cm-status--${estadoTone(estado)}" title="${escape(
            content.statusStateLabel
          )}">${escape(estadoLabel(estado))}</span>`
        : ""
    }
    ${accion}`;
}

/* ==========================================================================
   Menú lateral: la única navegación del panel, con nombre y foto
   ========================================================================== */

export function drawerHTML({ activa, nombre = "", sub = "" }) {
  return `
    <nav class="cm-drawer" id="app-drawer" data-cm-drawer
      aria-label="${escape(content.menuTitle)}" aria-hidden="true">
      <div class="cm-drawer__head">
        <span class="cm-drawer__avatar" aria-hidden="true">${escape(initial(nombre))}</span>
        <div class="cm-drawer__who">
          <p class="cm-drawer__name">${escape(nombre)}</p>
          ${sub ? `<p class="cm-drawer__sub">${escape(sub)}</p>` : ""}
        </div>
      </div>

      <div class="cm-drawer__nav">
        ${TABS.map((t) => {
          const isActive = t.id === activa;
          return `<button type="button" class="cm-drawer__item${
            isActive ? " is-active" : ""
          }" data-cm-tab="${escape(t.id)}"
            aria-current="${isActive ? "page" : "false"}">
            ${ico[t.icon]}<span>${escape(content.tabs[t.id])}</span>
          </button>`;
        }).join("")}
      </div>

      <div class="cm-drawer__foot">
        <button type="button" class="cm-drawer__item" data-cm-menu-close>
          ${ico.close}<span>${escape(content.menuClose)}</span>
        </button>
      </div>
    </nav>`;
}

/* ==========================================================================
   Estado vacío genérico
   ========================================================================== */

export function emptyHTML({ icono, titulo, lead, hint = "", cta = "", accion = "" }) {
  return `
    <div class="cm-empty">
      <span class="cm-empty__ico" aria-hidden="true">${icono}</span>
      <h2 class="cm-empty__title">${escape(titulo)}</h2>
      <p class="cm-empty__lead">${escape(lead)}</p>
      ${hint ? `<p class="cm-empty__hint">${escape(hint)}</p>` : ""}
      ${
        cta && accion
          ? `<button type="button" class="cm-btn" ${accion}>
               ${ico.plus}<span>${escape(cta)}</span>
             </button>`
          : ""
      }
    </div>`;
}

/* ==========================================================================
   Sin negocio: alta
   ========================================================================== */

export function sinNegocioHTML() {
  return `
    <div class="cm-onboard">
      <p class="cm-onboard__eyebrow">${escape(content.emptyEyebrow)}</p>
      <h2 class="cm-onboard__title">${escape(content.emptyTitle)}</h2>
      <p class="cm-onboard__lead">${escape(content.emptyLead)}</p>

      <div class="cm-onboard__preview">
        ${photoSlot({ label: content.tienda.coverLabel, variant: "cover" })}
      </div>

      <button type="button" class="cm-btn" data-cm-nuevo-negocio>
        ${ico.plus}<span>${escape(content.emptyCta)}</span>
      </button>
    </div>`;
}

/* ==========================================================================
   Pestaña: Tienda
   Portada del negocio: foto, logo, datos, y la tarjeta como la ve el cliente.
   ========================================================================== */

export function tiendaHTML({ negocio }) {
  const categoria = categoriaLabel(negocio.categoria);
  const accent = categoriaAccent(negocio.categoria);
  const publicado = negocio.estado === "activo";

  /* La foto se pinta si la columna trae URL. Si está vacía, el recuadro
     punteado ya comunica que falta; no hace falta un <img> roto. */
  const portada = String(negocio.foto_url || "").trim();
  const logo = String(negocio.logo_url || "").trim();
  const puedeSubir = subidaConfigurada();

  return `
    <div class="cm-tab cm-tab--tienda">

      <section class="cm-cover-block">
        <button type="button" class="cm-photo-btn" data-cm-foto="portada"
          ${puedeSubir ? "" : "disabled"}
          aria-label="${escape(content.tienda.coverLabel)}">
          ${photoSlot({
            label: content.tienda.coverLabel,
            hint: content.tienda.coverHint,
            variant: "cover",
            hasImage: Boolean(portada),
            src: portada,
          })}
        </button>
        <div class="cm-logo-wrap">
          <button type="button" class="cm-photo-btn cm-photo-btn--logo" data-cm-foto="logo"
            ${puedeSubir ? "" : "disabled"}
            aria-label="${escape(content.tienda.logoLabel)}">
            ${photoSlot({
              label: content.tienda.logoLabel,
              variant: "logo",
              hasImage: Boolean(logo),
              src: logo,
            })}
          </button>
        </div>
      </section>

      <input type="file" accept="image/*" data-cm-foto-input hidden />

      <p class="cm-msg" data-cm-msg role="status" hidden></p>

      <section class="cm-card">
        <div class="cm-card__head">
          <div class="cm-card__title-wrap">
            <h2 class="cm-card__title">${escape(negocio.nombre)}</h2>
            ${
              categoria
                ? `<span class="cm-chip cm-chip--${escape(accent)}">${escape(
                    categoria
                  )}</span>`
                : `<span class="cm-chip cm-chip--hogar">Sin categoría</span>`
            }
          </div>
        </div>

        ${
          /* El estado siempre visible, también cuando ya está publicado:
             antes el aviso desaparecía y no quedaba rastro del estado. */
          `<div class="cm-notice cm-notice--${estadoTone(negocio.estado)}" role="status">
             ${escape(estadoHint(negocio.estado))}
           </div>`
        }

        <dl class="cm-data">
          <div class="cm-data__row">
            <dt class="cm-data__key">${ico.pin}<span>${escape(
              content.tienda.locationLabel
            )}</span></dt>
            <dd class="cm-data__val">${oFalta(
              negocio.colonia,
              content.tienda.locationEmpty
            )}</dd>
          </div>
          <div class="cm-data__row">
            <dt class="cm-data__key">${ico.chat}<span>${escape(
              content.tienda.contactLabel
            )}</span></dt>
            <dd class="cm-data__val">${oFalta(
              negocio.whatsapp,
              content.tienda.contactEmpty
            )}</dd>
          </div>
          <div class="cm-data__row">
            <dt class="cm-data__key">${ico.clock}<span>${escape(
              content.tienda.hoursLabel
            )}</span></dt>
            <dd class="cm-data__val"><span class="cm-muted">${escape(
              content.tienda.hoursEmpty
            )}</span></dd>
          </div>
        </dl>
      </section>

      <section class="cm-card">
        <h3 class="cm-card__label">${escape(content.tienda.aboutLabel)}</h3>
        <p class="cm-body">${
          negocio.descripcion
            ? escape(negocio.descripcion)
            : `<span class="cm-muted">${escape(content.tienda.aboutEmpty)}</span>`
        }</p>
      </section>

      <section class="cm-preview">
        <p class="cm-preview__label">${escape(content.tienda.summaryTitle)}</p>
        ${tarjetaClienteHTML(negocio)}
        <p class="cm-preview__hint">${escape(content.tienda.summaryHint)}</p>
      </section>

      ${
        publicado
          ? `<div class="cm-done">${ico.check}<span>${escape(
              content.publishDone
            )}</span></div>`
          : `<button type="button" class="cm-btn cm-btn--publish" data-cm-publicar>
               <span>${escape(content.publishCta)}</span>
             </button>`
      }

      <button type="button" class="cm-btn cm-btn--ghost" data-cm-editar-negocio>
        <span>${escape(content.tienda.editCta)}</span>
      </button>

      <p class="cm-msg" data-cm-msg role="status" hidden></p>
    </div>`;
}

/** La tarjeta tal como se ve en la app del cliente (sin datos inventados) */
export function tarjetaClienteHTML(negocio) {
  const accent = categoriaAccent(negocio.categoria);
  const categoria = categoriaLabel(negocio.categoria);
  return `
    <article class="cm-tarjeta cm-tarjeta--${escape(accent)}">
      <div class="cm-tarjeta__media">
        ${photoSlot({ label: "", variant: "thumb" })}
      </div>
      <div class="cm-tarjeta__body">
        <h4 class="cm-tarjeta__name">${escape(negocio.nombre)}</h4>
        <p class="cm-tarjeta__meta">${
          categoria
            ? escape(categoria)
            : `<span class="cm-muted">Sin categoría</span>`
        }${negocio.colonia ? ` · ${escape(negocio.colonia)}` : ""}</p>
        <p class="cm-tarjeta__rate cm-muted">Sin reseñas todavía</p>
      </div>
    </article>`;
}

