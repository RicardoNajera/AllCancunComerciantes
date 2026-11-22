/**
 * All Cancún Comercios — Datos del negocio
 *
 * Todas las consultas llevan RLS: la base ya sabe que cada quien solo
 * puede ver y editar su propio negocio. Aquí no se valida permisos,
 * solo se pide y se muestra.
 */

import { getSupabase } from "./supabase.js";

/* ---- Negocio ---- */

/** Guarda la URL de una foto (portada o logo). No toca el resto. */
export async function guardarFotoNegocio(negocioId, tipo, url) {
  const supabase = await getSupabase();
  if (!supabase || !negocioId) return { negocio: null, error: "Sin sesión." };

  const columna = tipo === "logo" ? "logo_url" : "foto_url";
  const limpia = String(url || "").trim() || null;

  const { data, error } = await supabase
    .from("negocios")
    .update({ [columna]: limpia })
    .eq("id", negocioId)
    .select(NEGOCIO_FIELDS)
    .maybeSingle();

  return { negocio: data || null, error: error?.message || null };
}

/** Igual para productos: la columna foto_url ya existía. */
export async function guardarFotoProducto(productoId, url) {
  const supabase = await getSupabase();
  if (!supabase || !productoId) return { producto: null, error: "Sin sesión." };

  const limpia = String(url || "").trim() || null;

  const { data, error } = await supabase
    .from("productos")
    .update({ foto_url: limpia })
    .eq("id", productoId)
    .select(PRODUCTO_FIELDS)
    .maybeSingle();

  return { producto: data || null, error: error?.message || null };
}

const NEGOCIO_FIELDS = [
  "id",
  "dueno_id",
  "nombre",
  "slug",
  "categoria",
  "estado",
  "descripcion",
  "telefono",
  "whatsapp",
  "colonia",
  "direccion",
  "latitude",
  "longitude",
  "foto_url",
  "logo_url",
  "creado_en",
  "actualizado_en",
].join(",");

