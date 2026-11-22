-- ════════════════════════════════════════════════════════════════
--  ALL CANCÚN · DIAGNÓSTICO DE TU BASE
--  NO crea, NO borra, NO modifica. Solo lee.
--  Supabase → SQL Editor → New query → pega TODO → RUN
-- ════════════════════════════════════════════════════════════════

select 'TABLA' as tipo, c.relname as objeto,
       case when c.relrowsecurity then 'RLS prendido' else 'RLS APAGADO' end
       || ' · ' || (select count(*) from pg_attribute a
             where a.attrelid = c.oid and a.attnum > 0
               and not a.attisdropped) || ' columnas'
       as detalle
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all

select 'COLUMNA',
       c.relname || '.' || a.attname,
       format_type(a.atttypid, a.atttypmod)
         || case when a.attnotnull then ' · obligatorio' else ' · opcional' end
         || coalesce(' · default ' || pg_get_expr(d.adbin, d.adrelid), '')
from pg_attribute a
join pg_class c     on c.oid = a.attrelid
join pg_namespace n on n.oid = c.relnamespace
left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
where n.nspname = 'public' and c.relkind = 'r'
  and a.attnum > 0 and not a.attisdropped

union all

select 'CHECK',
       c.relname || '.' || co.conname,
       pg_get_constraintdef(co.oid)
from pg_constraint co
join pg_class c     on c.oid = co.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and co.contype = 'c'

union all

select 'ENUM',
       t.typname,
       string_agg(e.enumlabel, ', ' order by e.enumsortorder)
from pg_type t
join pg_enum e      on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
group by t.typname

union all

select 'TRIGGER',
       c.relname || '.' || t.tgname,
       pg_get_triggerdef(t.oid)
from pg_trigger t
join pg_class c     on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal

union all

select 'FUNCION',
       p.proname,
       'regresa ' || pg_get_function_result(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'

union all

select 'POLITICA (' || p.cmd || ')',
       p.tablename || '.' || p.policyname,
       coalesce(p.roles::text, '')
from pg_policies p
where p.schemaname = 'public'

order by 1, 2;
