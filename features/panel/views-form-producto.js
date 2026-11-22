/**
 * All Cancún Comercios — Formulario de producto
 */

import { escape } from "../shared/escape.js";
import { content, ico } from "./content.js";

export function productoFormHTML({ producto = null } = {}) {
  const esEdicion = Boolean(producto);
  const v = (campo) => (producto ? escape(producto[campo] || "") : "");

  /* precio_centavos (3550) → "35.50" para que se pueda editar como texto */
  const precioTexto = producto
    ? (Number(producto.precio_centavos || 0) / 100).toFixed(2)
    : "";

  return `
    <form class="cm-form" data-cm-form-producto novalidate>
      <div class="cm-form__head">
        <button type="button" class="cm-form__back" data-cm-cancelar
          aria-label="${escape(content.back)}">${ico.arrowLeft}</button>
        <h2 class="cm-form__title">${escape(
          esEdicion ? content.productEditTitle : content.productFormTitle
        )}</h2>
      </div>

      <div class="cm-photo-field">
        <button type="button" class="cm-photo-btn cm-photo-btn--picker" data-cm-prod-foto
          aria-label="${escape(content.menu.photoLabel)}">
          ${
            producto && producto.foto_url
              ? `<div class="cm-photo cm-photo--square has-image">
                   <img class="cm-photo__img" src="${escape(producto.foto_url)}"
                     alt="${escape(content.menu.photoLabel)}" loading="lazy"
                     data-cm-foto-fallback="${escape(content.menu.photoLabel)}" />
                 </div>`
              : `<div class="cm-photo cm-photo--square cm-photo--picker" role="img"
                   aria-label="${escape(content.menu.photoLabel)}">
                   <span class="cm-photo__ico" aria-hidden="true">${ico.camera}</span>
                   <span class="cm-photo__label">${escape(content.menu.photoLabel)}</span>
                   <span class="cm-photo__hint">${escape(content.menu.photoHint)}</span>
                 </div>`
          }
        </button>
        <input type="file" accept="image/*" data-cm-prod-foto-input hidden />
      </div>

      <label class="cm-field">
        <span class="cm-field__label">${escape(
          content.productFields.nombre.label
        )}</span>
        <input class="cm-input" name="nombre" type="text" required maxlength="60"
          value="${v("nombre")}"
          placeholder="${escape(content.productFields.nombre.placeholder)}" />
        <span class="cm-field__hint">${escape(
          content.productFields.nombre.hint
        )}</span>
      </label>

      <label class="cm-field">
        <span class="cm-field__label">${escape(
          content.productFields.precio.label
        )}</span>
        <div class="cm-money">
          <span class="cm-money__sign" aria-hidden="true">$</span>
          <input class="cm-input cm-money__input" name="precio" type="text"
            inputmode="decimal" required value="${escape(precioTexto)}"
            placeholder="${escape(content.productFields.precio.placeholder)}" />
        </div>
        <span class="cm-field__hint">${escape(
          content.productFields.precio.hint
        )}</span>
      </label>

      <label class="cm-field">
        <span class="cm-field__label">${escape(
          content.productFields.descripcion.label
        )} <span class="cm-field__opt">${escape(content.optional)}</span></span>
        <input class="cm-input" name="descripcion" type="text" maxlength="120"
          value="${v("descripcion")}"
          placeholder="${escape(content.productFields.descripcion.placeholder)}" />
        <span class="cm-field__hint">${escape(
          content.productFields.descripcion.hint
        )}</span>
      </label>

      <p class="cm-msg" data-cm-msg role="alert" hidden></p>

      <button type="submit" class="cm-btn">
        <span>${escape(esEdicion ? content.save : content.productSave)}</span>
      </button>
    </form>`;
}