/** El negocio del usuario con sesión. null si aún no tiene. */
export async function getMiNegocio(userId) {
  const supabase = await getSupabase();
  if (!supabase || !userId) return { negocio: null, error: null };

  const { data, error } = await supabase
    .from("negocios")
    .select(NEGOCIO_FIELDS)
    .eq("dueno_id", userId)
    .order("creado_en", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { negocio: data || null, error: error?.message || null };
}

/** Crea el negocio del usuario. El estado inicial es 'borrador'. */
export async function crearNegocio(userId, datos) {
  const supabase = await getSupabase();
  if (!supabase || !userId) return { negocio: null, error: "Sin sesión." };

  const nombre = String(datos.nombre || "").trim();
  const categoria = String(datos.categoria || "").trim();
  if (nombre.length < 2) return { negocio: null, error: "Escribe el nombre del negocio." };
  if (!categoria) return { negocio: null, error: "Elige una categoría." };

  const whatsapp = String(datos.whatsapp || "").replace(/\D/g, "");
  if (whatsapp && whatsapp.length < 10)
    return { negocio: null, error: "El WhatsApp debe tener 10 dígitos." };

  const { data, error } = await supabase
    .from("negocios")
    .insert({
      dueno_id: userId,
      nombre,
      slug: await slugDisponible(nombre),
      categoria,
      colonia: String(datos.colonia || "").trim() || null,
      whatsapp: whatsapp || null,
      descripcion: String(datos.descripcion || "").trim() || null,
      estado: "borrador",
    })
    .select(NEGOCIO_FIELDS)
    .maybeSingle();

  return { negocio: data || null, error: error?.message || null };
}

/** Actualiza los datos del negocio. No toca el slug ni el estado. */
export async function actualizarNegocio(negocioId, datos) {
  const supabase = await getSupabase();
  if (!supabase || !negocioId) return { negocio: null, error: "Sin sesión." };

  const nombre = String(datos.nombre || "").trim();
  const categoria = String(datos.categoria || "").trim();
  if (nombre.length < 2) return { negocio: null, error: "Escribe el nombre del negocio." };
  if (!categoria) return { negocio: null, error: "Elige una categoría." };

  const whatsapp = String(datos.whatsapp || "").replace(/\D/g, "");
  if (whatsapp && whatsapp.length < 10)
    return { negocio: null, error: "El WhatsApp debe tener 10 dígitos." };

  const { data, error } = await supabase
    .from("negocios")
    .update({
      nombre,
      categoria,
      colonia: String(datos.colonia || "").trim() || null,
      whatsapp: whatsapp || null,
      descripcion: String(datos.descripcion || "").trim() || null,
    })
    .eq("id", negocioId)
    .select(NEGOCIO_FIELDS)
    .maybeSingle();

  return { negocio: data || null, error: error?.message || null };
}

/** Publica el negocio: pasa de 'borrador' a 'activo'. */
export async function publicarNegocio(negocioId) {
  const supabase = await getSupabase();
  if (!supabase || !negocioId) return { negocio: null, error: "Sin sesión." };

  const { data, error } = await supabase
    .from("negocios")
    .update({ estado: "activo" })
    .eq("id", negocioId)
    .select(NEGOCIO_FIELDS)
    .maybeSingle();

  return { negocio: data || null, error: error?.message || null };
}

/* ---- Slug ---- */

/** Espeja la función generar_slug() de Postgres. */
export function generarSlug(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Busca un slug libre: jugos-naturales-juana, jugos-naturales-juana-2… */
async function slugDisponible(nombre) {
  const base = generarSlug(nombre) || "negocio";
  const supabase = await getSupabase();
  if (!supabase) return base;

  let candidato = base;
  for (let n = 2; n <= 20; n += 1) {
    const { data } = await supabase
      .from("negocios")
      .select("id")
      .eq("slug", candidato)
      .maybeSingle();
    if (!data) return candidato;
    candidato = `${base.slice(0, 76)}-${n}`;
  }
  return `${base.slice(0, 70)}-${Date.now().toString(36)}`;
}

/* ---- Productos ---- */

const PRODUCTO_FIELDS = [
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

/** Menú completo del negocio, en el orden que puso el dueño. */
export async function getProductos(negocioId) {
  const supabase = await getSupabase();
  if (!supabase || !negocioId) return { productos: [], error: null };

  const { data, error } = await supabase
    .from("productos")
    .select(PRODUCTO_FIELDS)
    .eq("negocio_id", negocioId)
    .order("orden", { ascending: true })
    .order("creado_en", { ascending: true });

  return { productos: data || [], error: error?.message || null };
}

/** Crea un producto. El precio entra en pesos y se guarda en centavos. */
export async function crearProducto(negocioId, datos) {
  const supabase = await getSupabase();
  if (!supabase || !negocioId) return { producto: null, error: "Sin sesión." };

  const nombre = String(datos.nombre || "").trim();
  if (nombre.length < 2) return { producto: null, error: "Escribe el nombre del producto." };

  const precio = pesosACentavos(datos.precio);
  if (precio === null) return { producto: null, error: "Escribe un precio válido." };

  const { data, error } = await supabase
    .from("productos")
    .insert({
      negocio_id: negocioId,
      nombre,
      descripcion: String(datos.descripcion || "").trim() || null,
      precio_centavos: precio,
      disponible: true,
    })
    .select(PRODUCTO_FIELDS)
    .maybeSingle();

  return { producto: data || null, error: error?.message || null };
}

/** Actualiza un producto. El precio entra en pesos y se guarda en centavos. */
export async function actualizarProducto(productoId, datos) {
  const supabase = await getSupabase();
  if (!supabase || !productoId) return { producto: null, error: "Sin sesión." };

  const nombre = String(datos.nombre || "").trim();
  if (nombre.length < 2) return { producto: null, error: "Escribe el nombre del producto." };

  const precio = pesosACentavos(datos.precio);
  if (precio === null) return { producto: null, error: "Escribe un precio válido." };

  const { data, error } = await supabase
    .from("productos")
    .update({
      nombre,
      descripcion: String(datos.descripcion || "").trim() || null,
      precio_centavos: precio,
    })
    .eq("id", productoId)
    .select(PRODUCTO_FIELDS)
    .maybeSingle();

  return { producto: data || null, error: error?.message || null };
}

/** Apaga o enciende un producto sin borrarlo (agotado hoy). */
export async function alternarDisponible(productoId, disponible) {
  const supabase = await getSupabase();
  if (!supabase || !productoId) return { error: "Sin sesión." };

  const { error } = await supabase
    .from("productos")
    .update({ disponible: Boolean(disponible) })
    .eq("id", productoId);

  return { error: error?.message || null };
}

export async function borrarProducto(productoId) {
  const supabase = await getSupabase();
  if (!supabase || !productoId) return { error: "Sin sesión." };

  const { error } = await supabase.from("productos").delete().eq("id", productoId);
  return { error: error?.message || null };
}

/* ---- Dinero ---- */

/** "35" o "35.50" → 3500 / 3550. Devuelve null si no es un precio válido. */
export function pesosACentavos(valor) {
  const limpio = String(valor ?? "").replace(/[^0-9.]/g, "");
  if (!limpio) return null;
  const num = Number(limpio);
  if (!Number.isFinite(num) || num < 0 || num > 100000) return null;
  return Math.round(num * 100);
}

/** 3500 → "$35.00" */
export function formatoPrecio(centavos) {
  const n = Number(centavos) || 0;
  return `$${(n / 100).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

