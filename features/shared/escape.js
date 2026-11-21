/**
 * All Cancún Comercios — Escape de HTML
 *
 * Todo texto que venga de la base o del usuario pasa por aquí antes de
 * entrar al DOM. Un nombre de negocio con `<script>` no debe ejecutarse.
 */

const MAPA = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => MAPA[ch]);
