-- ColDev — Atomic DM creation, bypassing the participant-not-yet-inserted race.
-- Run once in Supabase SQL Editor.

create or replace function start_or_get_dm(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  existing_id uuid;
  new_id uuid;
begin
  if caller is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if caller = target_user_id then
    raise exception 'Cannot DM yourself' using errcode = '22023';
  end if;
  if not exists (select 1 from profiles where id = target_user_id) then
    raise exception 'Target user not found' using errcode = '22023';
  end if;

  -- Connection check: at least one direction in follows.
  if not exists (
    select 1 from follows
    where (follower_id = caller and following_id = target_user_id)
       or (follower_id = target_user_id and following_id = caller)
  ) then
    raise exception 'Solo puedes mensajear a devs con los que ya estás conectado'
      using errcode = '42501';
  end if;

  -- Existing 1:1?
  select cp1.conversation_id into existing_id
  from conversation_participants cp1
  join conversation_participants cp2
    on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = caller and cp2.user_id = target_user_id
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  -- Create
  insert into conversations (created_by) values (caller) returning id into new_id;
  insert into conversation_participants (conversation_id, user_id)
    values (new_id, caller), (new_id, target_user_id);

  return new_id;
end;
$$;

grant execute on function start_or_get_dm(uuid) to authenticated;

NOTIFY pgrst, 'reload schema';
