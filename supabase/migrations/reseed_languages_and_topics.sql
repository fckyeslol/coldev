-- ColDev — re-seed languages + topics y reestablecer FKs.
-- Síntoma: tablas vacías → joins en user_languages/user_interests devuelven null.
-- Idempotente: corrér múltiples veces es seguro.

-- ── 1) LANGUAGES (IDs explícitos que coinciden con el frontend)
insert into languages (id, name, icon, color) values
  (1,  'JavaScript', 'SiJavascript',  '#F7DF1E'),
  (2,  'TypeScript', 'SiTypescript',  '#3178C6'),
  (3,  'Python',     'SiPython',      '#3776AB'),
  (4,  'Java',       'SiJava',        '#ED8B00'),
  (5,  'Kotlin',     'SiKotlin',      '#7F52FF'),
  (6,  'Swift',      'SiSwift',       '#F05138'),
  (7,  'Go',         'SiGo',          '#00ADD8'),
  (8,  'Rust',       'SiRust',        '#CE422B'),
  (9,  'C#',         'SiCsharp',      '#239120'),
  (10, 'C++',        'SiCplusplus',   '#00599C'),
  (11, 'PHP',        'SiPhp',         '#777BB4'),
  (12, 'Ruby',       'SiRuby',        '#CC342D'),
  (13, 'Dart',       'SiDart',        '#0175C2'),
  (14, 'SQL',        'SiPostgresql',  '#336791'),
  (15, 'R',          'SiR',           '#276DC3'),
  (16, 'Scala',      'SiScala',       '#DC322F')
on conflict (id) do update set
  name  = excluded.name,
  icon  = excluded.icon,
  color = excluded.color;

-- Avanza la secuencia para que futuros inserts sin id no colisionen
select setval(pg_get_serial_sequence('languages', 'id'), greatest(16, (select coalesce(max(id), 1) from languages)));

-- ── 2) TOPICS
insert into topics (id, name, icon) values
  (1,  'Frontend',        '🎨'),
  (2,  'Backend',         '⚙️'),
  (3,  'Mobile',          '📱'),
  (4,  'DevOps',          '🚀'),
  (5,  'AI/ML',           '🤖'),
  (6,  'Seguridad',       '🔒'),
  (7,  'Blockchain',      '⛓️'),
  (8,  'Bases de Datos',  '🗄️'),
  (9,  'Cloud',           '☁️'),
  (10, 'Open Source',     '🌐'),
  (11, 'Juegos',          '🎮'),
  (12, 'Diseño UI/UX',    '✏️')
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon;

select setval(pg_get_serial_sequence('topics', 'id'), greatest(12, (select coalesce(max(id), 1) from topics)));

-- ── 3) Reestablecer FK constraints si faltan
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'user_languages'
      and constraint_type = 'FOREIGN KEY'
      and constraint_name = 'user_languages_language_id_fkey'
  ) then
    raise notice 'Re-creando FK user_languages.language_id → languages.id';
    alter table public.user_languages
      add constraint user_languages_language_id_fkey
      foreign key (language_id) references languages(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'user_interests'
      and constraint_type = 'FOREIGN KEY'
      and constraint_name = 'user_interests_topic_id_fkey'
  ) then
    raise notice 'Re-creando FK user_interests.topic_id → topics.id';
    alter table public.user_interests
      add constraint user_interests_topic_id_fkey
      foreign key (topic_id) references topics(id) on delete cascade;
  end if;
end $$;

-- ── 4) Refrescar PostgREST schema cache
NOTIFY pgrst, 'reload schema';
