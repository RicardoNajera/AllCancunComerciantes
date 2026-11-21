/**
 * All Cancún — Cliente de Supabase
 *
 * Credenciales (igual que el token de Mapbox): se leen de config.js,
 * que está ignorado por git. Nunca se escribe la anon key en el repositorio.
 *
 *   // config.js
 *   window.ALL_CANCUN_SUPABASE_URL = "https://xxxx.supabase.co";
 *   window.ALL_CANCUN_SUPABASE_ANON_KEY = "eyJhbGciOi...";
 *
 * La anon key es pública por diseño: la seguridad real la da RLS en Postgres.
 */

const config = () => ({
  url: String(window.ALL_CANCUN_SUPABASE_URL || "").trim(),
  anonKey: String(window.ALL_CANCUN_SUPABASE_ANON_KEY || "").trim(),
});

export const isConfigured = () => {
  const { url, anonKey } = config();
  return Boolean(url && anonKey);
};

let client = null;
let loading = null;

/**
 * Devuelve el cliente listo (singleton). Carga el SDK desde el CDN oficial
 * la primera vez, así no hace falta bundler ni dependencias nuevas.
 * Devuelve null si faltan credenciales.
 */
export async function getSupabase() {
  if (client) return client;
  if (!isConfigured()) return null;

  loading =
    loading ||
    (async () => {
      if (!window.supabase?.createClient) await loadSdk();
      const { url, anonKey } = config();
      client = window.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      });
      return client;
    })();

  try {
    return await loading;
  } catch {
    loading = null;
    return null;
  }
}

const SDK_URL =
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";

function loadSdk() {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      if (window.supabase?.createClient) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("supabase sdk")));
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar supabase-js"));
    document.head.appendChild(script);
  });
}

/* ---- Sesión ---- */

export async function getSession() {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

/** Escucha cambios de sesión. Devuelve la función para dejar de escuchar. */
export async function onAuthChange(callback) {
  const supabase = await getSupabase();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session || null, event);
  });
  return () => data.subscription.unsubscribe();
}

/* ---- OAuth social ---- */

/* Solo se listan los proveedores realmente activados en Supabase
   (Authentication → Providers). Si activas otro más adelante, agrégalo aquí. */
export const PROVIDERS = [{ id: "google", label: "Google" }];

export async function signInWithProvider(provider) {
  const supabase = await getSupabase();
  if (!supabase) return { error: "Falta configurar Supabase." };
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // Vuelve exactamente a la página donde se inició sesión
      // (GitHub Pages o localhost). Debe estar en
      // Authentication → URL Configuration → Redirect URLs.
      redirectTo: window.location.origin + window.location.pathname,
      queryParams: { prompt: "select_account" },
    },
  });
  return { error: error?.message || null };
}

export async function signOut() {
  const supabase = await getSupabase();
  if (!supabase) return { error: "Falta configurar Supabase." };
  const { error } = await supabase.auth.signOut();
  return { error: error?.message || null };
}

/* ---- Perfiles (public.perfiles) ---- */

export const PROFILE_FIELDS = [
  "id",
  "rol",
  "apodo",
  "nombre_completo",
  "foto_perfil_url",
  "creado_en",
  "actualizado_en",
];

const SELECT = PROFILE_FIELDS.join(",");

/** Apodo válido: minúsculas, sin acentos ni espacios, 3-32 caracteres.
 *  Espeja el CHECK y la función normalizar_apodo() de la base.
 *  Devuelve "" si no queda nada usable: entonces la app lo pide. */
export function normalizarApodo(valor) {
  if (typeof valor !== "string") return "";
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 32);
}

/** true si el apodo cumple la regla que exige la base. */
export function apodoValido(valor) {
  return /^[a-z0-9._-]{3,32}$/.test(String(valor || ""));
}

/** Lee el perfil del usuario. RLS limita la fila a id = auth.uid(). */
export async function getProfile(userId) {
  const supabase = await getSupabase();
  if (!supabase || !userId) return { profile: null, error: "Sin sesión." };

  const { data, error } = await supabase
    .from("perfiles")
    .select(SELECT)
    .eq("id", userId)
    .maybeSingle();

  return { profile: data || null, error: error?.message || null };
}

/** Guarda solo los campos editables. RLS impide tocar otra fila o el rol. */
export async function updateProfile(userId, patch = {}) {
  const supabase = await getSupabase();
  if (!supabase || !userId) return { profile: null, error: "Sin sesión." };

  const payload = {};
  /* El apodo se normaliza aquí: la base exige minúsculas, sin acentos
     ni espacios (3-32). Si no queda nada usable se guarda null y la
     vista vuelve a pedirlo. */
  if (typeof patch.apodo === "string") {
    const limpio = normalizarApodo(patch.apodo);
    payload.apodo = limpio || null;
  }
  if (typeof patch.nombre_completo === "string")
    payload.nombre_completo = patch.nombre_completo.trim() || null;
  if (typeof patch.foto_perfil_url === "string")
    payload.foto_perfil_url = patch.foto_perfil_url.trim() || null;

  if (!Object.keys(payload).length) return { profile: null, error: null };

  const { data, error } = await supabase
    .from("perfiles")
    .update(payload)
    .eq("id", userId)
    .select(SELECT)
    .maybeSingle();

  return { profile: data || null, error: error?.message || null };
}

/** Crea la fila si el trigger de alta todavía no la generó.
 *  No se envía `rol`: es enum rol_usuario NOT NULL con default 'cliente'.
 *  Enviarlo como texto fallaría por tipo y además es un privilegio del sistema. */
export async function ensureProfile(user) {
  const supabase = await getSupabase();
  if (!supabase || !user?.id) return { profile: null, error: "Sin sesión." };

  const existing = await getProfile(user.id);
  if (existing.profile) return existing;

  /* Si la consulta falla (tabla/RLS aún sin configurar) se devuelve el error
     pero con profile null: el login sigue funcionando sin perfil. */
  const meta = user.user_metadata || {};
  const candidato =
    normalizarApodo(
      meta.preferred_username || meta.given_name || meta.name || user.email?.split("@")[0] || ""
    ) || null;

  const { data, error } = await supabase
    .from("perfiles")
    .insert({
      id: user.id,
      /* null si el apodo no cumple: la base lo rechazaría por el CHECK
         y prefiero que quede vacío para que la vista lo pida. */
      apodo: apodoValido(candidato) ? candidato : null,
      nombre_completo: meta.full_name || meta.name || null,
      foto_perfil_url: meta.avatar_url || meta.picture || null,
    })
    .select(SELECT)
    .maybeSingle();

  return { profile: data || null, error: error?.message || null };
}
