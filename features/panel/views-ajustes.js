/**
 * All Cancún Comercios — Vista de Ajustes
 */

import { escape } from "../shared/escape.js";
import { content, ico, CATEGORIAS } from "./content.js";
import { initial } from "./bits.js";

export function ajustesHTML({ negocio, nombreCuenta = "", email = "" }) {
  return `
    <div class="cm-tab cm-tab--ajustes">

      <section class="cm-list-card">
        <p class="cm-list-card__label">${escape(content.ajustes.businessLabel)}</p>
        ${filaAjuste({
          icono: ico.store,
          label: "Nombre del negocio",
          valor: negocio.nombre,
          falta: content.ajustes.notSet,
          accion: "editar-negocio",
        })}
        ${filaAjuste({
          icono: ico.menu,
          label: content.fields.categoria.label,
          valor: categoriaTexto(negocio.categoria),
          falta: content.ajustes.notSet,
          accion: "editar-negocio",
        })}
        ${filaAjuste({
          icono: ico.pin,
          label: content.fields.colonia.label,
          valor: negocio.colonia,
          falta: content.tienda.locationEmpty,
          accion: "editar-negocio",
        })}
      </section>

      <section class="cm-list-card">
        <p class="cm-list-card__label">${escape(content.ajustes.contactLabel)}</p>
        ${filaAjuste({
          icono: ico.chat,
          label: content.fields.whatsapp.label,
          valor: negocio.whatsapp,
          falta: content.tienda.contactEmpty,
          accion: "editar-negocio",
        })}
        ${filaAjuste({
          icono: ico.clock,
          label: content.tienda.hoursLabel,
          valor: "",
          falta: content.tienda.hoursEmpty,
          accion: "editar-negocio",
        })}
      </section>

      <section class="cm-list-card">
        <p class="cm-list-card__label">${escape(content.ajustes.accountLabel)}</p>
        <div class="cm-account">
          <span class="cm-account__avatar" aria-hidden="true">${escape(
            initial(nombreCuenta)
          )}</span>
          <div class="cm-account__text">
            <p class="cm-account__name">${escape(nombreCuenta || "Tu cuenta")}</p>
            <p class="cm-account__mail${email ? "" : " cm-muted"}">${escape(
              email || "Sin correo"
            )}</p>
          </div>
        </div>
        <button type="button" class="cm-row cm-row--danger" data-cm-signout>
          <span class="cm-row__ico" aria-hidden="true">${ico.logout}</span>
          <span class="cm-row__label" data-cm-signout-label>${escape(
            content.signOut
          )}</span>
          <span class="cm-row__chev" aria-hidden="true">${ico.chevron}</span>
        </button>
      </section>

      <p class="cm-msg" data-cm-msg role="status" hidden></p>
    </div>`;
}

function categoriaTexto(id) {
  const found = CATEGORIAS.find((c) => c.id === id);
  return found ? found.label : "";
}

function filaAjuste({ icono, label, valor, falta, accion }) {
  const tiene = String(valor ?? "").trim();
  return `
    <button type="button" class="cm-row" data-cm-${escape(accion)}>
      <span class="cm-row__ico" aria-hidden="true">${icono}</span>
      <span class="cm-row__text">
        <span class="cm-row__title">${escape(label)}</span>
        <span class="cm-row__value${tiene ? "" : " cm-muted"}">${escape(
          tiene || falta
        )}</span>
      </span>
      <span class="cm-row__chev" aria-hidden="true">${ico.chevron}</span>
    </button>`;
}
