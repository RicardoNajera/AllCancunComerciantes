#!/usr/bin/env bash
#
# All Cancún — Publicar en Cloudflare Pages
#
# Copia SOLO lo que el navegador necesita a dist/ y lo sube.
# Fuera quedan: test/, tools/, supabase/, worker/ y la documentación
# interna, que no deben ser públicas.
#
# Uso:
#   ./publicar.sh              → sube a producción
#   ./publicar.sh --preview    → sube a una URL de prueba

set -euo pipefail
cd "$(dirname "$0")"

PROYECTO="all-cancun-comercios"
SALIDA="dist"

echo "→ Limpiando $SALIDA/"
rm -rf "$SALIDA"
mkdir -p "$SALIDA"

echo "→ Copiando archivos del sitio"

# Raíz: el HTML, el JS de arranque, el manifest y el service worker.
for f in index.html app.js config.js manifest.webmanifest sw.js; do
  cp "$f" "$SALIDA/"
done

# Carpetas que sí son del sitio.
cp -R features "$SALIDA/"
cp -R styles "$SALIDA/"
cp -R icons "$SALIDA/"
cp -R assets "$SALIDA/"

# Nada de secretos debe acabar aquí. Se busca una clave REAL asignada
# (no la palabra dentro de un comentario: config.js avisa de no ponerla
# y eso no es un secreto). La clave "publishable" de Supabase es pública
# a propósito, así que no se marca.
PATRON_SECRETO='(sb_secret_[A-Za-z0-9_-]{10,}|service_role["'"'"']?\s*[:=])'
if grep -rInE "$PATRON_SECRETO" "$SALIDA" 2>/dev/null \
     | grep -vE '^[^:]+:[0-9]+:\s*(\*|//|/\*|#)' | grep -q .; then
  echo "✗ Se encontró lo que parece una clave secreta en los archivos a publicar:"
  grep -rInE "$PATRON_SECRETO" "$SALIDA" 2>/dev/null \
    | grep -vE '^[^:]+:[0-9]+:\s*(\*|//|/\*|#)' | sed 's/^/  → /'
  echo "  Abortado por seguridad."
  exit 1
fi

echo "→ Comprobando que no falte nada"
FALTAN=0
for f in index.html app.js config.js sw.js styles/tokens.css styles/base.css styles/panel.css features/panel/index.js features/shared/supabase.js features/shared/fotos.js features/shared/imagen.js; do
  if [ ! -f "$SALIDA/$f" ]; then
    echo "  ✗ falta $f"
    FALTAN=1
  fi
done
[ "$FALTAN" -eq 0 ] || exit 1
echo "  ✓ todo en su sitio"

TAMANO=$(du -sh "$SALIDA" | cut -f1)
echo "→ Peso a subir: $TAMANO"

if [ "${1:-}" = "--preview" ]; then
  echo "→ Subiendo como vista previa…"
  npx --yes wrangler@latest pages deploy "$SALIDA" --project-name "$PROYECTO" --branch preview
else
  echo "→ Subiendo a producción…"
  npx --yes wrangler@latest pages deploy "$SALIDA" --project-name "$PROYECTO" --branch main
fi
