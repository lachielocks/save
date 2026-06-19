-- Run this in your Supabase SQL editor

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  goal_amount numeric(12, 2) not null,
  end_date date not null,
  created_at timestamptz default now()
);

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
