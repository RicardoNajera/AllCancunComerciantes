# Fotos — Guía de puesta en marcha

Todo el código ya está escrito. Faltan **tres pasos tuyos** en la consola
de Cloudflare y uno en Supabase. Nada de esto se puede hacer desde el
repositorio: son credenciales.

---

## Paso 0 · CORS del bucket (obligatorio)

El navegador bloquea la subida si el origen de la página no está en la
política del bucket. Esto costó un rato: la política solo tenía el puerto
`8123` y el panel se abría en `127.0.0.1:5500` (Live Server de VS Code).

Cloudflare → **R2** → `all-cancun` → **Settings** → **CORS Policy**:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:8123",
      "http://127.0.0.1:8123",
      "http://localhost:5500",
      "http://127.0.0.1:5500"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

> Si abres el panel en otro puerto, ese puerto tiene que estar aquí.
> El error en consola es: *"has been blocked by CORS policy"*.
> Al publicar, añade el dominio real (`https://allcancun.mx`) a la lista.

---

## Paso 1 · Crear el token de R2 (5 min)

Cloudflare → **R2** → **Manage R2 API Tokens** → **Create API token**

| Campo | Valor |
|---|---|
| Token name | `all-cancun-worker` |
| Permissions | **Object Read & Write** |
| Specify bucket | `all-cancun` (solo ese) |
| TTL | forever (o el que prefieras) |

> Ojo: es un token de **R2**, no un API Token general de la cuenta.
> Si te ofrece "Admin Read & Write", elige el de Objects.

Al crearlo te muestra **una sola vez** tres datos:

- **Access Key ID** → será `R2_ACCESO`
- **Secret Access Key** → será `R2_SECRETO`
- **Account ID** → lo verás también en la barra lateral de R2

Guárdalos en un lugar seguro. Si cierras el diálogo, hay que crear otro.

---

## Paso 2 · Desplegar el Worker (5 min)

En la terminal, desde la carpeta del proyecto:

```bash
cd worker
npx wrangler login          # abre el navegador, autoriza
```

Luego guarda los tres secrets:

```bash
npx wrangler secret put R2_ACCESO
npx wrangler secret put R2_SECRETO
npx wrangler secret put SUPABASE_ANON_KEY
```

Cada comando pide que pegues el valor y pulsa Enter. El de la anon key
es el mismo que ya está en `config.js`.

Despliega:

```bash
npx wrangler deploy
```

Te imprime una URL así:

```
https://all-cancun-fotos.TU-USUARIO.workers.dev
```

**Comprueba que responde:**

```bash
curl https://all-cancun-fotos.TU-USUARIO.workers.dev/salud
```

Debe decir `{"ok":true,"bucket":"all-cancun","listo":true}`.
Si `listo` es `false`, faltó un secret del paso anterior.

---

## Paso 3 · Pegar la URL en config.js

Abre `config.js` y completa la línea vacía:

```js
window.ALL_CANCUN_FOTOS_WORKER = "https://all-cancun-fotos.TU-USUARIO.workers.dev";
```

Sin esto los botones de foto salen desactivados (a propósito: mejor no
ofrecer una subida que va a fallar).

---

## Paso 4 · Crear la columna del logo en Supabase

Supabase → **SQL Editor** → pega el contenido de
`supabase/02-fotos.sql` → **Run**.

Añade solo `logo_url` a `negocios`. Es seguro repetirlo.

---

## Paso 5 · Probar de verdad

1. Abre el panel en `http://localhost:8123`
2. **Fuerza recarga** (`Cmd+Shift+R`): el service worker cambia a `v4`
3. Pestaña **Tienda** → toca el recuadro de la portada
4. Elige una foto del carrete
5. Debe decir "Subiendo foto (243 KB)…" y luego verse la foto

Si sale la foto, todo el circuito funciona:

```
teléfono → comprime a WebP → Worker firma → PUT a R2 → URL a Supabase
```

---

## Cuando lo tengas en un dominio propio

El CORS del bucket solo permite `localhost:8123` hoy. Cuando publiques
el panel en un dominio real (por ejemplo `comercios.allcancun.mx`),
añádelo a la lista de **Allowed Origins** del bucket; si no, la subida
fallará solo en producción, y en local seguirá funcionando.

