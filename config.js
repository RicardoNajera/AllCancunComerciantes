/**
 * All Cancún Comercios — Configuración
 *
 * Las mismas credenciales públicas que la PWA del cliente: es la MISMA
 * base de datos y la MISMA cuenta. Lo que cambia es la cara, no el
 * backend. RLS decide qué filas ve cada quien.
 *
 * La anon key es pública por diseño. La seguridad la da RLS en Postgres.
 * Nunca poner aquí una service_role key.
 */

window.ALL_CANCUN_SUPABASE_URL = "https://djyrqcjvcibnhvwwarlq.supabase.co";
window.ALL_CANCUN_SUPABASE_ANON_KEY = "sb_publishable_i-ysyzM729ZSxO9TtVjp_Q_CTuR39Kt";

/* Fotos del panel: bucket público de Cloudflare R2.
   Solo la base pública. Las claves de escritura viven en el Worker,
   nunca en el navegador. Si queda vacío, la subida se desactiva. */
window.ALL_CANCUN_FOTOS_URL = "https://pub-29c2c6b56ddd4b2681e97331c0334d1f.r2.dev";
window.ALL_CANCUN_FOTOS_WORKER = "https://all-cancun-fotos.auraradio-cloud.workers.dev";
