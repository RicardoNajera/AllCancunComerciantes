/**
 * All Cancún Comercios — Panel
 *
 * Cuatro pestañas, una sola app:
 *   Tienda   → tu negocio, su foto, sus datos, publicar
 *   Menú     → tus productos
 *   Pedidos  → lo que te compran
 *   Ajustes  → tu cuenta y tus datos
 *
 * La app no decide nada por sí sola: la base dice quién vende y qué
 * tienda es suya. Si alguien intenta tocar el negocio de otro, RLS lo
 * rechaza.
 */

import { content, ico } from "./content.js";
import { escape } from "../shared/escape.js";
import { signInWithProvider, signOut, getProfile } from "../shared/supabase.js";
import { comprimirImagen, pesoTexto } from "../shared/imagen.js";
import { rutaFoto, subirFoto, borrarFoto, rutaDesdeUrl } from "../shared/fotos.js";
import {
  getMiNegocio,
  crearNegocio,
  actualizarNegocio,
  publicarNegocio,
  getProductos,
  crearProducto,
  actualizarProducto,
  alternarDisponible,
  borrarProducto,
  guardarFotoNegocio,
  guardarFotoProducto,
} from "../shared/negocio.js";

import {
  loginHTML,
  loadingHTML,
  drawerHTML,
  topbarHTML,
  sinNegocioHTML,
  tiendaHTML,
} from "./views.js";
import { menuHTML, pedidosHTML } from "./views-menu.js";
import { ajustesHTML } from "./views-ajustes.js";
import { negocioFormHTML } from "./views-form-negocio.js";
import { productoFormHTML } from "./views-form-producto.js";

