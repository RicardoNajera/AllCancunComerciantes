/**
 * All Cancún Comercios — Formularios
 * Alta y edición de negocio; alta de producto.
 */

import { escape } from "../shared/escape.js";
import { content, ico, CATEGORIAS } from "./content.js";

/* ==========================================================================
   Formulario: alta / edición de negocio
   ========================================================================== */

export function negocioFormHTML({ negocio = null } = {}) {
  const esEdicion = Boolean(negocio);
  const v = (campo) => (negocio ? escape(negocio[campo] || "") : "");

  return `
    <form class="cm-form" data-cm-form-negocio novalidate>
      <div class="cm-form__head">
        <button type="button" class="cm-form__back" data-cm-cancelar
          aria-label="${escape(content.back)}">${ico.arrowLeft}</button>
        <h2 class="cm-form__title">${escape(
          esEdicion ? content.tienda.editCta : content.formTitle
        )}</h2>
      </div>

      <label class="cm-field">
        <span class="cm-field__label">${escape(content.fields.nombre.label)}</span>
        <input class="cm-input" name="nombre" type="text" required maxlength="80"
          value="${v("nombre")}"
          placeholder="${escape(content.fields.nombre.placeholder)}"
          autocomplete="organization" />
        <span class="cm-field__hint">${escape(content.fields.nombre.hint)}</span>
      </label>

      <label class="cm-field">
        <span class="cm-field__label">${escape(
          content.fields.categoria.label
        )}</span>
        <select class="cm-input" name="categoria" required>
          <option value="">${escape(content.fields.categoria.placeholder)}</option>
          ${CATEGORIAS.map(
            (c) =>
              `<option value="${escape(c.id)}"${
                negocio && negocio.categoria === c.id ? " selected" : ""
              }>${escape(c.label)}</option>`
          ).join("")}
        </select>
        <span class="cm-field__hint">${escape(
          content.fields.categoria.hint
        )}</span>
      </label>

      <label class="cm-field">
        <span class="cm-field__label">${escape(content.fields.colonia.label)}</span>
        <input class="cm-input" name="colonia" type="text" maxlength="60"
          value="${v("colonia")}"
          placeholder="${escape(content.fields.colonia.placeholder)}" />
        <span class="cm-field__hint">${escape(content.fields.colonia.hint)}</span>
      </label>

      <label class="cm-field">
        <span class="cm-field__label">${escape(
          content.fields.whatsapp.label
        )}</span>
        <input class="cm-input" name="whatsapp" type="tel" inputmode="numeric"
          maxlength="10" value="${v("whatsapp")}"
          placeholder="${escape(content.fields.whatsapp.placeholder)}" />
        <span class="cm-field__hint">${escape(
          content.fields.whatsapp.hint
        )}</span>
      </label>

      <label class="cm-field">
        <span class="cm-field__label">${escape(
          content.fields.descripcion.label
        )}</span>
        <textarea class="cm-input cm-input--area" name="descripcion" rows="3"
          maxlength="280"
          placeholder="${escape(content.fields.descripcion.placeholder)}">${v(
            "descripcion"
          )}</textarea>
        <span class="cm-field__hint">${escape(
          content.fields.descripcion.hint
        )}</span>
      </label>

      <p class="cm-msg" data-cm-msg role="alert" hidden></p>

      <button type="submit" class="cm-btn">
        <span>${escape(esEdicion ? content.save : content.formSave)}</span>
      </button>
    </form>`;
}
