# Publicar en Cloudflare

**Tu sitio ya está en internet:**
👉 https://all-cancun-comercios.pages.dev

Es gratis, con HTTPS y sin límite de visitas. No pide tarjeta.

---

## Para actualizar el sitio

Cuando cambies algo, basta con:

```bash
./publicar.sh
```

Tarda unos 5 segundos. Al terminar te da una URL nueva
(`https://<algo>.all-cancun-comercios.pages.dev`) con esa versión,
pero la dirección principal **no cambia**: siempre es
`all-cancun-comercios.pages.dev` y muestra lo último publicado.

Si quieres probar antes de que lo vea todo el mundo:

```bash
./publicar.sh --preview
```

Eso sube a una URL aparte y **no** toca la principal.

---

## Qué se publica y qué no

`publicar.sh` copia a `dist/` solo lo que el navegador necesita:

| Se publica | NO se publica |
|---|---|
| `index.html`, `app.js`, `config.js` | `test/` (pruebas) |
| `features/`, `styles/`, `icons/`, `assets/` | `tools/` (herramientas) |
| `manifest.webmanifest`, `sw.js` | `supabase/` (SQL) |
| | `worker/` (código del servidor) |
| | `FOTOS.md`, este archivo |

El script **aborta** si encuentra una clave secreta por error.

---

## Si algo sale mal

### "This command cannot be run in a non-interactive context"
El proyecto no existe todavía en Cloudflare. Créalo una vez en
**Workers & Pages → Create → Pages → Upload assets**, o revisa que
el nombre del proyecto en `publicar.sh` sea el correcto.

### La sesión de wrangler caducó
Corre `npx wrangler login` y vuelve a publicar.

### Las fotos no suben desde el sitio publicado
Falta el dominio en el CORS del bucket. Añádelo en
`worker/cors-bucket.json` y aplica:

```bash
cd worker
npx wrangler r2 bucket cors set all-cancun --file cors-bucket.json
```

---

## Poner un dominio propio (opcional, de pago)

El sitio funciona sin dominio. Si más adelante quieres uno:

1. Compra el dominio en **Cloudflare → Registrar** (solo `.com`, `.net`,
   etc.). Los `.mx` se compran en NIC México o un revendedor.
2. En **Workers & Pages → all-cancun-comercios → Custom domains**,
   añade el dominio. Cloudflare configura el DNS solo.
3. **No olvides** añadir ese dominio a `worker/cors-bucket.json`, o las
   fotos dejarán de subir desde la nueva dirección.

Precio típico de un `.com`: ~$200 MXN al año. Al día de hoy
`allcancun.com` y `allcancun.mx` ya están ocupados; `allcancuncomercios.com`
estaba libre.
