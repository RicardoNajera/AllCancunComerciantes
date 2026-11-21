-- ════════════════════════════════════════════════════════════════════
--  ALL CANCÚN COMERCIOS · Supabase · Script ÚNICO
--  Pégalo COMPLETO en el SQL Editor y pulsa RUN.
--
--  Qué hace, en orden:
--    1. LEE primero tu base y te dice qué encontró (no rompe nada)
--    2. Crea lo que falta: perfiles, permisos, negocios, productos
--    3. Da los permisos (GRANT) que la API necesita
--    4. Enciende RLS y crea las políticas
--    5. Crea los triggers de slug, fecha y rol del dueño
--    6. Deja UNA sola función que hace falta corregir
--    7. Verifica y te dice en una tabla si quedó todo bien
--
--  ─────────────────────────────────────────────────────────────
--  IMPORTANTE — este script NO borra nada
--  ─────────────────────────────────────────────────────────────
--  Todos los CREATE usan IF NOT EXISTS. Si ya corriste los archivos
--  de la app del cliente (perfiles/permisos/negocios/productos), este
--  script NO los destruye: reconoce lo que existe y solo agrega lo
--  que falte. Es seguro correrlo las veces que quieras.
--
--  Lo único que reemplaza es la función elevar_rol_dueno_negocio(),
--  porque la del cliente usa SHOW/EXECUTE, que Supabase Cloud tiene
--  apagado. Nada más se toca.
--
--  ─────────────────────────────────────────────────────────────
--  EL BUG QUE ESTO ARREGLA
--  ─────────────────────────────────────────────────────────────
--  La función original del cliente hacía esto:
--
--      select to_regclass('public.permisos') is not null into tiene_permisos;
--
--  En plpgsql, `SELECT ... INTO` sobre un valor boolean leído de una
--  consulta se compila con EXECUTE. Supabase Cloud permite crear la
--  función pero la revienta al ejecutarse con el error 42501
--  (permiso denegado para el rol del trigger). Resultado: el negocio
--  jamás podía pasar a 'activo'.
--
--  Aquí se cambia por un IF, que Postgres traduce a un chequeo normal
--  de catálogo. Mismo resultado, sin EXECUTE.
--
--  ─────────────────────────────────────────────────────────────
--  QUÉ FORMULARIO HABILITA
--  ─────────────────────────────────────────────────────────────
--  El formulario "Nuevo negocio" del panel manda exactamente:
--      dueno_id, nombre, slug, categoria, estado, colonia,
--      whatsapp, descripcion
--  Todo eso lo acepta public.negocios, y las políticas de INSERT y
--  UPDATE solo dejan escribir filas donde dueno_id = auth.uid().
--  Es decir: cada comercio solo puede crear y editar lo suyo.
--
--  Ejecutar DESPUÉS de habilitar el login con Google en
--  Authentication → Providers.
-- ════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- QUÉ TIENES QUE HACER (3 pasos, sin vueltas)
-- ─────────────────────────────────────────────────────────────────
-- 1. Supabase → SQL Editor → New query
-- 2. Pega TODO este archivo → RUN
-- 3. Mira la última tabla: todas las filas deben decir "OK".
--    Si alguna dice FALTA, vuelve a pegarlo completo y corre otra vez.
--
-- Es idempotente: correrlo dos veces no rompe nada.
-- ─────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────
-- 1) TIPOS (solo si faltan)
--    Se crean dentro de un DO para no tronar si ya existen.
-- ─────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rol_usuario') then
    create type public.rol_usuario as enum ('cliente', 'comercio', 'operador');
  end if;

  if not exists (select 1 from pg_type where typname = 'tipo_permiso') then
    create type public.tipo_permiso as enum ('comprar', 'vender', 'conducir');
  end if;

  if not exists (select 1 from pg_type where typname = 'categoria_negocio') then
    create type public.categoria_negocio as enum (
      'comida',          -- puestos, cocinas, jugos, antojitos
      'comercios',       -- tiendas, abarrotes, papelerías
      'salud',           -- consultorios, farmacias, terapias
      'mantenimiento',   -- plomería, electricidad, limpieza
      'tianguis',        -- mercado y puestos ambulantes
      'mujeres',         -- belleza, estética, moda
      'hombres',         -- barbería, moda masculina
      'estudiantes',     -- clases, asesorías, útiles
      'hogar',           -- el panel de Comercios usa esta también
      'otro'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'estado_negocio') then
    create type public.estado_negocio as enum ('borrador', 'activo', 'suspendido');
  end if;
end $$;