---

## Cuánto cuesta

| Recurso | Uso estimado | Límite gratis |
|---|---|---|
| R2 almacenamiento | 500 negocios × 3 fotos × 250 KB ≈ 375 MB | 10 GB |
| R2 lecturas (egress) | **ilimitadas** | gratis siempre |
| Worker peticiones | ~600/mes (solo subidas) | 100 000/día |
| Supabase base | ~2 MB | 500 MB |

El gasto real es cero. Lo único que podría crecer es el almacenamiento
de R2, y para llegar a 10 GB harían falta ~13 000 negocios.

---

## Si algo falla

| Síntoma | Causa probable | Arreglo |
|---|---|---|
| "La subida de fotos aún no está activada" | Falta `ALL_CANCUN_FOTOS_WORKER` | Paso 3 |
| Botones de foto grises | Igual que arriba | Paso 3 |
| "No tienes permiso para subir a esa carpeta" | El `dueno_id` de la ruta no es el de tu sesión | Revisa que `userId` venga de la sesión |
| "No se pudo enviar la imagen" | CORS del bucket | Revisa Allowed Origins |
| `curl /salud` da `listo:false` | Faltan secrets | Paso 2 |
| La foto no cambia aunque suba otra | Caché del service worker | `Cmd+Shift+R` |
| "Las fotos HEIC no se pueden leer" | Foto de iPhone en HEIC | Ajustes → Cámara → Formatos → "Más compatible" |

---

## Comprobar que las fotos quedan ligeras

### Desde el propio panel (lo más rápido)

Al terminar de subir aparece el mensaje:

> **Foto lista: 214 KB · 1600×900 px**

Si pesa menos de ~400 KB, está bien. En el móvil del comerciante
aparece igual nada más subir la foto.

### Desde la terminal, contra el bucket real

Wrangler no tiene comando para listar objetos, así que se usa la API de
Cloudflare. Primero saca el peso **exacto** de una foto concreta (esto
es lo más fiable: el servidor dice cuántos bytes manda):

```bash
# Pesa la portada. Sustituye TU-ID por el id de tu usuario de Supabase.
curl -sI "https://pub-29c2c6b56ddd4b2681e97331c0334d1f.r2.dev/negocios/TU-ID/portada.webp" \
  | grep -i 'content-length\|content-type'
```

`content-length` viene en **bytes**. Divide entre 1024 para KB:

| `content-length` | Significa | Veredicto |
|---|---|---|
| `219344` | 214 KB | ✓ bien |
| `524288` | 512 KB | aceptable, algo pesada |
| `3000000` | 2.9 MB | ✗ la compresión no se aplicó |

Para ver **todas** las fotos con su peso de una vez hay un script en el
repo que ya lo hace y avisa de las que están demasiado grandes:

```bash
node tools/pesar-fotos.mjs <R2_ACCESO> <R2_SECRETO>
```

Las credenciales se pasan como argumentos y no se guardan en ningún lado.
Sale una tabla así:

```
  3 archivo(s) en el bucket "all-cancun":

  PESO      TIPO       ESTADO  RUTA
  ------------------------------------------------------------------
  214 KB    portada      ✓    negocios/abc-123/portada.webp
  38 KB     logo         ✓    negocios/abc-123/logo.webp
  2.9 MB    producto     ¡!   productos/def-456/xyz.webp
  ------------------------------------------------------------------
  Total: 3.1 MB de 10 GB gratis

⚠ 1 foto(s) pasan del límite recomendado.
```

### Desde la web de Cloudflare

R2 → `all-cancun` → **Objects**. Cada archivo muestra su **Size**.
Ordena por tamaño para detectar los que se colaron sin comprimir.

### Qué es "ideal" para una web

| Uso | Ancho | Peso objetivo |
|---|---|---|
| Portada | 1600 px | 150–350 KB |
| Logo | 512 px | 10–40 KB |
| Foto de producto | 1000 px | 80–200 KB |

Por encima de 500 KB una foto tarda en cargar con datos móviles y
gasta el saldo del cliente. Los valores del código ya apuntan ahí.

