CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    job_id UUID NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);