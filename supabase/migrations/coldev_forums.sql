-- ColDev — Foros (Reddit-style discussion threads, programming-only).
-- Run once in Supabase SQL Editor.

create table if not exists forums (
  id serial primary key,
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  color text default '#E87952',
  created_at timestamptz default now()
);

create table if not exists forum_threads (
  id uuid primary key default gen_random_uuid(),
  forum_id int references forums(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 200),
  content text not null check (char_length(content) <= 5000),
  score int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_forum_threads_forum_created on forum_threads(forum_id, created_at desc);
create index if not exists idx_forum_threads_user on forum_threads(user_id);

create table if not exists forum_thread_votes (
  thread_id uuid references forum_threads(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz default now(),
  primary key (thread_id, user_id)
);

create table if not exists forum_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references forum_threads(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 2000),
  created_at timestamptz default now()
);

create index if not exists idx_forum_comments_thread on forum_comments(thread_id, created_at);

-- ── RLS
alter table forums enable row level security;
alter table forum_threads enable row level security;
alter table forum_thread_votes enable row level security;
alter table forum_comments enable row level security;

drop policy if exists "Forums public read" on forums;
create policy "Forums public read" on forums for select using (true);

drop policy if exists "Threads public read" on forum_threads;
create policy "Threads public read" on forum_threads for select using (true);

drop policy if exists "Comments public read" on forum_comments;
create policy "Comments public read" on forum_comments for select using (true);

drop policy if exists "Votes public read" on forum_thread_votes;
create policy "Votes public read" on forum_thread_votes for select using (true);

drop policy if exists "Auth create thread" on forum_threads;
create policy "Auth create thread" on forum_threads
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Auth update own thread" on forum_threads;
create policy "Auth update own thread" on forum_threads
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Auth delete own thread" on forum_threads;
create policy "Auth delete own thread" on forum_threads
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Auth create comment" on forum_comments;
create policy "Auth create comment" on forum_comments
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Auth delete own comment" on forum_comments;
create policy "Auth delete own comment" on forum_comments
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Auth manage own vote" on forum_thread_votes;
create policy "Auth manage own vote" on forum_thread_votes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Score & comment count triggers
create or replace function update_thread_score()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update forum_threads set score = score + new.value where id = new.thread_id;
  elsif TG_OP = 'UPDATE' then
    update forum_threads set score = score + (new.value - old.value) where id = new.thread_id;
  elsif TG_OP = 'DELETE' then
    update forum_threads set score = score - old.value where id = old.thread_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_thread_vote on forum_thread_votes;
create trigger trg_thread_vote
  after insert or update or delete on forum_thread_votes
  for each row execute function update_thread_score();

create or replace function update_thread_comments_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update forum_threads set comments_count = comments_count + 1 where id = new.thread_id;
  elsif TG_OP = 'DELETE' then
    update forum_threads set comments_count = comments_count - 1 where id = old.thread_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_thread_comment on forum_comments;
create trigger trg_thread_comment
  after insert or delete on forum_comments
  for each row execute function update_thread_comments_count();

-- ── Seed forums (programming categories)
insert into forums (slug, name, description, icon, color) values
  ('general',   'General',   'Cualquier tema dev',                          '💬',  '#E87952'),
  ('frontend',  'Frontend',  'React, Vue, CSS, UI/UX',                       '🎨',  '#3178C6'),
  ('backend',   'Backend',   'APIs, bases de datos, server-side',            '⚙️', '#3776AB'),
  ('mobile',    'Mobile',    'iOS, Android, React Native, Flutter',          '📱',  '#7F52FF'),
  ('devops',    'DevOps',    'Docker, k8s, CI/CD, cloud',                    '🚀',  '#00ADD8'),
  ('ai-ml',     'AI / ML',   'Machine learning, IA, data science',           '🤖',  '#F4A847'),
  ('carrera',   'Carrera',   'Empleos, salarios, cómo crecer profesionalmente', '💼', '#8BA888'),
  ('ayuda',     'Ayuda',     'Tengo un problema, necesito ayuda',            '🆘',  '#CE422B'),
  ('proyectos', 'Proyectos', 'Comparte y busca colaboradores',               '🛠️', '#239120'),
  ('open-source','Open Source','Discusiones sobre OSS y contribuciones',      '🌐',  '#0FA968')
on conflict (slug) do nothing;

NOTIFY pgrst, 'reload schema';
