-- Run this in your Supabase SQL editor

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  goal_amount numeric(12, 2) not null,
  end_date date not null,
  is_public boolean not null default false,
  created_at timestamptz default now()
);

-- Migration (run if table already exists):
-- alter table goals add column if not exists is_public boolean not null default false;

create table deposits (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade not null,
  amount numeric(12, 2) not null,
  note text,
  created_at timestamptz default now()
);

-- Row level security
alter table goals enable row level security;
alter table deposits enable row level security;

create policy "Users own their goals"
  on goals for all using (auth.uid() = user_id);

create policy "Users own deposits via goals"
  on deposits for all using (
    exists (select 1 from goals where goals.id = deposits.goal_id and goals.user_id = auth.uid())
  );

-- Public read access for shared goals
create policy "Public goals are readable by anyone"
  on goals for select using (is_public = true);

create policy "Public goal deposits are readable by anyone"
  on deposits for select using (
    exists (select 1 from goals where goals.id = deposits.goal_id and goals.is_public = true)
  );

-- Allows users to delete their own account from the client
create or replace function delete_user()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
