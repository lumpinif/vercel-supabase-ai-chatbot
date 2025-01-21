-- Create a table for public profile
create table if not exists public.profile (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  email VARCHAR(64) not null unique,
  full_name text,
  avatar_url text,
  website text,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profile
  enable row level security;

create policy "Public profiles are viewable by everyone." on profile
  for select using (true);

create policy "Users can insert their own profile." on profile
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profile
  for update using ((select auth.uid()) = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  insert into public.profile (id, email, full_name, avatar_url, created_at)
  values (
    new.id,
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    coalesce(NEW.created_at, now())
    )
  on conflict (id) do update
  set
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_users_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();