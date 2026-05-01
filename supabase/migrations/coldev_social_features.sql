-- ColDev — DM/Inbox tables.
-- Run once in Supabase SQL Editor.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table if not exists conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 2000),
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation_created
  on messages (conversation_id, created_at desc);
create index if not exists idx_participants_user
  on conversation_participants (user_id);

alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

-- ── Helper: is the current user a participant of this conversation?
create or replace function is_conversation_participant(conv_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = conv_id and user_id = auth.uid()
  );
$$;

-- ── conversations RLS
drop policy if exists "Participants read conversation" on conversations;
create policy "Participants read conversation"
  on conversations for select
  to authenticated
  using (is_conversation_participant(id));

drop policy if exists "Authenticated create conversation" on conversations;
create policy "Authenticated create conversation"
  on conversations for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "Participants update conversation" on conversations;
create policy "Participants update conversation"
  on conversations for update
  to authenticated
  using (is_conversation_participant(id));

-- ── conversation_participants RLS
drop policy if exists "Participants read participants" on conversation_participants;
create policy "Participants read participants"
  on conversation_participants for select
  to authenticated
  using (is_conversation_participant(conversation_id));

drop policy if exists "Self join conversation" on conversation_participants;
create policy "Self join conversation"
  on conversation_participants for insert
  to authenticated
  with check (auth.uid() = user_id or is_conversation_participant(conversation_id));

drop policy if exists "Self update participant row" on conversation_participants;
create policy "Self update participant row"
  on conversation_participants for update
  to authenticated
  using (auth.uid() = user_id);

-- ── messages RLS
drop policy if exists "Participants read messages" on messages;
create policy "Participants read messages"
  on messages for select
  to authenticated
  using (is_conversation_participant(conversation_id));

drop policy if exists "Sender writes messages" on messages;
create policy "Sender writes messages"
  on messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id and is_conversation_participant(conversation_id)
  );

-- Bump conversations.last_message_at on every new message.
create or replace function bump_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_messages_bump_conversation on messages;
create trigger trg_messages_bump_conversation
  after insert on messages
  for each row execute function bump_conversation_last_message();

NOTIFY pgrst, 'reload schema';
