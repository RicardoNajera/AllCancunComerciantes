/**
 * Verifica que el CSS del panel no tenga bloques roto.
 *
 * Un `{` sin su `}` no es un error visible: el navegador se come todo lo
 * que viene después hasta que las llaves cuadran. Así desapareció entera
 * la navegación — el menú lateral se pintaba suelto al final del flujo.
 * Las llaves "cuadran igual" en el total, así que contar { y } no lo
 * detecta: hay que mirar bloque a bloque.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, "..");

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

const hojas = ["tokens.css", "base.css", "panel.css"];

/** Devuelve los selectores de primer nivel que se abren en el CSS. */
function selectores(css) {
  const out = [];
  let i = 0;
  let hondo = 0;
  let inicio = 0;
  const n = css.length;
  while (i < n) {
    if (css.startsWith("/*", i)) {
      const fin = css.indexOf("*/", i + 2);
      i = fin < 0 ? n : fin + 2;
      continue;
    }
    const c = css[i];
    if (c === "{") {
      if (hondo === 0) {
        const trozo = css.slice(inicio, i).trim();
        const ultima = trozo.split("\n").pop().trim();
        out.push({ sel: ultima, pos: i });
      }
      hondo++;
    } else if (c === "}") {
      hondo--;
      if (hondo === 0) inicio = i + 1;
    }
    i++;
  }
  return { lista: out, hondo };
}

/** Revisa que cada bloque tenga sus propiedades bien terminadas. */
function bloquesSanos(css) {
  const malos = [];
  let i = 0;
  const n = css.length;
  let hondo = 0;
  let abre = -1;
  let inicioCuerpo = -1;
  while (i < n) {
    if (css.startsWith("/*", i)) {
      const f = css.indexOf("*/", i + 2);
      i = f < 0 ? n : f + 2;
      continue;
    }
    const c = css[i];
    if (c === "{") {
      if (hondo === 0) abre = i;
      hondo++;
    } else if (c === "}") {
      hondo--;
      if (hondo === 0 && abre >= 0) {
        const cuerpo = css.slice(abre + 1, i);
        const cabecera = css.slice(inicioCuerpo >= 0 ? inicioCuerpo : 0, abre);
        // Un bloque de propiedades debe contener "algo: algo;"
        const declara = /[\w-]+\s*:/.test(cuerpo);
        // Y debe cerrar su última declaración con ;
        const limpio = cuerpo.replace(/\/\*[\s\S]*?\*\//g, "").trim();
        const cierra = limpio === "" || limpio.endsWith(";") || limpio.endsWith("}");
        if (declara && !cierra) {
          malos.push({ linea: css.slice(0, abre).split("\n").length, sel: cabecera.trim().split("\n").pop() });
        }
        inicioCuerpo = i + 1;
        abre = -1;
      }
    }
    i++;
  }
  return malos;
}

for (const nombre of hojas) {
  const css = readFileSync(join(raiz, "styles", nombre), "utf8");
  const { hondo } = selectores(css);
  ok(nombre + ": las llaves cuadran", hondo === 0);

  const malos = bloquesSanos(css);
  ok(
    nombre + ": sin bloques sin cerrar" + (malos.length ? " → " + JSON.stringify(malos.slice(0, 3)) : ""),
    malos.length === 0
  );
}

/* Las reglas de navegación tienen que existir de verdad */
const panel = readFileSync(join(raiz, "styles", "panel.css"), "utf8");
const { lista } = selectores(panel);
const seles = lista.map((x) => x.sel.replace(/\s+/g, ""));

for (const s of [".cm-drawer", ".cm-overlay", ".cm-menu-btn"]) {
  ok("existe la regla " + s, seles.some((x) => x === s || x.startsWith(s + ",") || x.endsWith("," + s)));
}

/* La barra inferior se retiró: solo queda el menú de la esquina */
for (const s of [".app-dock", ".dock-tab"]) {
  ok("ya no existe la regla " + s, !seles.some((x) => x === s || x.startsWith(s + ",") || x.startsWith(s + " ") || x.startsWith(s + ".") || x.startsWith(s + ":")));
}

/* El menú debe ser capa superpuesta, nunca parte del flujo */
const bloqueDrawer = panel.slice(
  panel.indexOf(".cm-overlay,\n.cm-drawer {"),
  panel.indexOf(".cm-drawer__head")
);
ok("el drawer y su velo son position: absolute", /position:\s*absolute/.test(bloqueDrawer));
ok("el drawer NO es position: static", !/position:\s*static/.test(bloqueDrawer));
ok("el drawer va por encima de la dock", /z-index:\s*50/.test(bloqueDrawer));

/* El splash de cristal debe seguir entero */
ok("existe la tarjeta de cristal", panel.includes(".cm-boot__glass"));
ok("el cristal usa backdrop-filter", /backdrop-filter:\s*blur/.test(panel));

/* Interruptor abierto/cerrado de la cabecera. Compacto, pero con la
   etiqueta siempre visible: si se corta el texto no se entiende. */
ok("existe el interruptor de cabecera", panel.includes(".cm-switch--top"));
ok(
  "el interruptor no parte la etiqueta",
  /\.cm-switch--top \.cm-switch__label \{[^}]*white-space:\s*nowrap/.test(panel)
);
ok(
  "el interruptor respeta reduced-motion",
  /prefers-reduced-motion[\s\S]{0,500}cm-switch--top/.test(panel)
);

console.log(`\n${pasa} PASA / ${falla} FALLA`);
if (falla > 0) process.exit(1);
