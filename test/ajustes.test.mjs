/**
 * Vista de Ajustes — casos límite
 *
 * Lo importante: que no truene con negocio nulo, que escape todo lo que
 * viene de la base y que cada dato vacío se marque como vacío.
 */

import { ajustesHTML } from "../features/panel/views-ajustes.js";

let pasa = 0;
let falla = 0;
const ok = (n, c) => {
  if (c) {
    pasa++;
    console.log("PASA   " + n);
  } else {
    falla++;
    console.log("FALLA  " + n);
  }
};

console.log("--- Sin negocio: no truena ---");
let h;
let rompio = false;
try {
  h = ajustesHTML({ negocio: null, nombreCuenta: "", email: "" });
} catch (e) {
  rompio = true;
}
ok("no lanza excepcion", !rompio);
ok("pinta el heroe", h.includes("aj-hero"));
ok("muestra incompleto", h.includes("Incompleto"));

console.log("\n--- Negocio completo ---");
const full = ajustesHTML({
  negocio: {
    nombre: "Hilo y trapillo",
    categoria: "mujeres",
    colonia: "SM1",
    whatsapp: "6978633211",
  },
  nombreCuenta: "Anny Mena",
  email: "anny@example.com",
});
ok("badge completo", full.includes("Completo"));
ok("nombre visible", full.includes("Hilo y trapillo"));
ok("correo visible", full.includes("anny@example.com"));
ok("categoria traducida", full.includes("Belleza y moda"));
ok("whatsapp visible", full.includes("6978633211"));

console.log("\n--- Campos vacios marcados ---");
ok("horario vacio", full.includes("is-empty"));
ok("no queda sin marcar", (full.match(/aj-row__value is-empty/g) || []).length >= 1);

console.log("\n--- Escapado ---");
const peligro = ajustesHTML({
  negocio: { nombre: '<img src=x onerror="alert(1)">' },
  nombreCuenta: "<script>",
  email: '"><b>',
});
ok("nombre escapado", !peligro.includes("<img"));
ok("cuenta escapada", !peligro.includes("<script>"));
ok("correo escapado", !peligro.includes("<b>"));

console.log("\n--- Estructura ---");
ok("grupos presentes", (full.match(/aj-group"/g) || []).length === 2);
ok("accion editar", full.includes("data-cm-editar-negocio"));
ok("boton salir", full.includes("data-cm-signout"));
ok("etiqueta salir", full.includes("data-cm-signout-label"));

console.log("\n" + pasa + " PASA / " + falla + " FALLA");
process.exit(falla ? 1 : 0);
