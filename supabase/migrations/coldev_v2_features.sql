-- ColDev — second-wave features.
-- Run once in Supabase SQL Editor.

-- ── 1) Messages support image attachments
alter table messages add column if not exists image_url text;
-- Either text or image must be present (don't break existing rows).
alter table messages drop constraint if exists messages_has_payload;
alter table messages add constraint messages_has_payload
  check (
    (content is not null and char_length(content) > 0)
    or (image_url is not null and char_length(image_url) > 0)
  );

-- ── 2) Bookmarks (works for posts and forum threads)
create table if not exists bookmarks (
  user_id uuid references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'thread')),
  target_id uuid not null,
  created_at timestamptz default now(),
  primary key (user_id, target_type, target_id)
);
create index if not exists idx_bookmarks_user on bookmarks(user_id, created_at desc);

alter table bookmarks enable row level security;
drop policy if exists "Users read own bookmarks" on bookmarks;
create policy "Users read own bookmarks" on bookmarks
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users manage own bookmarks" on bookmarks;
create policy "Users manage own bookmarks" on bookmarks
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 3) Polls (attached to posts)
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid unique not null references posts(id) on delete cascade,
  question text not null check (char_length(question) <= 200),
  closes_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  position int not null,
  text text not null check (char_length(text) <= 80),
  votes_count int default 0
);
create index if not exists idx_poll_options_poll on poll_options(poll_id, position);

create table if not exists poll_votes (
  poll_id uuid references polls(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  option_id uuid references poll_options(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (poll_id, user_id)
);
create index if not exists idx_poll_votes_option on poll_votes(option_id);

alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;

drop policy if exists "Polls public read" on polls;
create policy "Polls public read" on polls for select using (true);
drop policy if exists "Poll options public read" on poll_options;
create policy "Poll options public read" on poll_options for select using (true);
drop policy if exists "Poll votes public read" on poll_votes;
create policy "Poll votes public read" on poll_votes for select using (true);

-- A poll is created by the post author; we accept any authenticated user as
-- long as they own the underlying post.
drop policy if exists "Owner creates poll" on polls;
create policy "Owner creates poll" on polls
  for insert to authenticated
  with check (exists (select 1 from posts p where p.id = post_id and p.user_id = auth.uid()));

drop policy if exists "Owner creates poll options" on poll_options;
create policy "Owner creates poll options" on poll_options
  for insert to authenticated
  with check (exists (
    select 1 from polls pl join posts p on p.id = pl.post_id
    where pl.id = poll_id and p.user_id = auth.uid()
  ));

drop policy if exists "Auth votes" on poll_votes;
create policy "Auth votes" on poll_votes
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Vote count trigger
create or replace function update_poll_option_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update poll_options set votes_count = votes_count + 1 where id = new.option_id;
  elsif TG_OP = 'DELETE' then
    update poll_options set votes_count = votes_count - 1 where id = old.option_id;
  elsif TG_OP = 'UPDATE' and new.option_id is distinct from old.option_id then
    update poll_options set votes_count = votes_count + 1 where id = new.option_id;
    update poll_options set votes_count = votes_count - 1 where id = old.option_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_poll_vote on poll_votes;
create trigger trg_poll_vote
  after insert or update or delete on poll_votes
  for each row execute function update_poll_option_count();

-- ── 4) RPC to create a post with a poll atomically
create or replace function create_post_with_poll(
  p_content text,
  p_language_tags int[],
  p_topic_tags int[],
  p_image_url text,
  p_poll_question text,
  p_poll_options text[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  caller uuid := auth.uid();
  new_post_id uuid;
  new_poll_id uuid;
  i int;
begin
  if caller is null then raise exception 'Not authenticated' using errcode = '42501'; end if;
  if p_content is null or char_length(p_content) = 0 then
    raise exception 'Content required' using errcode = '22023';
  end if;

  insert into posts (user_id, content, language_tags, topic_tags, image_url)
  values (caller, p_content, coalesce(p_language_tags, '{}'), coalesce(p_topic_tags, '{}'), p_image_url)
  returning id into new_post_id;

  if p_poll_question is not null and array_length(p_poll_options, 1) >= 2 then
    insert into polls (post_id, question) values (new_post_id, p_poll_question)
    returning id into new_poll_id;
    for i in 1..array_length(p_poll_options, 1) loop
      insert into poll_options (poll_id, position, text)
        values (new_poll_id, i, p_poll_options[i]);
    end loop;
  end if;

  return new_post_id;
end;
$$;

grant execute on function create_post_with_poll(text, int[], int[], text, text, text[]) to authenticated;

NOTIFY pgrst, 'reload schema';
