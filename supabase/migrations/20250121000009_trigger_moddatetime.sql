create extension if not exists moddatetime schema extensions;

-- assuming the table name is "todos", and a timestamp column "updated_at"
-- this trigger will set the "updated_at" column to the current timestamp for every update
create trigger
  handle_updated_at before update
on public.profile
for each row execute
  procedure moddatetime(updated_at);
  
create trigger
  handle_updated_at before update
on public.chat
for each row execute
  procedure moddatetime(updated_at);

create trigger
  handle_updated_at before update
on public.message
for each row execute
  procedure moddatetime(updated_at);

create trigger
  handle_updated_at before update
on public.document
for each row execute
  procedure moddatetime(updated_at);

create trigger
  handle_updated_at before update
on public.suggestion
for each row execute
  procedure moddatetime(updated_at);

create trigger
  handle_updated_at before update
on public.vote
for each row execute
  procedure moddatetime(updated_at);

create trigger
  handle_updated_at before update
on public.attachment
for each row execute
  procedure moddatetime(updated_at);