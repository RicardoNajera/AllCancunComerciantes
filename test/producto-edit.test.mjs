/**
 * All Cancún Comercios — Prueba del formulario de producto
 *
 * Verifica las dos caras del mismo formulario: alta vacía y edición
 * precargada. Si esto pasa, el precio se puede leer y reescribir sin
 * perder centavos ni romper el escapado.
 */

import { productoFormHTML } from "../features/panel/views-form-producto.js";
import { menuHTML } from "../features/panel/views-menu.js";

let pasa = 0;
let falla = 0;
const ok = (nombre, cond) => {
  if (cond) {
    pasa++;
    console.log("PASA   " + nombre);
  } else {
    falla++;
    console.log("FALLA  " + nombre);
  }
};

console.log("--- Alta: campos vacíos ---");
const alta = productoFormHTML();
ok("titulo Nuevo producto", alta.includes("Nuevo producto"));
ok("nombre vacio", /name="nombre"[^>]*value=""/.test(alta));
ok("precio vacio", /name="precio"[^>]*value=""/.test(alta));

console.log("\n--- Edición: campos precargados ---");
const edit = productoFormHTML({
  producto: { id: "p1", nombre: "Hilo", descripcion: null, precio_centavos: 3550 },
});
ok("titulo Editar producto", edit.includes("Editar producto"));
ok("nombre precargado", edit.includes('value="Hilo"'));
ok("centavos a pesos", edit.includes('value="35.50"'));
ok("descripcion null queda vacia", /name="descripcion"[^>]*value=""/.test(edit));
ok("largo maximo intacto", edit.includes('maxlength="60"'));

console.log("\n--- Edición: escapa todo ---");
const peligro = productoFormHTML({
  producto: { id: "p2", nombre: '<img onerror="x">', descripcion: '"><script>', precio_centavos: 100 },
});
ok("nombre escapado", !peligro.includes("<img"));
ok("descripcion escapada", !peligro.includes("<script>"));

console.log("\n--- Formulario de producto: foto ---");
const productoBase = { id: "p1", nombre: "Hilo", descripcion: null, precio_centavos: 3550 };
const formNuevo = productoFormHTML();
ok("boton de foto", formNuevo.includes("data-cm-prod-foto"));
ok("input de archivo", formNuevo.includes("data-cm-prod-foto-input"));
ok("sin foto no pinta img", !formNuevo.includes("<img"));
ok("invita a poner la foto", formNuevo.includes("cm-photo--picker"));

const formConFoto = productoFormHTML({
  producto: { ...productoBase, foto_url: "https://pub-abc.r2.dev/productos/n1/p1.webp" },
});
ok("con foto pinta img", formConFoto.includes("<img"));
ok("la foto va al bucket", formConFoto.includes("productos/n1/p1.webp"));
ok("con foto no invita", !formConFoto.includes("cm-photo--picker"));

const formInyectado = productoFormHTML({
  producto: { ...productoBase, foto_url: 'x" onerror="alert(1)' },
});
ok(
  "escapa la url del producto",
  formInyectado.includes("&quot;") && !formInyectado.includes('onerror="alert(1)"')
);

console.log("\n--- Menú: botones por producto ---");
const menu = menuHTML({
  productos: [{ id: "abc", nombre: "Jugo", precio_centavos: 3550, disponible: true }],
});
ok("boton editar", menu.includes('data-cm-edit="abc"'));
ok("boton borrar", menu.includes('data-cm-del="abc"'));
ok("editar accesible", menu.includes('aria-label="Editar producto"'));
ok("lapiz dibujado", menu.includes("M4 20h4l10-10"));

console.log("\n" + pasa + " PASA / " + falla + " FALLA");
process.exit(falla ? 1 : 0);
