-- DevLinks Colombia — Database Schema

-- Enums
create type user_level as enum ('aprendiendo', 'junior', 'mid', 'senior', 'experto');
create type proficiency as enum ('aprendiendo', 'cómodo', 'experto');
create type goal as enum ('mentoring_dar', 'mentoring_recibir', 'colaborar', 'networking', 'aprender_juntos', 'conseguir_trabajo', 'contratar');
create type city as enum ('Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'otra');

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  avatar_url text,
  bio text,
  city city default 'Bogotá',
  level user_level default 'junior',
  github_url text,
  linkedin_url text,
  website_url text,
  is_open_to_connect boolean default true,
  activity_score int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Languages
create table languages (
  id serial primary key,
  name text unique not null,
  icon text not null,
  color text not null
);

-- User languages (stack)
create table user_languages (
  user_id uuid references profiles(id) on delete cascade,
  language_id int references languages(id) on delete cascade,
  proficiency proficiency default 'aprendiendo',
  primary key (user_id, language_id)
);

-- User goals (what they're looking for)
create table user_goals (
  user_id uuid references profiles(id) on delete cascade,
  goal goal not null,
  primary key (user_id, goal)
);

-- Interest topics
create table topics (
  id serial primary key,
  name text unique not null,
  icon text
);

-- User interests
create table user_interests (
  user_id uuid references profiles(id) on delete cascade,
  topic_id int references topics(id) on delete cascade,
  primary key (user_id, topic_id)
);

-- Posts (X-like feed)
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 280),
  image_url text,
  language_tags int[] default '{}',
  topic_tags int[] default '{}',
  likes_count int default 0,
  reposts_count int default 0,
  replies_count int default 0,
  parent_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now()
);

-- Likes
create table post_likes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- Reposts
create table post_reposts (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- Follows
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- Match scores cache (updated by algorithm)
create table match_scores (
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  score numeric(5,2) not null,
  language_score numeric(5,2) default 0,
  goal_score numeric(5,2) default 0,
  interest_score numeric(5,2) default 0,
  updated_at timestamptz default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete cascade,
  type text not null, -- 'like', 'follow', 'repost', 'reply', 'match'
  post_id uuid references posts(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);

-- Seed: Languages
insert into languages (name, icon, color) values
  ('JavaScript', 'SiJavascript', '#F7DF1E'),
  ('TypeScript', 'SiTypescript', '#3178C6'),
  ('Python', 'SiPython', '#3776AB'),
  ('Java', 'SiJava', '#ED8B00'),
  ('Kotlin', 'SiKotlin', '#7F52FF'),
  ('Swift', 'SiSwift', '#F05138'),
  ('Go', 'SiGo', '#00ADD8'),
  ('Rust', 'SiRust', '#CE422B'),
  ('C#', 'SiCsharp', '#239120'),
  ('C++', 'SiCplusplus', '#00599C'),
  ('PHP', 'SiPhp', '#777BB4'),
  ('Ruby', 'SiRuby', '#CC342D'),
  ('Dart', 'SiDart', '#0175C2'),
  ('SQL', 'SiPostgresql', '#336791'),
  ('R', 'SiR', '#276DC3'),
  ('Scala', 'SiScala', '#DC322F');

-- Seed: Topics
insert into topics (name, icon) values
  ('Frontend', '🎨'),
  ('Backend', '⚙️'),
  ('Mobile', '📱'),
  ('DevOps', '🚀'),
  ('AI/ML', '🤖'),
  ('Seguridad', '🔒'),
  ('Blockchain', '⛓️'),
  ('Bases de Datos', '🗄️'),
  ('Cloud', '☁️'),
  ('Open Source', '🌐'),
  ('Juegos', '🎮'),
  ('Diseño UI/UX', '✏️');

-- RLS Policies
alter table profiles enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_reposts enable row level security;
alter table follows enable row level security;
alter table user_languages enable row level security;
alter table user_goals enable row level security;
alter table user_interests enable row level security;
alter table match_scores enable row level security;
alter table notifications enable row level security;

-- Public read for profiles, posts
create policy "Profiles are public" on profiles for select using (true);
create policy "Posts are public" on posts for select using (true);
create policy "Likes are public" on post_likes for select using (true);
create policy "Follows are public" on follows for select using (true);
create policy "User languages public" on user_languages for select using (true);
create policy "User goals public" on user_goals for select using (true);
create policy "User interests public" on user_interests for select using (true);
create policy "Match scores public" on match_scores for select using (true);

-- Authenticated write
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users create posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users delete own posts" on posts for delete using (auth.uid() = user_id);
create policy "Users manage likes" on post_likes for all using (auth.uid() = user_id);
create policy "Users manage reposts" on post_reposts for all using (auth.uid() = user_id);
create policy "Users manage follows" on follows for all using (auth.uid() = follower_id);
create policy "Users manage own languages" on user_languages for all using (auth.uid() = user_id);
create policy "Users manage own goals" on user_goals for all using (auth.uid() = user_id);
create policy "Users manage own interests" on user_interests for all using (auth.uid() = user_id);
create policy "Users read own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on notifications for update using (auth.uid() = user_id);

-- Update activity_score on new post
create or replace function update_activity_score()
returns trigger as $$
begin
  update profiles set activity_score = activity_score + 10 where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_post_created
  after insert on posts
  for each row execute procedure update_activity_score();

-- Update likes count
create or replace function update_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
    update profiles set activity_score = activity_score + 2 where id = (select user_id from posts where id = new.post_id);
  elsif TG_OP = 'DELETE' then
    update posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on post_likes
  for each row execute procedure update_likes_count();

-- Update follows score
create or replace function update_follow_score()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set activity_score = activity_score + 5 where id = new.following_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_follow
  after insert on follows
  for each row execute procedure update_follow_score();
