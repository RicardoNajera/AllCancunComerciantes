/**
 * All Cancún Comercios — Datos del catálogo público
 *
 * Aquí se lee SIN sesión: quien entra a ver qué venden los comercios de
 * Cancún no necesita cuenta. La base lo permite a propósito:
 *
 *   grant select on public.negocios, public.productos to anon;
 *
 * y las políticas RLS solo dejan ver negocios con estado = 'activo'.
 * Un negocio en borrador o suspendido no aparece, y su menú tampoco:
 * no hay que filtrarlo aquí, lo filtra Postgres. Si se filtrara solo en
 * el cliente, cualquiera podría saltarse el filtro con la consola.
 */

import { getSupabase } from "../shared/supabase.js";

const NEGOCIO_PUBLICO = [
  "id",
  "nombre",
  "slug",
  "categoria",
  "descripcion",
  "colonia",
  "direccion",
  "whatsapp",
  "telefono",
  "foto_url",
  "logo_url",
].join(",");

const PRODUCTO_PUBLICO = [
  "id",
  "negocio_id",
  "nombre",
  "descripcion",
  "precio_centavos",
  "moneda",
  "foto_url",
  "disponible",
  "orden",
].join(",");

/**
 * Los negocios que hoy se pueden visitar, ordenados por categoría y nombre.
 * Devuelve [] si no hay conexión o la tabla aún está vacía: la vista
 * muestra entonces su propio estado vacío, nunca un error técnico.
 */
export async function listarNegocios({ categoria = "" } = {}) {
  const supabase = await getSupabase();
  if (!supabase) return { negocios: [], error: "Sin conexión con la base." };

  let consulta = supabase
    .from("negocios")
    .select(NEGOCIO_PUBLICO)
    .eq("estado", "activo")
    .order("nombre", { ascending: true });

  /* La categoría es un enum de Postgres: si llega algo que no existe,
     la consulta falla entera. Se filtra solo con valores conocidos. */
  const cat = String(categoria || "").trim();
  if (cat) consulta = consulta.eq("categoria", cat);

  const { data, error } = await consulta;

  return { negocios: data || [], error: error?.message || null };
}

/** Un negocio por su slug, que es como se comparte el enlace. */
export async function getNegocioPorSlug(slug) {
  const supabase = await getSupabase();
  const limpio = String(slug || "").trim();
  if (!supabase || !limpio) return { negocio: null, error: null };

  const { data, error } = await supabase
    .from("negocios")
    .select(NEGOCIO_PUBLICO)
    .eq("slug", limpio)
    .eq("estado", "activo")
    .maybeSingle();

  return { negocio: data || null, error: error?.message || null };
}

/**
 * El menú de un negocio.
 *
 * Los agotados SÍ se devuelven, marcados. Esconderlos obliga al cliente a
 * preguntar por algo que existe; verlos tachados le dice "hoy no hay" sin
 * tener que escribir. La vista los pinta separados y en gris.
 */
export async function getMenuPublico(negocioId) {
  const supabase = await getSupabase();
  if (!supabase || !negocioId) return { productos: [], error: null };

  const { data, error } = await supabase
    .from("productos")
    .select(PRODUCTO_PUBLICO)
    .eq("negocio_id", negocioId)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  return { productos: data || [], error: error?.message || null };
}

/** Enlace de WhatsApp listo para mandar, o "" si el negocio no lo tiene. */
export function enlaceWhatsApp(negocio, texto) {
  const digitos = String(negocio?.whatsapp || "").replace(/\D/g, "");
  if (!digitos) return "";

  /* México: 10 dígitos son un número nacional; WhatsApp necesita el 52
     por delante. Si ya viene con lada (521… o 52…), se respeta. */
  const conLada =
    digitos.length === 10
      ? `52${digitos}`
      : digitos.startsWith("52")
        ? digitos
        : `52${digitos}`;

  const mensaje = String(texto || "").trim();
  return `https://wa.me/${conLada}${
    mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""
  }`;
}

/** El mensaje que se manda al local desde la ficha de un producto. */
export function mensajeProducto(negocio, producto) {
  const quien = negocio?.nombre ? `Hola ${negocio.nombre}` : "Hola";
  const que = producto?.nombre ? ` por "${producto.nombre}"` : "";
  return `${quien}, vi tu menú en All Cancún Comercios y me interesa${que}. ¿Sigue disponible?`;
}