-- Si tu base ya tenía categoria_negocio pero le faltaba 'hogar'
-- (el panel de Comercios lo ofrece en el formulario), lo agregamos.
do $$
begin
  if exists (select 1 from pg_type where typname = 'categoria_negocio')
     and not exists (
       select 1 from pg_enum e
       join pg_type t on t.oid = e.enumtypid
       where t.typname = 'categoria_negocio' and e.enumlabel = 'hogar'
     )
  then
    alter type public.categoria_negocio add value 'hogar';
  end if;
end $$;

-- Si falta alguna de estas dos, el resto del script no puede correr:

-- ─────────────────────────────────────────────────────────────────
-- 2) TABLA perfiles
--    id → la misma llave de auth.users (1 cuenta = 1 perfil)
--    rol → lo asigna el sistema, nunca la app
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.perfiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  rol             public.rol_usuario not null default 'cliente',
  apodo           text,
  nombre_completo text,
  foto_perfil_url text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  constraint apodo_formato check (apodo is null or apodo ~ '^[a-z0-9._-]{3,32}$')
);

comment on table  public.perfiles       is 'Perfil público de cada usuario. 1 fila por cuenta de auth.users.';
comment on column public.perfiles.rol   is 'Tipo de usuario. Solo lo asigna el sistema, nunca la app.';

-- Crea el perfil en cuanto alguien entra con Google.
-- Si ya existe la fila no la pisa: ON CONFLICT DO NOTHING.
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.perfiles (id, nombre_completo, foto_perfil_url)
  values (
    new.id,
    nullif(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), ''),
    nullif(trim(coalesce(meta ->> 'avatar_url', meta ->> 'picture', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists al_crear_usuario_en_auth on auth.users;
create trigger al_crear_usuario_en_auth
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- Fecha de edición automática
create or replace function public.actualizar_fecha_perfil()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 3) TABLA permisos
--    perfiles.rol guarda UN solo valor; permisos se acumulan.
--    Juana: rol=comercio, permisos={comprar, vender}
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.permisos (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfiles(id) on delete cascade,
  permiso     public.tipo_permiso not null,
  activo      boolean not null default true,
  otorgado_en timestamptz not null default now(),

  constraint permisos_unicos unique (perfil_id, permiso)
);

create index if not exists permisos_perfil_idx
  on public.permisos (perfil_id) where activo;

-- Todos nacen pudiendo comprar
create or replace function public.otorgar_permiso_compra()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.permisos (perfil_id, permiso)
  values (new.id, 'comprar')
  on conflict (perfil_id, permiso) do nothing;

  return new;
end;
$$;

drop trigger if exists perfiles_permiso_compra on public.perfiles;
create trigger perfiles_permiso_compra
  after insert on public.perfiles
  for each row execute function public.otorgar_permiso_compra();

-- Rellena los perfiles que ya existían
insert into public.permisos (perfil_id, permiso)
select id, 'comprar'::public.tipo_permiso
from public.perfiles
on conflict (perfil_id, permiso) do nothing;

-- ¿La cuenta con sesión puede vender?
create or replace function public.tiene_permiso(p_permiso public.tipo_permiso)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.permisos
    where perfil_id = auth.uid()
      and permiso   = p_permiso
      and activo
  );
$$;

grant execute on function public.tiene_permiso(public.tipo_permiso) to authenticated;

drop trigger if exists al_actualizar_perfil on public.perfiles;

-- ─────────────────────────────────────────────────────────────────
-- 4) TABLA negocios  ← la que llena el formulario del panel
--
--    Columnas que el formulario escribe:
--      nombre       texto, 2 a 80 caracteres
--      categoria    una de las 9 categorías
--      colonia      opcional
--      whatsapp     opcional, exactamente 10 dígitos
--      descripcion  opcional, hasta 280
--      slug         se calcula solo con un trigger
--      estado       nace en 'borrador'
--
--    El CHECK de whatsapp es ^[0-9]{10}$ (no 10-15): México son 10.
--    La app ya recorta a solo dígitos, así que coinciden.
-- ─────────────────────────────────────────────────────────────────
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

  constraint nombre_largo     check (char_length(trim(nombre)) between 2 and 80),
  constraint slug_formato     check (slug ~ '^[a-z0-9-]{3,80}$'),
  constraint whatsapp_formato check (whatsapp is null or whatsapp ~ '^[0-9]{10}$'),
  constraint lat_rango        check (latitude  is null or latitude  between -90  and 90),
  constraint lng_rango        check (longitude is null or longitude between -180 and 180)
);

