CREATE TABLE h1b_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    wage_rate_from INTEGER,
    wage_rate_to INTEGER,
    work_location VARCHAR(255),
    filing_year INTEGER NOT NULL,
    petition_type VARCHAR(50),
    case_status VARCHAR(50),
    decision_date DATE,
    data_source VARCHAR(100),
    naics_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);