/**
 * All Cancún Comercios — Vista de Ajustes
 *
 * Jerarquía, de arriba a abajo:
 *   1. Identidad — quién eres, con qué tan completo está tu perfil.
 *   2. Datos del negocio — lo que ve el cliente. Edición como acción principal.
 *   3. Cuenta — acceso.
 *   4. Salir — aislado al final, nunca junto a lo útil.
 *
 * Cada fila muestra su estado (lleno o vacío) sin que haya que entrar
 * a comprobarlo. Lo que falta se ve como falta, no como error.
 */

import { escape } from "../shared/escape.js";
import { content, ico, CATEGORIAS } from "./content.js";
import { initial } from "./bits.js";

export function ajustesHTML({ negocio, nombreCuenta = "", email = "" }) {
  const nombre = String(negocio?.nombre || "").trim();

  /* Cuántos de los datos que ve el cliente ya están puestos.
     El horario no entra: no existe la columna en la base (negocios),
     así que contarlo dejaría el perfil incompleto para siempre. */
  const datos = [
    nombre,
    categoriaTexto(negocio?.categoria),
    negocio?.colonia,
    negocio?.whatsapp,
  ];
  const llenos = datos.filter((d) => String(d ?? "").trim()).length;
  const total = datos.length;
  const completo = llenos === total;
  const estadoTexto = completo ? content.ajustes.stateOk : content.ajustes.statePending;
  const estadoSub = `${llenos}/${total}`;

  return `
    <div class="cm-tab cm-tab--ajustes">

      <header class="aj-hero">
        <span class="aj-hero__avatar" aria-hidden="true">${escape(
          initial(nombreCuenta || nombre || "?")
        )}</span>
        <div class="aj-hero__text">
          <h1 class="aj-hero__name">${escape(nombre || content.ajustes.notSet)}</h1>
          <p class="aj-hero__sub">${escape(nombreCuenta || "Tu cuenta")}${
            email ? ` · ${escape(email)}` : ""
          }</p>
        </div>
        <span class="aj-hero__badge${completo ? " is-ok" : ""}" title="${escape(
          estadoTexto
        )}">
          <span class="aj-hero__dot" aria-hidden="true"></span>${escape(
            estadoTexto
          )}<span class="aj-hero__count">${escape(estadoSub)}</span>
        </span>
      </header>

      <section class="aj-group">
        <div class="aj-group__head">
          <h2 class="aj-group__title">${escape(content.ajustes.businessLabel)}</h2>
          <span class="aj-group__hint">${escape(estadoSub)}</span>
        </div>

        <div class="aj-card">
          ${filaAjuste({
            icono: ico.menu,
            label: content.fields.categoria.label,
            valor: categoriaTexto(negocio?.categoria),
            falta: content.ajustes.notSet,
            accion: "editar-negocio",
          })}
          ${filaAjuste({
            icono: ico.pin,
            label: content.fields.colonia.label,
            valor: negocio?.colonia,
            falta: content.tienda.locationEmpty,
            accion: "editar-negocio",
          })}
          ${filaAjuste({
            icono: ico.chat,
            label: content.fields.whatsapp.label,
            valor: negocio?.whatsapp,
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
        </div>

        <button type="button" class="cm-btn aj-edit" data-cm-editar-negocio>
          <span class="aj-edit__ico" aria-hidden="true">${ico.pencil}</span>
          ${escape(content.ajustes.editCta || content.edit)}
        </button>
      </section>

      <section class="aj-group">
        <div class="aj-group__head">
          <h2 class="aj-group__title">${escape(content.ajustes.accountLabel)}</h2>
        </div>

        <div class="aj-card">
          <div class="aj-row aj-row--static">
            <span class="aj-row__ico" aria-hidden="true">${ico.user}</span>
            <span class="aj-row__text">
              <span class="aj-row__title">${escape(nombreCuenta || "Tu cuenta")}</span>
              <span class="aj-row__value${email ? "" : " is-empty"}">${escape(
                email || "Sin correo vinculado"
              )}</span>
            </span>
          </div>
        </div>
      </section>

      <button type="button" class="aj-signout" data-cm-signout>
        <span class="aj-signout__ico" aria-hidden="true">${ico.logout}</span>
        <span data-cm-signout-label>${escape(content.signOut)}</span>
      </button>

      <p class="aj-foot">${escape(content.ajustes.version)}</p>

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
    <button type="button" class="aj-row" data-cm-${escape(accion)}>
      <span class="aj-row__ico" aria-hidden="true">${icono}</span>
      <span class="aj-row__text">
        <span class="aj-row__title">${escape(label)}</span>
        <span class="aj-row__value${tiene ? "" : " is-empty"}">${escape(
          tiene || falta
        )}</span>
      </span>
      <span class="aj-row__chev" aria-hidden="true">${ico.chevron}</span>
    </button>`;
}
