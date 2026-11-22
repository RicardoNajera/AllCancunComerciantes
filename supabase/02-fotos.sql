-- ============================================================
--  Columna logo_url en negocios
--
--  El logo es distinto de la portada: la portada es una foto ancha
--  (1600x900) y el logo es cuadrado (512x512). Antes solo existía
--  foto_url, así que el logo no tenía dónde guardarse.
--
--  Ejecutar en Supabase → SQL Editor. Es seguro repetirlo.
-- ============================================================

alter table public.negocios
  add column if not exists logo_url text;

comment on column public.negocios.foto_url is
  'Portada del negocio. URL pública en R2: negocios/<dueno_id>/portada.webp';

comment on column public.negocios.logo_url is
  'Logo cuadrado del negocio. URL pública en R2: negocios/<dueno_id>/logo.webp';

-- Ninguna política nueva: las de update ya existentes permiten al dueño
-- cambiar sus propias columnas, y RLS impide tocar otro negocio.
