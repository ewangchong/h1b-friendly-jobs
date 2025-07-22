-- Migration: create_scraping_infrastructure
-- Created at: 1753219628

-- Create scraping management tables

-- Table to track scraping sources and their status
CREATE TABLE job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  base_url TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'indeed', 'linkedin', 'glassdoor', 'h1b_board'
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  scraping_frequency_hours INTEGER DEFAULT 24,
  rate_limit_delay_ms INTEGER DEFAULT 2000,
  max_pages_per_run INTEGER DEFAULT 10,
  search_keywords TEXT[] DEFAULT ARRAY['h1b', 'visa sponsorship', 'will sponsor'],
  robots_txt_url TEXT,
  user_agent TEXT DEFAULT 'H1BJobsBot/1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track individual scraping runs
CREATE TABLE scraping_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES job_sources(id),
  run_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual', 'retry'
  status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  jobs_found INTEGER DEFAULT 0,
  jobs_processed INTEGER DEFAULT 0,
  jobs_saved INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  execution_time_ms INTEGER,
  pages_scraped INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store raw scraped job data before processing
CREATE TABLE scraped_jobs_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES scraping_runs(id),
  source_id UUID REFERENCES job_sources(id),
  external_job_id VARCHAR(255),
  raw_data JSONB NOT NULL,
  url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  processing_errors TEXT[],
  h1b_confidence_score DECIMAL(3,2) -- NLP calculated confidence
);

-- Table to track job deduplication
CREATE TABLE job_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  duplicate_job_id UUID REFERENCES jobs(id),
  similarity_score DECIMAL(3,2),
  dedup_method VARCHAR(50), -- 'title_company', 'url', 'description_similarity'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for H1B keyword patterns and weights
CREATE TABLE h1b_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  category VARCHAR(50), -- 'explicit', 'implicit', 'negative'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for scraping configuration and settings
CREATE TABLE scraping_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default H1B keywords
INSERT INTO h1b_keywords (keyword, weight, category) VALUES
('h1b sponsorship', 1.0, 'explicit'),
('visa sponsorship', 0.9, 'explicit'),
('will sponsor h1b', 1.0, 'explicit'),
('h1b visa', 0.8, 'explicit'),
('work authorization', 0.6, 'implicit'),
('sponsor visa', 0.8, 'explicit'),
('immigration sponsorship', 0.9, 'explicit'),
('will sponsor work visa', 0.9, 'explicit'),
('h1b friendly', 1.0, 'explicit'),
('open to visa sponsorship', 0.8, 'explicit'),
('no sponsorship', -1.0, 'negative'),
('us citizens only', -1.0, 'negative'),
('no visa sponsorship', -1.0, 'negative'),
('must be authorized to work', -0.3, 'negative');

-- Insert default job sources
INSERT INTO job_sources (name, base_url, source_type, search_keywords) VALUES
('Indeed', 'https://www.indeed.com', 'indeed', ARRAY['h1b sponsorship', 'visa sponsorship', 'will sponsor']),
('H1B Grader', 'https://h1bgrader.com', 'h1b_board', ARRAY['h1b', 'software engineer', 'data scientist']),
('MyVisaJobs', 'https://www.myvisajobs.com', 'h1b_board', ARRAY['h1b jobs', 'visa sponsorship']);

-- Insert default configuration
INSERT INTO scraping_config (config_key, config_value, description) VALUES
('nlp_threshold', '0.6', 'Minimum confidence score for H1B job classification'),
('max_job_age_days', '30', 'Maximum age of jobs to scrape in days'),
('deduplication_enabled', 'true', 'Whether to enable job deduplication'),
('notification_emails', '[]', 'Email addresses for scraping notifications');

-- Create indexes for performance
CREATE INDEX idx_scraping_runs_source_status ON scraping_runs(source_id, status);
CREATE INDEX idx_scraped_jobs_raw_processed ON scraped_jobs_raw(processed, scraped_at);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX idx_jobs_h1b_sponsorship ON jobs(h1b_sponsorship_available, h1b_sponsorship_confidence);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for auto-updating timestamps
CREATE TRIGGER update_job_sources_updated_at BEFORE UPDATE ON job_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scraping_config_updated_at BEFORE UPDATE ON scraping_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;