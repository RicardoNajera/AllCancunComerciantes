-- ==========================================================================
-- All Cancún — Permisos de rol
--
-- Problema que resuelve:
--   perfiles.rol es UN solo valor. Una persona no puede ser 'cliente' y
--   'comercio' a la vez. Pero Juana quiere comprar con la misma cuenta con
--   la que vende. Con un solo enum eso es imposible sin duplicar cuentas.
--
-- Solución:
--   Tabla de permisos. La cuenta es una; los permisos se acumulan.
--
--     perfiles.rol      → rol "principal" para mostrar en la interfaz
--     perfiles.permisos → lo que de verdad puede hacer
--
--   Así Juana tiene rol='comercio' y permisos={vender, comprar}.
--   El conductor tiene rol='operador' y permisos={conducir, comprar}.
--
-- Ejecutar DESPUÉS de: perfiles.sql
-- ==========================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Tipo de permiso
-- --------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_permiso') then
    create type public.tipo_permiso as enum ('comprar', 'vender', 'conducir');
  end if;
end $$;

-- --------------------------------------------------------------------------
-- 2. Tabla de permisos
-- --------------------------------------------------------------------------

create table if not exists public.permisos (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfiles (id) on delete cascade,
  permiso     public.tipo_permiso not null,
  activo      boolean not null default true,
  otorgado_en timestamptz not null default now(),

  -- Un permiso no se repite por persona
  constraint permisos_unicos unique (perfil_id, permiso)
);

create index if not exists permisos_perfil_idx
  on public.permisos (perfil_id) where activo;

comment on table public.permisos is
  'Permisos acumulables por cuenta. Reemplaza la idea de un rol único.';
comment on column public.permisos.activo is
  'false = permiso revocado (ej. negocio suspendido). No se borra la fila.';

-- --------------------------------------------------------------------------
-- 3. Permiso base para todos
-- --------------------------------------------------------------------------

-- Toda cuenta nace pudiendo comprar. Es el permiso que no se revoca.
create or replace function public.otorgar_permiso_compra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.permisos (perfil_id, permiso)
  values (new.id, 'comprar')
  on conflict (perfil_id, permiso) do nothing;

  return new;
end $$;

drop trigger if exists perfiles_permiso_compra on public.perfiles;
create trigger perfiles_permiso_compra
  after insert on public.perfiles
  for each row execute function public.otorgar_permiso_compra();

-- Rellena los perfiles que ya existen
insert into public.permisos (perfil_id, permiso)
select id, 'comprar'::public.tipo_permiso
from public.perfiles
on conflict (perfil_id, permiso) do nothing;

-- --------------------------------------------------------------------------
-- 4. ¿Puede vender / conducir?
-- --------------------------------------------------------------------------

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

comment on function public.tiene_permiso(public.tipo_permiso) is
  'true si la cuenta con sesión tiene ese permiso activo.';

-- --------------------------------------------------------------------------
-- 5. RLS: cada quien ve sus permisos
-- --------------------------------------------------------------------------

alter table public.permisos enable row level security;

drop policy if exists "permisos_propios_lectura" on public.permisos;
create policy "permisos_propios_lectura"
  on public.permisos for select
  to authenticated
  using (perfil_id = auth.uid());

-- Solo el sistema otorga permisos (security definer), no el cliente.
-- No hay policy de insert/update/delete para authenticated: eso es
-- intencional. Si un cliente pudiera insertarse 'vender', el permiso
-- no valdría nada.

-- --------------------------------------------------------------------------
-- 6. Verificación
-- --------------------------------------------------------------------------

select
  'permisos'                        as objeto,
  count(*)::text                    as valor,
  'filas en la tabla'               as esperado
from public.permisos
union all
select 'perfiles con comprar',
       count(*)::text,
       'debe igualar total de perfiles'
from public.permisos where permiso = 'comprar'
union all
select 'perfiles totales',
       count(*)::text,
       'conteo de referencia'
from public.perfiles
union all
select 'trigger activo',
       count(*)::text,
       'debe ser 1'
from pg_trigger where tgname = 'perfiles_permiso_compra'
union all
select 'rls encendido',
       relrowsecurity::text,
       'debe ser true'
from pg_class where relname = 'permisos'
union all
select 'tiene_permiso()',
       count(*)::text,
       'debe ser 1'
from pg_proc where proname = 'tiene_permiso';

commit;