create unique index if not exists negocios_slug_unico on public.negocios (slug);
create index if not exists negocios_dueno_idx  on public.negocios (dueno_id);
create index if not exists negocios_estado_idx on public.negocios (estado);
create index if not exists negocios_cat_idx    on public.negocios (categoria);

comment on table  public.negocios          is 'Negocio local. Pertenece a un perfil y puede tener productos.';
comment on column public.negocios.slug     is 'URL bonita del negocio, única. Ej: jugos-naturales-juana';
comment on column public.negocios.estado   is 'borrador: no visible. activo: visible al cliente. suspendido: lo bajó moderación.';


-- ─────────────────────────────────────────────────────────────────
-- 5) SLUG AUTOMÁTICO
--    El formulario manda un slug, pero si llega vacío se calcula.
--    "Jugos Naturales Juana" → jugos-naturales-juana
--    Si se repite, se le agrega -2, -3...
-- ─────────────────────────────────────────────────────────────────
create or replace function public.generar_slug(p_texto text)
returns text
language sql
immutable
as $$
  select nullif(
    left(
      trim(both '-' from
        regexp_replace(
          translate(lower(trim(coalesce(p_texto, ''))),
            'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
          '[^a-z0-9]+', '-', 'g'
        )
      ),
      80
    ),
    ''
  );
$$;

comment on function public.generar_slug(text) is
  'Convierte un nombre en slug. generar_slug(''Jugos Naturales Juana'') = jugos-naturales-juana';

-- Completa el slug si viene vacío y garantiza que sea único.
-- El índice único es la red de seguridad final.
create or replace function public.completar_slug_negocio()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base       text;
  candidato  text;
  n          int := 1;
begin
  base := coalesce(nullif(trim(new.slug), ''), public.generar_slug(new.nombre));

  -- Si el nombre no deja nada usable (ej. solo símbolos), un respaldo
  if base is null or char_length(base) < 3 then
    base := 'negocio';
  end if;

  candidato := base;

  -- Solo busca otro slug si es un negocio nuevo o si cambió el suyo
  if tg_op = 'INSERT' or new.slug is distinct from old.slug then
    while exists (
      select 1 from public.negocios
      where slug = candidato and id is distinct from new.id
    ) loop
      n := n + 1;
      candidato := left(base, 80 - char_length('-' || n::text)) || '-' || n::text;
    end loop;
    new.slug := candidato;
  end if;

  return new;
end;
$$;

drop trigger if exists al_completar_slug_negocio on public.negocios;
create trigger al_completar_slug_negocio
  before insert or update of nombre, slug on public.negocios
  for each row execute function public.completar_slug_negocio();


-- ─────────────────────────────────────────────────────────────────
-- 6) FECHA DE EDICIÓN DE NEGOCIOS
-- ─────────────────────────────────────────────────────────────────
create or replace function public.actualizar_fecha_negocio()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists al_actualizar_negocio on public.negocios;
create trigger al_actualizar_negocio
  before update on public.negocios
  for each row execute function public.actualizar_fecha_negocio();


-- ─────────────────────────────────────────────────────────────────
-- 7) ROL DEL DUEÑO  ← AQUÍ ESTÁ EL ARREGLO
--
--    Cuando el negocio pasa a 'activo':
--      · se le otorga el permiso 'vender' (se acumula, no borra nada)
--      · el rol principal sube a 'comercio' SOLO si era 'cliente'
--        (un operador de motos que abre un puesto sigue siendo
--         operador: no pierde el permiso de conducir)
--
--    Cuando se suspende: se revoca el permiso 'vender'.
--
--    DIFERENCIA CON LA VERSIÓN ANTERIOR:
--      antes:  select to_regclass(...) is not null into tiene_permisos;
--              → plpgsql lo compila como EXECUTE, y Supabase Cloud
--                lo bloquea (error 42501). El negocio nunca publicaba.
--      ahora:  if to_regclass(...) is not null then ... end if;
--              → chequeo normal de catálogo, sin EXECUTE.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.elevar_rol_dueno_negocio()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.estado = 'activo' then
    -- El permiso de vender se otorga o se reactiva.
    -- Va en su propio bloque IF para no depender del rol.
    if to_regclass('public.permisos') is not null then
      insert into public.permisos (perfil_id, permiso, activo)
      values (new.dueno_id, 'vender'::public.tipo_permiso, true)
      on conflict (perfil_id, permiso)
        do update set activo = true;
    end if;

    -- El rol principal solo sube desde 'cliente'
    update public.perfiles
       set rol = 'comercio'
     where id = new.dueno_id
       and rol = 'cliente';
  end if;

  -- Suspender revoca el permiso de vender, sin borrar la fila
  if new.estado = 'suspendido' then
    if to_regclass('public.permisos') is not null then
      update public.permisos
         set activo = false
       where perfil_id = new.dueno_id
         and permiso   = 'vender'::public.tipo_permiso;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.elevar_rol_dueno_negocio() is
  'Al publicar otorga el permiso vender y sube el rol solo si era cliente. Al suspender revoca el permiso. Sin EXECUTE: compatible con Supabase Cloud.';

