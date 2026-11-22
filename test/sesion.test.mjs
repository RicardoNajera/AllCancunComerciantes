/**
 * Prueba de la validación de sesión del Worker.
 *
 * Reproduce el bug: sin `apikey` Supabase responde 401 aunque el token
 * sea válido, y el panel decía "tu sesión expiró" en cada subida.
 */
import worker from "/Users/annymena/Desktop/All Cancún Comercios/worker/index.js";

const SUPABASE = "https://djyrqcjvcibnhvwwarlq.supabase.co";
const ANON = "sb_publishable_i-ysyzM729ZSxO9TtVjp_Q_CTuR39Kt";

let fallos = 0;
const ok = (n, c) => { console.log((c ? "  ✓ " : "  ✗ ") + n); if (!c) fallos++; };

/* 1. La comprobación base: Supabase exige apikey */
console.log("\n--- Supabase exige apikey ---");
const sinKey = await fetch(`${SUPABASE}/auth/v1/user`, {
  headers: { Authorization: "Bearer token-invalido" },
});
const conKey = await fetch(`${SUPABASE}/auth/v1/user`, {
  headers: { apikey: ANON, Authorization: "Bearer token-invalido" },
});
console.log(`  sin apikey → ${sinKey.status} | con apikey → ${conKey.status}`);
ok("sin apikey da 401 (por eso fallaba)", sinKey.status === 401);
ok("con apikey el error es del token, no de la clave", conKey.status !== 401);

/* 2. El Worker rechaza tokens falsos (no se debe abrir la puerta) */
console.log("\n--- El Worker rechaza tokens falsos ---");
const env = { R2_BUCKET: "all-cancun", R2_ACCESO: "x", R2_SECRETO: "y", SUPABASE_ANON_KEY: ANON };
const ctx = { waitUntil() {} };

const r1 = await worker.fetch(
  new Request("https://w.dev/firmar", {
    method: "POST",
    headers: { Authorization: "Bearer token-falso" },
    body: JSON.stringify({ ruta: "negocios/u1/portada.webp" }),
  }),
  env,
  ctx
);
ok("token falso → 401", r1.status === 401);

/* 3. Sin el secret configurado no se autoriza a nadie (falla cerrado) */
console.log("\n--- Falla cerrado si falta el secret ---");
const r2 = await worker.fetch(
  new Request("https://w.dev/firmar", {
    method: "POST",
    headers: { Authorization: "Bearer cualquier-cosa" },
    body: JSON.stringify({ ruta: "negocios/u1/portada.webp" }),
  }),
  { R2_BUCKET: "all-cancun", R2_ACCESO: "x", R2_SECRETO: "y" }, // sin SUPABASE_ANON_KEY
  ctx
);
ok("sin SUPABASE_ANON_KEY → 401 (no se firma nada)", r2.status === 401);

/* 4. /salud sigue funcionando */
const r3 = await worker.fetch(new Request("https://w.dev/salud"), env, ctx);
const salud = await r3.json();
ok("/salud sigue en pie", r3.status === 200 && salud.ok === true);

console.log(fallos ? `\n${fallos} fallo(s)` : "\n✓ validación de sesión correcta");
process.exit(fallos ? 1 : 0);