/** Monta el panel. Devuelve la función de limpieza. */
export async function mountPanel(root, { session, onSignedOut, topbar } = {}) {
  if (!root) return () => {};

  let cleanup = [];
  let tab = "tienda";

  const reset = () => {
    cleanup.forEach((fn) => fn());
    cleanup = [];
  };

  const on = (node, event, handler) => {
    if (!node) return;
    node.addEventListener(event, handler);
    cleanup.push(() => node.removeEventListener(event, handler));
  };

  const hideChrome = () => {
    if (topbar) {
      topbar.hidden = true;
      topbar.innerHTML = "";
    }
    closeMenu();
  };

  /* ---------- Menú lateral ----------
     El menú se CREA al abrirlo y se DESTRUYE al cerrarlo. No queda
     ningún nodo en el DOM mientras está cerrado, así que no hay forma
     de que su texto aparezca en la página si el CSS no carga o si el
     navegador tiene una versión vieja en caché. El estado vive en
     `menuAbierto`, no en el DOM. */
  const menuLayer = () => (root.parentElement || document.body);
  let menuAbierto = false;
  let limpiarMenu = [];

  function desmontarMenu() {
    limpiarMenu.forEach((fn) => fn());
    limpiarMenu = [];
    const layer = menuLayer();
    const drawer = layer.querySelector("[data-cm-drawer]");
    const overlay = layer.querySelector("[data-cm-overlay]");
    if (drawer) drawer.remove();
    if (overlay) overlay.remove();
    menuAbierto = false;
  }

  function montarMenu(nombre, sub) {
    desmontarMenu();
    const layer = menuLayer();

    const overlay = document.createElement("div");
    overlay.className = "cm-overlay is-open";
    overlay.setAttribute("data-cm-overlay", "");

    layer.insertAdjacentHTML("beforeend", drawerHTML({ activa: tab, nombre, sub }));
    layer.appendChild(overlay);

    const drawer = layer.querySelector("[data-cm-drawer]");
    if (drawer) {
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-modal", "true");
    }

    const cerrar = () => setMenu(false);
    overlay.addEventListener("click", cerrar);

    if (drawer) {
      drawer.querySelectorAll("[data-cm-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.dataset.cmTab === tab) {
            setMenu(false);
            return;
          }
          tab = btn.dataset.cmTab;
          render();
        });
      });

      drawer.querySelectorAll("[data-cm-menu-close]").forEach((btn) => {
        btn.addEventListener("click", cerrar);
      });

      /* Al abrir, el foco entra en el menú: navegable con teclado */
      const primero = drawer.querySelector("[data-cm-tab].is-active") || drawer.querySelector("[data-cm-tab]");
      if (primero && typeof primero.focus === "function") primero.focus();
    }

    limpiarMenu.push(() => overlay.removeEventListener("click", cerrar));
    menuAbierto = true;
  }

  function setMenu(open, nombre = "", sub = "") {
    if (open === menuAbierto) return;
    if (open) {
      montarMenu(nombre, sub);
    } else {
      desmontarMenu();
    }
    if (topbar) {
      const trigger = topbar.querySelector("[data-cm-menu-open]");
      if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }
  }

  function closeMenu() {
    desmontarMenu();
  }

  function onMenuKey(ev) {
    if (ev.key === "Escape" && menuAbierto) setMenu(false);
  }

  /* ---------- Sin sesión: login ---------- */
  if (!session) {
    hideChrome();
    root.innerHTML = loginHTML();
    const loginBtn = root.querySelector("[data-cm-login]");

    on(loginBtn, "click", async () => {
      loginBtn.setAttribute("disabled", "true");
      const { error } = await signInWithProvider("google");
      if (error) {
        showMsg(root, error);
        loginBtn.removeAttribute("disabled");
      }
    });

    return reset;
  }

  /* Esc cierra el menú. Se registra una sola vez por montaje. */
  document.addEventListener("keydown", onMenuKey);
  cleanup.push(() => document.removeEventListener("keydown", onMenuKey));

  /* ---------- Con sesión ---------- */
  const userId = session.user?.id;
  const nombreCuenta =
    session.user?.user_metadata?.full_name ||
    session.user?.user_metadata?.name ||
    "";
  const email = session.user?.email || "";

  async function render() {
    reset();
    hideChrome();
    /* Cada cambio de pestaña abre arriba, no a media página */
    root.scrollTop = 0;
    root.innerHTML = loadingHTML();

    const [{ profile }, { negocio }] = await Promise.all([
      getProfile(userId),
      getMiNegocio(userId),
    ]);

    /* Sin negocio: solo una cosa que hacer */
    if (!negocio) {
      await salirDelSplash();
      root.innerHTML = sinNegocioHTML();
      on(root.querySelector("[data-cm-nuevo-negocio]"), "click", () =>
        openFormNegocio(null)
      );
      return;
    }

    /* Con negocio: cabecera + pestaña + barra inferior */
    const productos =
      tab === "menu" ? (await getProductos(negocio.id)).productos : [];
    const perfil = profile;

    await salirDelSplash();
    paintTopbar(negocio);
    closeMenu();
    paintTab(negocio, productos, perfil);
  }

  /* Funde la transición de carga antes de mostrar contenido. Si el sistema
     pide menos movimiento, no espera: cambia de golpe. */
  function salirDelSplash() {
    const boot = root.querySelector("[data-cm-boot]");
    if (!boot) return Promise.resolve();

    const sinMovimiento =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sinMovimiento) return Promise.resolve();

    boot.classList.add("is-done");
    return new Promise((listo) => {
      let hecho = false;

      /* Solo cuenta la animación del splash, no la del logo o el halo */
      const alTerminar = (ev) => {
        if (ev.target === boot && ev.animationName === "cm-boot-out") terminar();
      };

      const terminar = () => {
        if (hecho) return;
        hecho = true;
        boot.removeEventListener("animationend", alTerminar);
        listo();
      };

      boot.addEventListener("animationend", alTerminar);
      /* Si la animación no llega (pestaña en segundo plano), no bloquea */
      setTimeout(terminar, 400);
    });
  }

  /* ---------- Cabecera ---------- */
  function paintTopbar(negocio) {
    if (!topbar) return;
    topbar.hidden = false;

    const titulos = {
      tienda: content.tienda.title,
      menu: content.menu.title,
      pedidos: content.pedidos.title,
      ajustes: content.ajustes.title,
    };

    topbar.innerHTML = topbarHTML({
      titulo: titulos[tab] || content.tienda.title,
      subtitulo: negocio.nombre,
      estado: tab === "tienda" ? negocio.estado : "",
    });

    const menuDatos = {
      nombre: nombreCuenta || content.accountFallback,
      sub: [negocio.nombre, email].filter(Boolean).join(" · "),
    };
    on(topbar.querySelector("[data-cm-menu-open]"), "click", () =>
      setMenu(true, menuDatos.nombre, menuDatos.sub)
    );
  }

  /* ---------- Pestaña activa ---------- */
  function paintTab(negocio, productos, profile) {
    if (tab === "menu") {
      root.innerHTML = menuHTML({ productos });
      wireMenu(negocio, productos);
      return;
    }

    if (tab === "pedidos") {
      root.innerHTML = pedidosHTML({
        pedidos: [],
        publicado: negocio.estado === "activo",
      });
      /* "Ir a publicar" cambia de pestaña sin doble click */
      root.querySelectorAll('[data-cm-tab="tienda"]').forEach((btn) => {
        on(btn, "click", () => {
          tab = "tienda";
          render();
        });
      });
      return;
    }

    if (tab === "ajustes") {
      root.innerHTML = ajustesHTML({
        negocio,
        nombreCuenta: profile?.nombre_completo || nombreCuenta,
        email,
      });
      wireAjustes(negocio);
      return;
    }

    /* Tienda (por defecto) */
    root.innerHTML = tiendaHTML({ negocio });
    wireTienda(negocio);
  }

  /* ---------- Cableado: Tienda ---------- */
  function wireTienda(negocio) {
    /* Interruptor de atención (abierto / cerrado).
       Por ahora es solo visual: cambia en pantalla y no guarda nada.
       Cuando se conecte a Supabase, aquí va el update de negocio.abierto. */
    on(root.querySelector("[data-cm-atencion]"), "click", (ev) => {
      const btn = ev.currentTarget;
      const encendido = btn.classList.toggle("is-on");
      btn.setAttribute("aria-checked", encendido ? "true" : "false");

      const texto = root.querySelector("[data-cm-atencion-texto]");
      if (texto) {
        texto.textContent = encendido
          ? content.tienda.atencionAbierto
          : content.tienda.atencionCerrado;
        texto.classList.toggle("cm-atencion__state--open", encendido);
        texto.classList.toggle("cm-atencion__state--closed", !encendido);
      }

      const pista = root.querySelector("[data-cm-atencion-hint]");
      if (pista) {
        pista.textContent = encendido
          ? content.tienda.atencionHintAbierto
          : content.tienda.atencionHintCerrado;
      }
    });

    on(root.querySelector("[data-cm-publicar]"), "click", async (ev) => {
      const btn = ev.currentTarget;
      btn.setAttribute("disabled", "true");
      const { error } = await publicarNegocio(negocio.id);
      if (error) {
        showMsg(root, error);
        btn.removeAttribute("disabled");
        return;
      }
      render();
    });

    on(root.querySelector("[data-cm-editar-negocio]"), "click", () =>
      openFormNegocio(negocio)
    );

    /* Portada y logo: un solo input de archivo sirve para los dos. El
       botón pulsado dice cuál es el destino. */
    wireFotosNegocio(negocio);
  }

  function wireFotosNegocio(negocio) {
    const input = root.querySelector("[data-cm-foto-input]");
    if (!input) return;

    /* Una URL guardada en la base puede apuntar a un archivo que ya no
       existe. Sin esto se vería el icono de imagen rota del navegador,
       que parece un fallo de la app. Se sustituye por el recuadro
       punteado, que dice "falta la foto" con palabras. */
    root.querySelectorAll("img[data-cm-foto-fallback]").forEach((img) => {
      on(img, "error", () => {
        const caja = img.parentElement;
        if (!caja) return;
        caja.classList.remove("has-image");
        caja.setAttribute("role", "img");
        caja.setAttribute("aria-label", img.dataset.cmFotoFallback || "");
        caja.innerHTML = `
          <span class="cm-photo__ico" aria-hidden="true">${ico.camera}</span>
          <span class="cm-photo__label">${escape(img.dataset.cmFotoFallback || "")}</span>`;
      });
    });

    let tipo = "portada";

    root.querySelectorAll("[data-cm-foto]").forEach((btn) => {
      on(btn, "click", () => {
        tipo = btn.dataset.cmFoto === "logo" ? "logo" : "portada";
        input.value = "";
        input.click();
      });
    });

    on(input, "change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      tipo = tipo === "logo" ? "logo" : "portada";
      const boton = root.querySelector(`[data-cm-foto="${tipo}"]`);
      if (boton) boton.setAttribute("disabled", "true");
      showMsg(root, "", "info");

      try {
        /* 1. Comprimir en el teléfono: 4 MB → ~250 KB */
        const { blob, error: errorCompresion, ancho, alto } = await comprimirImagen(file, tipo);
        if (errorCompresion) {
          showMsg(root, errorCompresion);
          return;
        }
        const medidas = `${ancho}×${alto}`;

        /* El comerciante ve cuánto pesa de verdad: si son 3 MB, se
           entera al momento y no culpa a la app de la espera. */
        showMsg(root, `Subiendo foto (${pesoTexto(blob.size)})…`, "info");

        /* 2. Pedir URL firmada y subir */
        const ruta = rutaFoto({ tipo, duenoId: userId, extension: "webp" });
        const { url, error: errorSubida } = await subirFoto(blob, ruta);
        if (errorSubida || !url) {
          showMsg(root, errorSubida || "No se pudo subir la foto.");
          return;
        }

        /* 3. Guardar la URL en la base */
        const { error: errorGuardado } = await guardarFotoNegocio(negocio.id, tipo, url);
        if (errorGuardado) {
          showMsg(root, errorGuardado);
          return;
        }

        /* Se dice el peso y las medidas finales: así el comerciante
           comprueba que la foto quedó ligera sin ir a Cloudflare. */
        showMsg(root, `Foto lista: ${pesoTexto(blob.size)} · ${medidas} px`, "ok");
        render();
      } finally {
        if (boton) boton.removeAttribute("disabled");
        input.value = "";
      }
    });
  }

  /* ---------- Cableado: Menú ---------- */
  function wireMenu(negocio, productos = []) {
    root.querySelectorAll("[data-cm-nuevo-producto]").forEach((btn) => {
      on(btn, "click", () => openFormProducto(negocio.id));
    });

    /* Editar: se busca el producto por id en la lista que ya está en memoria */
    root.querySelectorAll("[data-cm-edit]").forEach((btn) => {
      on(btn, "click", () => {
        const producto = productos.find((p) => p.id === btn.dataset.cmEdit);
        if (producto) openFormProducto(negocio.id, producto);
      });
    });

    root.querySelectorAll("[data-cm-toggle]").forEach((btn) => {
      on(btn, "click", async () => {
        const actual = btn.dataset.disponible === "1";
        const { error } = await alternarDisponible(btn.dataset.cmToggle, !actual);
        if (error) {
          showMsg(root, error);
          return;
        }
        render();
      });
    });

    root.querySelectorAll("[data-cm-del]").forEach((btn) => {
      on(btn, "click", async () => {
        const { error } = await borrarProducto(btn.dataset.cmDel);
        if (error) {
          showMsg(root, error);
          return;
        }
        render();
      });
    });
  }

  /* ---------- Cableado: Ajustes ---------- */
  function wireAjustes(negocio) {
    /* Cerrar sesión: dos toques, 3 s para confirmar */
    let armed = false;
    let timer = null;
    const btn = root.querySelector("[data-cm-signout]");
    const label = root.querySelector("[data-cm-signout-label]");

    on(btn, "click", async () => {
      if (!armed) {
        armed = true;
        btn.classList.add("is-armed");
        if (label) label.textContent = content.signOutArm;
        clearTimeout(timer);
        timer = setTimeout(() => {
          armed = false;
          btn.classList.remove("is-armed");
          if (label) label.textContent = content.signOut;
        }, 3000);
        return;
      }
      clearTimeout(timer);
      await signOut();
      onSignedOut?.();
    });

    root.querySelectorAll("[data-cm-editar-negocio]").forEach((row) => {
      on(row, "click", () => openFormNegocio(negocio));
    });
  }

  /* ---------- Formulario: negocio ---------- */
  function openFormNegocio(negocio) {
    reset();
    if (topbar) topbar.hidden = true;

    root.innerHTML = negocioFormHTML({ negocio });
    const form = root.querySelector("[data-cm-form-negocio]");

    on(root.querySelector("[data-cm-cancelar]"), "click", () => {
      tab = "tienda";
      render();
    });

    on(form, "submit", async (ev) => {
      ev.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.setAttribute("disabled", "true");

      const datos = Object.fromEntries(new FormData(form).entries());

      if (!String(datos.nombre || "").trim()) {
        showMsg(root, content.errorRequiredName);
        btn.removeAttribute("disabled");
        return;
      }
      if (!String(datos.categoria || "").trim()) {
        showMsg(root, content.errorRequiredCategory);
        btn.removeAttribute("disabled");
        return;
      }

      const { error } = negocio
        ? await actualizarNegocio(negocio.id, datos)
        : await crearNegocio(userId, datos);

      if (error) {
        showMsg(root, error);
        btn.removeAttribute("disabled");
        return;
      }

      tab = "tienda";
      render();
    });
  }

  /* ---------- Formulario: producto ---------- */
  function openFormProducto(negocioId, producto = null) {
    reset();
    if (topbar) topbar.hidden = true;

    root.innerHTML = productoFormHTML({ producto });
    const form = root.querySelector("[data-cm-form-producto]");

    /* La foto se elige antes de guardar pero se sube al enviar: así el
       producto necesita id para saber su carpeta, y si se cancela el
       formulario no queda un archivo suelto en el bucket. */
    let fotoElegida = null;
    const botonFoto = root.querySelector("[data-cm-prod-foto]");
    const inputFoto = root.querySelector("[data-cm-prod-foto-input]");

    if (botonFoto && inputFoto) {
      on(botonFoto, "click", () => {
        inputFoto.value = "";
        inputFoto.click();
      });

      on(inputFoto, "change", () => {
        const file = inputFoto.files?.[0];
        if (!file) return;
        fotoElegida = file;

        /* Vista previa local: se ve al instante sin subir nada todavía. */
        const url = URL.createObjectURL(file);
        botonFoto.innerHTML = `<div class="cm-photo cm-photo--square has-image">
            <img class="cm-photo__img" src="${url}" alt="${escape(content.menu.photoLabel)}" />
          </div>`;
      });
    }

    on(root.querySelector("[data-cm-cancelar]"), "click", () => {
      tab = "menu";
      render();
    });

    on(form, "submit", async (ev) => {
      ev.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.setAttribute("disabled", "true");

      const datos = Object.fromEntries(new FormData(form).entries());
      const { producto: guardado, error } = producto
        ? await actualizarProducto(producto.id, datos)
        : await crearProducto(negocioId, datos);

      if (error || !guardado) {
        showMsg(root, error || "No se pudo guardar el producto.");
        btn.removeAttribute("disabled");
        return;
      }

      /* Foto del producto: solo si se eligió una en esta sesión. */
      if (fotoElegida) {
        /* Se comprime ANTES de decir "subiendo": así el peso que se
           muestra es el real (250 KB) y no el del archivo del celular
           (4 MB), que asustaba sin motivo. */
        const { blob, error: errorCompresion, ancho, alto } = await comprimirImagen(fotoElegida, "producto");
        if (errorCompresion || !blob) {
          /* El producto ya está guardado: no se pierde nada, solo la foto. */
          showMsg(root, errorCompresion || "No se pudo preparar la foto.");
          render();
          return;
        }

        showMsg(root, `Subiendo foto (${pesoTexto(blob.size)} · ${ancho}×${alto} px)…`, "info");
        {
          const ruta = rutaFoto({
            tipo: "producto",
            negocioId,
            productoId: guardado.id,
            extension: "webp",
          });
          const { url, error: errorSubida } = await subirFoto(blob, ruta);
          if (!errorSubida && url) await guardarFotoProducto(guardado.id, url);
          /* Si la subida falla, el producto ya está guardado: no se pierde
             nada, solo la foto. Se avisa y se puede reintentar al editar. */
          if (errorSubida) showMsg(root, errorSubida);
        }
      }

      tab = "menu";
      render();
    });
  }

  await render();

  /* Al desmontar el panel no debe quedar NADA del menú en el DOM */
  return () => {
    reset();
    desmontarMenu();
  };
}

/** Mensaje de estado dentro de un formulario o del panel */
export function showMsg(root, texto, tone = "error") {
  const node = root.querySelector("[data-cm-msg]");
  if (!node) return;
  node.textContent = texto || "";
  node.dataset.tone = tone;
  node.hidden = !texto;
}
