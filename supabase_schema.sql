-- Create a table for user progress
create table
  public.user_progress (
    id uuid not null default gen_random_uuid (),
    user_id text not null,
    completed_tasks jsonb null default '{}'::jsonb,
    completed_days jsonb null default '[]'::jsonb,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone null,
    constraint user_progress_pkey primary key (id),
    constraint user_progress_user_id_key unique (user_id)
  ) tablespace pg_default;

-- Create an RLS policy if needed, but for public anon tracking we can just enable it with a permissive policy
-- Or since it's just a personal learning app, might not be necessary if RLS is disabled.
-- We will assume standard config where we can just select/insert/update by user_id
