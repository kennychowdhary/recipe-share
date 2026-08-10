-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  cuisine text not null default '',
  course text not null default '',
  servings int not null default 1,
  prep_minutes int not null default 0,
  cook_minutes int not null default 0,
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  tags text[] not null default '{}',
  notes text not null default '',
  author text not null default ''
);

-- Wiki-style access: anyone can read, add, edit, and delete recipes. There is
-- no undo, so anyone with the site URL can remove a recipe permanently. Drop
-- the update and delete policies below to go back to read-and-add-only.
alter table recipes enable row level security;

create policy "public read" on recipes
  for select using (true);

create policy "public insert" on recipes
  for insert with check (true);

create policy "public update" on recipes
  for update using (true) with check (true);

create policy "public delete" on recipes
  for delete using (true);
