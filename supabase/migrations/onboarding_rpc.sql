-- ColDev — RPC atómica de onboarding.
-- El cliente llama esta función en lugar de hacer 3 inserts; corre como
-- security definer así no depende de las policies WITH CHECK de cada tabla.
-- Sólo se permite que el usuario autenticado escriba sus propios datos.

create or replace function complete_onboarding(
  p_username text,
  p_full_name text,
  p_city text,
  p_level text,
  p_bio text,
  p_languages jsonb,    -- [{ language_id: int, proficiency: text }]
  p_goals text[],
  p_interests int[]
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  lang_row jsonb;
begin
  if caller is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Profile (upsert in case it already exists)
  insert into profiles (id, username, full_name, city, bio, level)
  values (caller, p_username, p_full_name, p_city, p_bio, p_level)
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    city = excluded.city,
    bio = excluded.bio,
    level = excluded.level,
    updated_at = now();

  -- Replace languages
  delete from user_languages where user_id = caller;
  if p_languages is not null and jsonb_array_length(p_languages) > 0 then
    for lang_row in select * from jsonb_array_elements(p_languages)
    loop
      insert into user_languages (user_id, language_id, proficiency)
      values (
        caller,
        (lang_row->>'language_id')::int,
        coalesce(lang_row->>'proficiency', 'aprendiendo')
      );
    end loop;
  end if;

  -- Replace goals
  delete from user_goals where user_id = caller;
  if p_goals is not null and array_length(p_goals, 1) > 0 then
    insert into user_goals (user_id, goal)
    select caller, unnest(p_goals);
  end if;

  -- Replace interests
  delete from user_interests where user_id = caller;
  if p_interests is not null and array_length(p_interests, 1) > 0 then
    insert into user_interests (user_id, topic_id)
    select caller, unnest(p_interests);
  end if;
end;
$$;

grant execute on function complete_onboarding(
  text, text, text, text, text, jsonb, text[], int[]
) to authenticated;

NOTIFY pgrst, 'reload schema';
