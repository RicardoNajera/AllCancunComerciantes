/**
 * All Cancún Comercios — Piezas base del catálogo público
 *
 * Lo que necesitan todas las vistas del cliente: categorías, precio,
 * foto. Funciones puras, sin red, para poder probarlas de una.
 */

import { escape } from "../shared/escape.js";

/* El mismo catálogo del panel, repetido a propósito: el cliente no debe
   cargar medio panel solo para saber que "comida" se llama "Comida y
   bebidas". Si se desincronizan, se nota en la etiqueta, no en la app. */
export const CATEGORIAS = [
  { id: "comida", label: "Comida y bebidas" },
  { id: "comercios", label: "Tienda / abarrotes" },
  { id: "salud", label: "Salud" },
  { id: "mantenimiento", label: "Mantenimiento" },
  { id: "tianguis", label: "Tianguis" },
  { id: "mujeres", label: "Belleza y moda" },
  { id: "hombres", label: "Barbería y moda" },
  { id: "estudiantes", label: "Estudiantes" },
  { id: "otro", label: "Otro" },
];

export const categoriaLabel = (id) =>
  CATEGORIAS.find((c) => c.id === id)?.label || "";

/** $35.00 → "$35" · 3550 → "$35.50" · null → "" (sin precio inventado) */
export function precioTexto(centavos) {
  if (centavos === null || centavos === undefined || centavos === "") return "";
  const n = Number(centavos);
  if (!Number.isFinite(n) || n < 0) return "";
  const pesos = Math.floor(n / 100);
  const cents = n % 100;
  const miles = pesos.toLocaleString("es-MX");
  return cents === 0 ? `$${miles}` : `$${miles}.${String(cents).padStart(2, "0")}`;
}

/** La foto de una tarjeta: logo primero, luego portada. "" si no hay. */
export function fotoNegocio(negocio) {
  return String(negocio?.logo_url || negocio?.foto_url || "").trim();
}

/** ¿Este negocio se puede contactar? Sin número, no hay botón. */
export function tieneWhatsApp(negocio) {
  return Boolean(String(negocio?.whatsapp || "").replace(/\D/g, ""));
}

/**
 * Imagen con respaldo: si la URL falla, el hueco se queda limpio en vez
 * de mostrar el ícono roto del navegador. Un catálogo con imágenes rotas
 * se ve abandonado y espanta al cliente.
 */
export function img(className, url, { alt = "" } = {}) {
  const limpia = String(url || "").trim();
  if (!limpia) return "";
  return `<img class="${escape(className)}" src="${escape(limpia)}" alt="${escape(
    alt
  )}" loading="lazy" decoding="async" data-cl-img />`;
}