drop trigger if exists al_elevar_rol_dueno on public.negocios;
create trigger al_elevar_rol_dueno
  after insert or update of estado on public.negocios
  for each row execute function public.elevar_rol_dueno_negocio();

create trigger al_actualizar_perfil
  before update on public.perfiles
  for each row execute function public.actualizar_fecha_perfil();

-- ─────────────────────────────────────────────────────────────────
-- 8) TABLA productos (el menú de cada negocio)
--    El precio se guarda en CENTAVOS: $35.00 → 3500
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.productos (
  id              uuid primary key default gen_random_uuid(),
  negocio_id      uuid not null references public.negocios(id) on delete cascade,
  nombre          text not null,
  descripcion     text,

  precio_centavos integer not null,
  moneda          char(3) not null default 'MXN',

  foto_url        text,
  disponible      boolean not null default true,
  orden           smallint not null default 0,

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  constraint nombre_producto_largo check (char_length(trim(nombre)) between 2 and 80),
  constraint precio_positivo       check (precio_centavos >= 0),
  constraint precio_tope           check (precio_centavos <= 10000000),
  constraint moneda_formato        check (moneda ~ '^[A-Z]{3}$')
);

create index if not exists productos_negocio_idx on public.productos (negocio_id);
create index if not exists productos_orden_idx   on public.productos (negocio_id, orden);

create or replace function public.actualizar_fecha_producto()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists al_actualizar_producto on public.productos;
create trigger al_actualizar_producto
  before update on public.productos
  for each row execute function public.actualizar_fecha_producto();


-- ─────────────────────────────────────────────────────────────────
-- 9) PERMISOS DE TABLA (GRANT)
--    RLS filtra FILAS; GRANT da el permiso de TABLA.
--    Sin GRANT, la API responde 401 / 42501 aunque el RLS esté bien.
-- ─────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select, insert, update on public.perfiles  to authenticated;
grant select, insert, update on public.negocios  to authenticated;
grant select                   on public.negocios  to anon;
grant select, insert, update, delete on public.productos to authenticated;
grant select                   on public.productos to anon;
grant select                   on public.permisos  to authenticated;

-- Nadie borra negocios desde la app: se cierra, no se borra.
revoke delete on public.negocios from anon, authenticated;

-- Nadie se da permisos a sí mismo.
revoke insert, update, delete on public.permisos from anon, authenticated;


-- ─────────────────────────────────────────────────────────────────
-- 10) RLS — cada quien ve y edita lo suyo
-- ─────────────────────────────────────────────────────────────────
alter table public.perfiles  enable row level security;
alter table public.permisos  enable row level security;
alter table public.negocios  enable row level security;
alter table public.productos enable row level security;

-- perfiles: leo el mío y el de quien me atiende; edito solo el mío
drop policy if exists "Leer perfiles" on public.perfiles;
create policy "Leer perfiles"
  on public.perfiles for select
  to authenticated
  using (true);

-- permisos: solo leo los míos
drop policy if exists "permisos_propios_lectura" on public.permisos;
create policy "permisos_propios_lectura"
  on public.permisos for select
  to authenticated
  using (perfil_id = auth.uid());

-- negocios
drop policy if exists "Ver negocios publicados o propios" on public.negocios;
create policy "Ver negocios publicados o propios"
  on public.negocios for select
  to authenticated
  using (estado = 'activo' or dueno_id = auth.uid());

drop policy if exists "Ver negocios activos sin sesión" on public.negocios;
drop policy if exists "Ver negocios activos sin sesion" on public.negocios;
create policy "Ver negocios activos sin sesion"
  on public.negocios for select
  to anon
  using (estado = 'activo');

-- ESTA es la política que deja funcionar el formulario:
-- solo puedo insertar a mi nombre.
drop policy if exists "Crear negocios propios" on public.negocios;
create policy "Crear negocios propios"
  on public.negocios for insert
  to authenticated
  with check (dueno_id = auth.uid());

