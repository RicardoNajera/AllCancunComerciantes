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

import { content } from "./content.js";
import { signInWithProvider, signOut, getProfile } from "../shared/supabase.js";
import {
  getMiNegocio,
  crearNegocio,
  actualizarNegocio,
  publicarNegocio,
  getProductos,
  crearProducto,
  alternarDisponible,
  borrarProducto,
} from "../shared/negocio.js";

import {
  loginHTML,
  loadingHTML,
  dockHTML,
  topbarHTML,
  sinNegocioHTML,
  tiendaHTML,
} from "./views.js";
import { menuHTML, pedidosHTML } from "./views-menu.js";
import { ajustesHTML } from "./views-ajustes.js";
import { negocioFormHTML } from "./views-form-negocio.js";
import { productoFormHTML } from "./views-form-producto.js";

/** Monta el panel. Devuelve la función de limpieza. */
export async function mountPanel(root, { session, onSignedOut, topbar, dock } = {}) {
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
    if (dock) {
      dock.hidden = true;
      dock.innerHTML = "";
    }
  };

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
    root.innerHTML = loadingHTML();

    const [{ profile }, { negocio }] = await Promise.all([
      getProfile(userId),
      getMiNegocio(userId),
    ]);

    /* Sin negocio: solo una cosa que hacer */
    if (!negocio) {
      root.innerHTML = sinNegocioHTML();
      on(root.querySelector("[data-cm-nuevo-negocio]"), "click", () =>
        openFormNegocio(null)
      );
      return;
    }

    /* Con negocio: cabecera + pestaña + barra inferior */
    const productos =
      tab === "menu" ? (await getProductos(negocio.id)).productos : [];

    paintTopbar(negocio);
    paintDock();
    paintTab(negocio, productos, profile);
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
      estado: tab === "tienda" ? negocio.estado : "",
    });
  }

  /* ---------- Barra inferior ---------- */
  function paintDock() {
    if (!dock) return;
    dock.hidden = false;
    dock.innerHTML = dockHTML(tab);

    dock.querySelectorAll("[data-cm-tab]").forEach((btn) => {
      on(btn, "click", () => {
        if (btn.dataset.cmTab === tab) return;
        tab = btn.dataset.cmTab;
        render();
      });
    });
  }

  /* ---------- Pestaña activa ---------- */
  function paintTab(negocio, productos, profile) {
    if (tab === "menu") {
      root.innerHTML = menuHTML({ productos });
      wireMenu(negocio);
      return;
    }

    if (tab === "pedidos") {
      root.innerHTML = pedidosHTML({
        pedidos: [],
        publicado: negocio.estado === "activo",
      });
      on(root.querySelector('[data-cm-tab="tienda"]'), "click", () => {
        tab = "tienda";
        render();
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
  }

  /* ---------- Cableado: Menú ---------- */
  function wireMenu(negocio) {
    root.querySelectorAll("[data-cm-nuevo-producto]").forEach((btn) => {
      on(btn, "click", () => openFormProducto(negocio.id));
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
    if (dock) dock.hidden = true;

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
  function openFormProducto(negocioId) {
    reset();
    if (topbar) topbar.hidden = true;
    if (dock) dock.hidden = true;

    root.innerHTML = productoFormHTML();
    const form = root.querySelector("[data-cm-form-producto]");

    on(root.querySelector("[data-cm-cancelar]"), "click", () => {
      tab = "menu";
      render();
    });

    on(form, "submit", async (ev) => {
      ev.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.setAttribute("disabled", "true");

      const datos = Object.fromEntries(new FormData(form).entries());
      const { error } = await crearProducto(negocioId, datos);

      if (error) {
        showMsg(root, error);
        btn.removeAttribute("disabled");
        return;
      }

      tab = "menu";
      render();
    });
  }

  await render();
  return reset;
}

/** Mensaje de estado dentro de un formulario o del panel */
export function showMsg(root, texto, tone = "error") {
  const node = root.querySelector("[data-cm-msg]");
  if (!node) return;
  node.textContent = texto || "";
  node.dataset.tone = tone;
  node.hidden = !texto;
}
