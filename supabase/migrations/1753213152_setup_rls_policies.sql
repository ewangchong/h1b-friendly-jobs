-- Migration: setup_rls_policies
-- Created at: 1753213152

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE h1b_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies (users can only see/edit their own profile)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Companies policies (public read access)
CREATE POLICY "Companies are publicly readable" ON companies
    FOR SELECT USING (true);

-- Jobs policies (public read access)
CREATE POLICY "Jobs are publicly readable" ON jobs
    FOR SELECT USING (true);

-- H1B history policies (public read access)
CREATE POLICY "H1B history is publicly readable" ON h1b_history
    FOR SELECT USING (true);

-- Saved jobs policies (users can only see/manage their own saved jobs)
CREATE POLICY "Users can view own saved jobs" ON saved_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved jobs" ON saved_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs" ON saved_jobs
    FOR DELETE USING (auth.uid() = user_id);;