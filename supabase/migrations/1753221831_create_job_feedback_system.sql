-- Migration: create_job_feedback_system
-- Created at: 1753221831

-- Create job feedback system for user-driven quality improvement

-- Job feedback table to track user reports
CREATE TABLE IF NOT EXISTS job_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('not_h1b_friendly', 'incorrect_company', 'outdated', 'duplicate', 'inappropriate', 'positive')),
  confidence_before DECIMAL(3,2), -- H1B confidence before feedback
  reason TEXT,
  additional_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(user_id),
  resolution_notes TEXT,
  is_verified BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_feedback_job_id ON job_feedback(job_id);
CREATE INDEX IF NOT EXISTS idx_job_feedback_type ON job_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_job_feedback_created_at ON job_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_job_feedback_unresolved ON job_feedback(resolved_at) WHERE resolved_at IS NULL;

-- Job quality scores based on feedback
CREATE TABLE IF NOT EXISTS job_quality_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,
  h1b_accuracy_score DECIMAL(3,2) DEFAULT 1.00, -- Based on H1B feedback
  overall_quality_score DECIMAL(3,2) DEFAULT 1.00, -- Overall quality
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  needs_review BOOLEAN DEFAULT FALSE
);

-- Create index for quality scores
CREATE INDEX IF NOT EXISTS idx_job_quality_scores_job_id ON job_quality_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_job_quality_scores_needs_review ON job_quality_scores(needs_review) WHERE needs_review = TRUE;

-- Function to update quality scores when feedback is added
CREATE OR REPLACE FUNCTION update_job_quality_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update quality scores
  INSERT INTO job_quality_scores (job_id, positive_feedback_count, negative_feedback_count, h1b_accuracy_score, overall_quality_score, last_updated)
  VALUES (
    NEW.job_id,
    CASE WHEN NEW.feedback_type = 'positive' THEN 1 ELSE 0 END,
    CASE WHEN NEW.feedback_type != 'positive' THEN 1 ELSE 0 END,
    CASE WHEN NEW.feedback_type = 'not_h1b_friendly' THEN 0.5 ELSE 1.0 END,
    CASE WHEN NEW.feedback_type = 'positive' THEN 1.0 ELSE 0.8 END,
    NOW()
  )
  ON CONFLICT (job_id) DO UPDATE SET
    positive_feedback_count = job_quality_scores.positive_feedback_count + 
      CASE WHEN NEW.feedback_type = 'positive' THEN 1 ELSE 0 END,
    negative_feedback_count = job_quality_scores.negative_feedback_count + 
      CASE WHEN NEW.feedback_type != 'positive' THEN 1 ELSE 0 END,
    h1b_accuracy_score = GREATEST(0.1, 
      job_quality_scores.h1b_accuracy_score - 
      CASE WHEN NEW.feedback_type = 'not_h1b_friendly' THEN 0.2 ELSE 0 END
    ),
    overall_quality_score = GREATEST(0.1,
      (job_quality_scores.positive_feedback_count + CASE WHEN NEW.feedback_type = 'positive' THEN 1 ELSE 0 END) * 1.0 /
      GREATEST(1, job_quality_scores.positive_feedback_count + job_quality_scores.negative_feedback_count + 1)
    ),
    needs_review = CASE 
      WHEN job_quality_scores.negative_feedback_count + CASE WHEN NEW.feedback_type != 'positive' THEN 1 ELSE 0 END >= 3 THEN TRUE
      WHEN NEW.feedback_type = 'not_h1b_friendly' THEN TRUE
      ELSE job_quality_scores.needs_review
    END,
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update quality scores
DROP TRIGGER IF EXISTS trigger_update_job_quality_scores ON job_feedback;
CREATE TRIGGER trigger_update_job_quality_scores
  AFTER INSERT ON job_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_job_quality_scores();

-- Enable RLS
ALTER TABLE job_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_quality_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_feedback
CREATE POLICY "Anyone can read job feedback" ON job_feedback
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit feedback" ON job_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON job_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for job_quality_scores
CREATE POLICY "Anyone can read quality scores" ON job_quality_scores
  FOR SELECT USING (true);

-- Admin policies (assuming admins have a role)
CREATE POLICY "Admins can manage feedback" ON job_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND (
        email LIKE '%@h1bfriendly.com' OR 
        visa_status = 'admin'
      )
    )
  );

-- Insert initial quality scores for existing jobs
INSERT INTO job_quality_scores (job_id, h1b_accuracy_score, overall_quality_score)
SELECT id, 
       COALESCE(h1b_sponsorship_confidence, 1.0) as h1b_accuracy_score,
       CASE 
         WHEN h1b_sponsorship_confidence >= 0.8 THEN 1.0
         WHEN h1b_sponsorship_confidence >= 0.6 THEN 0.8
         ELSE 0.6
       END as overall_quality_score
FROM jobs 
WHERE NOT EXISTS (
  SELECT 1 FROM job_quality_scores WHERE job_quality_scores.job_id = jobs.id
);;