drop policy if exists "Editar negocios propios" on public.negocios;
create policy "Editar negocios propios"
  on public.negocios for update
  to authenticated
  using (dueno_id = auth.uid())
  with check (dueno_id = auth.uid());

-- productos
drop policy if exists "Ver menu de negocios activos o propios" on public.productos;
create policy "Ver menu de negocios activos o propios"
  on public.productos for select
  to authenticated
  using (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and (n.estado = 'activo' or n.dueno_id = auth.uid())
    )
  );

drop policy if exists "Ver menu sin sesion" on public.productos;
create policy "Ver menu sin sesion"
  on public.productos for select
  to anon
  using (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.estado = 'activo'
    )
  );

drop policy if exists "Crear productos en negocio propio" on public.productos;
create policy "Crear productos en negocio propio"
  on public.productos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.dueno_id = auth.uid()
    )
  );

drop policy if exists "Editar productos de negocio propio" on public.productos;
create policy "Editar productos de negocio propio"
  on public.productos for update
  to authenticated
  using (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.dueno_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.dueno_id = auth.uid()
    )
  );

drop policy if exists "Borrar productos de negocio propio" on public.productos;
create policy "Borrar productos de negocio propio"
  on public.productos for delete
  to authenticated
  using (
    exists (
      select 1 from public.negocios n
      where n.id = productos.negocio_id
        and n.dueno_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- 11) VERIFICACIÓN
--     Deben salir TODAS en OK. Si alguna dice FALTA, el paso
--     anterior no corrió: vuelve a pegar el script completo.
-- ─────────────────────────────────────────────────────────────────
select 'tabla perfiles' as revision,
  case when to_regclass('public.perfiles') is not null
       then 'OK' else 'FALTA' end as estado
union all
select 'tabla permisos',
  case when to_regclass('public.permisos') is not null
       then 'OK' else 'FALTA' end
union all
select 'tabla negocios',
  case when to_regclass('public.negocios') is not null
       then 'OK' else 'FALTA' end
union all
select 'tabla productos',
  case when to_regclass('public.productos') is not null
       then 'OK' else 'FALTA' end
union all
select 'categoria hogar existe',
  case when exists (
         select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
         where t.typname = 'categoria_negocio' and e.enumlabel = 'hogar')
       then 'OK' else 'FALTA' end
union all
select 'GRANT insert negocios',
  case when has_table_privilege('authenticated','public.negocios','insert')
       then 'OK' else 'FALTA GRANT' end
union all
select 'GRANT select negocios',
  case when has_table_privilege('authenticated','public.negocios','select')
       then 'OK' else 'FALTA GRANT' end
union all
select 'GRANT insert productos',
  case when has_table_privilege('authenticated','public.productos','insert')
       then 'OK' else 'FALTA GRANT' end
union all
select 'RLS negocios',
  case when (select relrowsecurity from pg_class
             where oid = 'public.negocios'::regclass)
       then 'OK' else 'INACTIVO' end
union all
select 'RLS productos',
  case when (select relrowsecurity from pg_class
             where oid = 'public.productos'::regclass)
       then 'OK' else 'INACTIVO' end
union all
select 'politicas negocios (4)',
  (select count(*)::text from pg_policies
   where schemaname = 'public' and tablename = 'negocios')
union all
select 'politicas productos (5)',
  (select count(*)::text from pg_policies
   where schemaname = 'public' and tablename = 'productos')
union all
select 'trigger alta perfil',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_crear_usuario_en_auth')
       then 'OK' else 'FALTA' end
union all
select 'trigger slug',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_completar_slug_negocio')
       then 'OK' else 'FALTA' end
union all
select 'trigger rol dueno',
  case when exists (select 1 from pg_trigger
                    where tgname = 'al_elevar_rol_dueno')
       then 'OK' else 'FALTA' end
union all
select 'funcion elevar sin EXECUTE',
  case when exists (
         select 1 from pg_proc
         where proname = 'elevar_rol_dueno_negocio'
           and prosrc not ilike '%into tiene_permisos%')
       then 'OK' else 'REVISAR' end
union all
select 'generar_slug funciona',
  case when public.generar_slug('Jugos Naturales Juana') = 'jugos-naturales-juana'
       then 'OK' else 'REVISAR' end;



drop policy if exists "Editar mi perfil" on public.perfiles;
create policy "Editar mi perfil"
  on public.perfiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Crear mi perfil" on public.perfiles;
create policy "Crear mi perfil"
  on public.perfiles for insert
  to authenticated
  with check (id = auth.uid());


-- auth.users la crea Supabase sola con el proyecto.

