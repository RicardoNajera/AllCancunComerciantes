-- ════════════════════════════════════════════════════════════════
--  ALL CANCÚN · CREAR negocios
--
--  Tu base YA TIENE public.perfiles (verificado). Este script solo
--  agrega lo que falta para que el formulario "Nuevo negocio" guarde:
--
--    1. enum categoria_negocio  (las 9 del formulario)
--    2. enum estado_negocio     (borrador / activo / suspendido)
--    3. tabla public.negocios
--
--  No toca perfiles. No borra nada. Se puede correr dos veces.
-- ════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- 1) Los dos tipos
-- ────────────────────────────────────────────────────────────────
-- Las 9 categorías son EXACTAMENTE las de CATEGORIAS en
-- features/panel/content.js. Si agregas una al panel, agrégala aquí.
do $$ begin
  create type public.categoria_negocio as enum (
    'comida',         -- Comida y bebidas
    'comercios',      -- Tienda / abarrotes
    'salud',          -- Salud
    'mantenimiento',  -- Mantenimiento
    'tianguis',       -- Tianguis
    'mujeres',        -- Belleza y moda
    'hombres',        -- Barbería y moda
    'estudiantes',    -- Estudiantes
    'otro'            -- Otro
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.estado_negocio as enum ('borrador', 'activo', 'suspendido');
exception when duplicate_object then null;
end $$;


-- ────────────────────────────────────────────────────────────────
-- 2) La tabla negocios
--
--    Cada columna corresponde a algo que la app ya captura o lee:
--      nombre        input del form       (maxlength 80)
--      categoria     select del form      (enum de arriba)
--      colonia       input del form       (maxlength 60)
--      whatsapp      input del form       (maxlength 10)
--      descripcion   textarea del form    (maxlength 280)
--      slug          se calcula solo      (trigger más abajo)
--      estado        nace en 'borrador'
--      dueno_id      la cuenta de Google
--      telefono/direccion/latitud/longitud/foto_url  se leen en
--        NEGOCIO_FIELDS pero hoy el form no los pide: van opcionales
-- ────────────────────────────────────────────────────────────────
create table if not exists public.negocios (
  id              uuid primary key default gen_random_uuid(),
  dueno_id        uuid not null references public.perfiles(id) on delete cascade,

  nombre          text not null,
  slug            text not null,
  categoria       public.categoria_negocio not null,
  estado          public.estado_negocio not null default 'borrador',

  descripcion     text,
  telefono        text,
  whatsapp        text,
  colonia         text,
  direccion       text,
  latitude        double precision,
  longitude       double precision,
  foto_url        text,

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  -- Cada CHECK es el espejo de un maxlength del formulario:
  -- si el form deja escribir algo, la base lo tiene que aceptar.
  constraint nombre_largo       check (char_length(trim(nombre)) between 2 and 80),
  constraint slug_formato       check (slug ~ '^[a-z0-9-]{3,80}$'),
  constraint colonia_largo      check (colonia is null or char_length(colonia) <= 60),
  constraint descripcion_largo  check (descripcion is null or char_length(descripcion) <= 280),
  constraint whatsapp_formato   check (whatsapp is null or whatsapp ~ '^[0-9]{10}$'),
  constraint lat_rango          check (latitude  is null or latitude  between -90  and 90),
  constraint lng_rango          check (longitude is null or longitude between -180 and 180)
);

-- Un negocio por dueño: la app pide "el negocio del usuario" con limit(1),
-- así que si hubiera dos se comportaría raro. Mejor impedirlo en la base.
create unique index if not exists negocios_slug_unico on public.negocios (slug);
create index if not exists negocios_dueno_idx  on public.negocios (dueno_id);
create index if not exists negocios_estado_idx on public.negocios (estado);
create index if not exists negocios_cat_idx    on public.negocios (categoria);

comment on table  public.negocios        is 'Negocio local. Pertenece a un perfil y tiene productos.';
comment on column public.negocios.slug   is 'URL bonita única. Ej: jugos-naturales-juana';
comment on column public.negocios.estado is 'borrador: solo lo ve el dueño. activo: visible en la app. suspendido: lo bajó moderación.';



-- ────────────────────────────────────────────────────────────────
-- 3) Slug automático
--    "Jugos Naturales Juana" → jugos-naturales-juana
--    Si ya existe, se le agrega -2, -3...
--    Espeja generarSlug() de features/shared/negocio.js
-- ────────────────────────────────────────────────────────────────
create or replace function public.generar_slug(p_texto text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      left(
        trim(both '-' from
          regexp_replace(
            lower(translate(trim(p_texto),
              'áàäâãÁÀÄÂÃéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ',
              'aaaaaAAAAAeeeeEEEEiiiiIIIIooooOOOOOuuuuUUUUnNcC')),
            '[^a-z0-9]+', '-', 'g')
        ),
        80
      ),
      ''
    ),
    'negocio'
  );
