-- Define a custom type for the job status for better data integrity
create type job_status as enum ('queued', 'processing', 'completed', 'failed');

-- Create the syllabus_jobs table
create table public.syllabus_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    file_path text not null,
    status job_status default 'queued' not null,
    job_output jsonb,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add comments for clarity
comment on
table public.syllabus_jobs is 'Tracks the processing state of uploaded syllabi.';

comment on column public.syllabus_jobs.status is 'The current state of the processing job.';

-- Enable Row Level Security (RLS) on the table
alter table public.syllabus_jobs enable row level security;

-- Create RLS policies
create policy "Users can view their own syllabus jobs" on public.syllabus_jobs for
select using (auth.uid () = user_id);

create policy "Users can create syllabus jobs" on public.syllabus_jobs for
insert
with
    check (auth.uid () = user_id);