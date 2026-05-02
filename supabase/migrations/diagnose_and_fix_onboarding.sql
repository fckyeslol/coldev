-- ColDev — diagnóstico y reparación post-migración de enums.
-- Síntoma: inserts a user_goals / user_interests / user_languages fallan
-- después de haber corrido `DROP TYPE goal CASCADE` u otros DROP TYPE
-- que pudieron eliminar columnas dependientes.
--
-- Este script:
--  1) Imprime el estado actual de columnas críticas
--  2) Recrea las que falten (con tipo text)
--  3) Asegura que las RLS policies cubren INSERT con WITH CHECK
--  4) Refresca el cache de PostgREST
--
-- Es idempotente — corrér múltiples veces no rompe nada.

-- ── 1) Diagnóstico
do $$
declare
  r record;
begin
  raise notice '── ColDev schema check ─────────────────────────';

  for r in
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'user_goals' and column_name in ('user_id','goal'))
        or (table_name = 'user_interests' and column_name in ('user_id','topic_id'))
        or (table_name = 'user_languages' and column_name in ('user_id','language_id','proficiency'))
        or (table_name = 'profiles' and column_name = 'level')
      )
    order by table_name, column_name
  loop
    raise notice '  % . % :: %', r.table_name, r.column_name, r.data_type;
  end loop;
end $$;

-- ── 2) Reparación: recrear columnas faltantes como text
-- user_goals.goal
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='user_goals' and column_name='goal'
  ) then
    raise notice 'Re-creando user_goals.goal (text)';
    alter table public.user_goals add column goal text;
    -- la PK era (user_id, goal); restablecerla
    begin
      alter table public.user_goals drop constraint if exists user_goals_pkey;
      alter table public.user_goals add primary key (user_id, goal);
    exception when others then
      raise notice '  pkey ya existía o no se pudo recrear: %', SQLERRM;
    end;
  end if;
end $$;

-- profiles.level
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='level'
  ) then
    raise notice 'Re-creando profiles.level (text)';
    alter table public.profiles add column level text default 'junior';
  end if;
end $$;

-- user_languages.proficiency
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='user_languages' and column_name='proficiency'
  ) then
    raise notice 'Re-creando user_languages.proficiency (text)';
    alter table public.user_languages add column proficiency text default 'aprendiendo';
  end if;
end $$;

-- ── 3) Asegurar RLS policies con WITH CHECK explícito para INSERT.
-- El short-cut "for all using (...)" cubre INSERT pero algunos clientes
-- de Postgres no propagan WITH CHECK por sí solos. Lo aseguramos.

drop policy if exists "Users manage own goals" on user_goals;
create policy "Users manage own goals" on user_goals
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own interests" on user_interests;
create policy "Users manage own interests" on user_interests
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own languages" on user_languages;
create policy "Users manage own languages" on user_languages
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Lectura pública (necesario para que el perfil de cualquier usuario muestre sus datos)
drop policy if exists "User goals public" on user_goals;
create policy "User goals public" on user_goals for select using (true);

drop policy if exists "User interests public" on user_interests;
create policy "User interests public" on user_interests for select using (true);

drop policy if exists "User languages public" on user_languages;
create policy "User languages public" on user_languages for select using (true);

-- ── 4) Refrescar el cache de PostgREST para que la API vea los cambios
NOTIFY pgrst, 'reload schema';
