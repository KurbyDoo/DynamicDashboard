-- Step 1: Rename the old enum to a temporary name
alter type job_status rename to job_status_old;

-- Step 2: Create the new enum with the desired values
create type job_status as enum ('unstarted', 'processing', 'completed', 'failed');

-- Step 3: Drop the existing default before altering the column
alter table public.syllabus_jobs alter column status drop default;

-- Step 4: Alter the column TYPE, migrating the existing data
-- This command reads the old value and converts it to the new type.
alter table public.syllabus_jobs
alter column status type job_status using (
    case status::text
        when 'queued' then 'unstarted'      -- Queued jobs become ready to start
        when 'processing' then 'processing'  -- This case may not exist yet, but is safe to include
        when 'completed' then 'completed'    -- Keep completed as-is
        when 'failed' then 'failed'          -- Keep failed as-is
        else 'unstarted'                     -- Fallback for any unexpected values
    end
)::job_status;

-- Step 5: Set the new default value for the column
alter table public.syllabus_jobs
alter column status
set default 'unstarted';

-- Step 5: Drop the old enum type now that it's no longer in use
drop type job_status_old;

-- Step 6: Update comments for clarity
comment on column public.syllabus_jobs.status is 'The current state of the processing job: unstarted, processing, completed, or failed.';