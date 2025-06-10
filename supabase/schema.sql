-- Enable RLS
alter table if exists public.sauces enable row level security;
alter table if exists public.ingredients enable row level security;
alter table if exists public.cooking_records enable row level security;

-- Create tables
create table if not exists public.sauces (
  id uuid default gen_random_uuid() primary key,
  name varchar(255) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.ingredients (
  id uuid default gen_random_uuid() primary key,
  sauce_id uuid references public.sauces(id) on delete cascade not null,
  name varchar(255) not null,
  amount decimal(5,2) not null default 0,
  unit varchar(50) not null default '큰술',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.cooking_records (
  id uuid default gen_random_uuid() primary key,
  sauce_id uuid references public.sauces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  photo_url text,
  notes text,
  rating integer check (rating >= 1 and rating <= 5),
  ingredient_amounts jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists sauces_user_id_idx on public.sauces(user_id);
create index if not exists ingredients_sauce_id_idx on public.ingredients(sauce_id);
create index if not exists cooking_records_sauce_id_idx on public.cooking_records(sauce_id);
create index if not exists cooking_records_user_id_idx on public.cooking_records(user_id);

-- RLS Policies
-- Sauces policies
create policy "Users can view their own sauces" on public.sauces
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sauces" on public.sauces
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sauces" on public.sauces
  for update using (auth.uid() = user_id);

create policy "Users can delete their own sauces" on public.sauces
  for delete using (auth.uid() = user_id);

-- Ingredients policies
create policy "Users can view ingredients for their sauces" on public.ingredients
  for select using (
    sauce_id in (
      select id from public.sauces where user_id = auth.uid()
    )
  );

create policy "Users can insert ingredients for their sauces" on public.ingredients
  for insert with check (
    sauce_id in (
      select id from public.sauces where user_id = auth.uid()
    )
  );

create policy "Users can update ingredients for their sauces" on public.ingredients
  for update using (
    sauce_id in (
      select id from public.sauces where user_id = auth.uid()
    )
  );

create policy "Users can delete ingredients for their sauces" on public.ingredients
  for delete using (
    sauce_id in (
      select id from public.sauces where user_id = auth.uid()
    )
  );

-- Cooking records policies
create policy "Users can view their own cooking records" on public.cooking_records
  for select using (auth.uid() = user_id);

create policy "Users can insert their own cooking records" on public.cooking_records
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own cooking records" on public.cooking_records
  for update using (auth.uid() = user_id);

create policy "Users can delete their own cooking records" on public.cooking_records
  for delete using (auth.uid() = user_id);