$$;

create or replace function public.poner_slug_negocio()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_base  text;
  v_slug  text;
  v_n     int := 1;
begin
  -- Si el dueño no mandó slug, o mandó uno vacío, se calcula del nombre.
  if new.slug is null or trim(new.slug) = '' then
    v_base := public.generar_slug(new.nombre);
    v_slug := v_base;

    -- Buscar uno libre. Se ignora la propia fila al editar.
    while exists (
      select 1 from public.negocios
       where slug = v_slug and id <> new.id
    ) loop
      v_n := v_n + 1;
      v_slug := left(v_base, 76) || '-' || v_n;
    end loop;

    new.slug := v_slug;
  end if;

  return new;
end $$;

drop trigger if exists al_poner_slug_negocio on public.negocios;
create trigger al_poner_slug_negocio
  before insert or update of nombre, slug on public.negocios
  for each row execute function public.poner_slug_negocio();


-- ────────────────────────────────────────────────────────────────
-- 4) Fecha de edición
-- ────────────────────────────────────────────────────────────────
create or replace function public.actualizar_fecha_negocio()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists al_actualizar_negocio on public.negocios;
create trigger al_actualizar_negocio
  before update on public.negocios
  for each row execute function public.actualizar_fecha_negocio();



-- ────────────────────────────────────────────────────────────────
-- 5) Permisos de tabla (GRANT)
--    RLS filtra FILAS. GRANT da el permiso de TABLA. Hacen falta
--    los dos: sin GRANT, RLS ni siquiera se consulta.
-- ────────────────────────────────────────────────────────────────
grant select, insert, update on public.negocios to authenticated;
grant select on public.negocios to anon;   -- la app del cliente lee sin sesión
revoke delete on public.negocios from anon, authenticated;


-- ────────────────────────────────────────────────────────────────
-- 6) RLS
--    Regla: cada comercio solo crea y edita lo suyo.
-- ────────────────────────────────────────────────────────────────
alter table public.negocios enable row level security;

-- VER: el dueño ve lo suyo siempre; los demás solo lo activo.
drop policy if exists "Ver negocios activos o propios" on public.negocios;
create policy "Ver negocios activos o propios"
  on public.negocios for select
  to authenticated
  using (dueno_id = auth.uid() or estado = 'activo');

drop policy if exists "Ver negocios activos" on public.negocios;
create policy "Ver negocios activos"
  on public.negocios for select
  to anon
  using (estado = 'activo');

-- CREAR: solo a nombre propio.
drop policy if exists "Crear solo su negocio" on public.negocios;
create policy "Crear solo su negocio"
  on public.negocios for insert
  to authenticated
  with check (dueno_id = auth.uid());

-- EDITAR: solo el suyo.
drop policy if exists "Editar solo su negocio" on public.negocios;
create policy "Editar solo su negocio"
  on public.negocios for update
  to authenticated
  using (dueno_id = auth.uid())
  with check (dueno_id = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 7) Comprobación
--    Debe salir todo en OK. Si algo dice FALTA, avísame con la fila.
-- ────────────────────────────────────────────────────────────────
select 'enum categoria_negocio' as pieza,
       case when exists (select 1 from pg_type t join pg_namespace n
              on n.oid = t.typnamespace
              where n.nspname='public' and t.typname='categoria_negocio')
            then 'OK' else 'FALTA' end as estado
union all
select 'enum estado_negocio',
       case when exists (select 1 from pg_type t join pg_namespace n
              on n.oid = t.typnamespace
              where n.nspname='public' and t.typname='estado_negocio')
            then 'OK' else 'FALTA' end
union all
select 'tabla negocios',
       case when to_regclass('public.negocios') is not null
            then 'OK' else 'FALTA' end
union all
select 'RLS prendido',
       case when (select relrowsecurity from pg_class
                   where oid = to_regclass('public.negocios'))
            then 'OK' else 'FALTA' end
union all
select '4 políticas',
       case when (select count(*) from pg_policies
                   where schemaname='public' and tablename='negocios') >= 4
            then 'OK' else 'FALTA' end
union all
select 'trigger de slug',
       case when exists (select 1 from pg_trigger
                          where tgrelid = to_regclass('public.negocios')
                            and tgname = 'al_poner_slug_negocio')
            then 'OK' else 'FALTA' end
union all
select '9 categorías',
       case when (select count(*) from pg_enum e
                    join pg_type t on t.oid = e.enumtypid
                   where t.typname = 'categoria_negocio') = 9
            then 'OK' else 'FALTA' end
union all
select 'whatsapp 10 dígitos',
       case when exists (select 1 from pg_constraint
                          where conrelid = to_regclass('public.negocios')
                            and conname = 'whatsapp_formato'
                            and pg_get_constraintdef(oid) like '%{10}%')
            then 'OK' else 'FALTA' end;

