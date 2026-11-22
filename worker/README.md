# All Cancún — Cómo desplegar el Worker de fotos
#
# 1. Instalar wrangler y entrar a la cuenta
#      npx wrangler login
#
# 2. Guardar los tres secrets (te los pide uno por uno)
#      cd worker
#      npx wrangler secret put R2_ACCESO          # Access Key ID
#      npx wrangler secret put R2_SECRETO         # Secret Access Key
#      npx wrangler secret put SUPABASE_ANON_KEY  # la misma de config.js
#
# 3. Desplegar
#      npx wrangler deploy
#
# 4. Copiar la URL que imprime (algo como
#      https://all-cancun-fotos.TU-USUARIO.workers.dev)
#    y pegarla en config.js:
#      window.ALL_CANCUN_FOTOS_WORKER = "https://all-cancun-fotos.TU-USUARIO.workers.dev";
#
# 5. Comprobar que responde
#      curl https://all-cancun-fotos.TU-USUARIO.workers.dev/salud
#    Debe devolver {"ok":true,"bucket":"all-cancun","listo":true}
#
# Si "listo" sale false, faltan los secrets del paso 2.
