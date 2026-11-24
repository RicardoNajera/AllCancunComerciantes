/**
 * All Cancún Comercios — Catálogo público
 *
 * Lo que ve el cliente: qué venden los comercios de Cancún.
 * Sin cuenta, sin contraseña, sin instalar nada.
 *
 * Rutas (por hash, para que funcionen en Cloudflare Pages sin reglas):
 *   #/                    → todos los comercios
 *   #/categoria/comida    → filtrados
 *   #/negocio/jugos-ana   → su menú
 *
 * Nada se guarda entre visitas salvo el hash. No hay carrito porque
 * todavía no hay tabla de pedidos: prometer un carrito que no puede
 * cerrar una venta sería mentirle al cliente. El pedido se cierra por
 * WhatsApp, que es donde el comerciante sí contesta hoy.
 */

import {
  listarNegocios,
  getNegocioPorSlug,
  getMenuPublico,
  enlaceWhatsApp,
  mensajeProducto,
} from "./datos.js";
import { listaHTML } from "./views-lista.js";
import { negocioHTML } from "./views-negocio.js";
import {
  cargandoHTML,
  noEncontradoHTML,
  sinConexionHTML,
} from "./views-estados.js";

/* La página tiene que existir antes de tocar nada */
const raiz = document.getElementById("cl-app");
if (raiz) arrancar(raiz);

function arrancar(root) {
  /* Ruta actual → qué pintar. Un solo sitio donde se decide. */
  function leerRuta() {
    const hash = String(location.hash || "#/").replace(/^#/, "") || "/";
    const partes = hash.split("/").filter(Boolean);

    if (partes[0] === "negocio" && partes[1]) {
      return { tipo: "negocio", slug: decodeURIComponent(partes[1]) };
    }
    if (partes[0] === "categoria" && partes[1]) {
      return { tipo: "categoria", categoria: decodeURIComponent(partes[1]) };
    }
    return { tipo: "lista", categoria: "" };
  }

  /* Una sola navegación a la vez: si el cliente toca dos enlaces
     seguidos, la primera respuesta no debe pisar la segunda. */
  let turno = 0;

  async function pintar() {
    const mio = ++turno;
    const ruta = leerRuta();

    root.innerHTML = cargandoHTML();
    window.scrollTo({ top: 0 });

    if (ruta.tipo === "negocio") {
      const { negocio, error } = await getNegocioPorSlug(ruta.slug);
      if (mio !== turno) return;

      if (error) return pintarError(error);
      if (!negocio) {
        document.title = "Comercio no disponible · All Cancún Comercios";
        root.innerHTML = noEncontradoHTML();
        return;
      }

      const { productos } = await getMenuPublico(negocio.id);
      if (mio !== turno) return;

      document.title = `${negocio.nombre} · All Cancún Comercios`;
      root.innerHTML = negocioHTML({ negocio, productos });
      cablearPedido(negocio);
      recuperarImagenes(root);
      return;
    }

    const { negocios, error } = await listarNegocios({ categoria: ruta.categoria });
    if (mio !== turno) return;
    if (error) return pintarError(error);

    document.title = ruta.categoria
      ? `${ruta.categoria} · All Cancún Comercios`
      : "All Cancún Comercios — Lo que venden tus vecinos";
    root.innerHTML = listaHTML({ negocios, categoria: ruta.categoria });
    recuperarImagenes(root);
  }

  function pintarError(detalle) {
    root.innerHTML = sinConexionHTML(detalle);
    root.querySelector("[data-cl-reintentar]")?.addEventListener("click", pintar);
  }

  /* El botón "Pedir" abre WhatsApp con el mensaje ya escrito. El cliente
     no tiene que redactar nada: si tiene que pensar, no escribe. */
  function cablearPedido(negocio) {
    root.querySelectorAll("[data-cl-pedir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nombre = btn.dataset.clProdNombre || "";
        const texto = nombre
          ? mensajeProducto(negocio, { nombre })
          : mensajeProducto(negocio, null);
        const url = enlaceWhatsApp(negocio, texto);
        if (url) window.open(url, "_blank", "noopener");
      });
    });
  }

  /* Una foto que ya no existe deja el hueco vacío, no el ícono roto */
  function recuperarImagenes(scope) {
    scope.querySelectorAll("[data-cl-img]").forEach((el) => {
      el.addEventListener(
        "error",
        () => {
          el.style.display = "none";
        },
        { once: true }
      );
    });
  }

  window.addEventListener("hashchange", pintar);
  pintar();
}
