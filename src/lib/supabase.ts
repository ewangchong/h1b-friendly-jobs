import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  user_id: string
  email: string
  full_name?: string
  location?: string
  experience_level?: string
  preferred_industries?: string[]
  visa_status?: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  logo_url?: string
  website_url?: string
  description?: string
  industry?: string
  size_category?: string
  location?: string
  city?: string
  state?: string
  country?: string
  h1b_sponsor_status?: string
  total_h1b_petitions?: number
  total_h1b_approvals?: number
  approval_rate?: number
  last_h1b_filing_year?: number
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  title: string
  company_id?: string
  company_name: string
  description?: string
  requirements?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  location?: string
  city?: string
  state?: string
  country?: string
  remote_friendly?: boolean
  h1b_sponsorship_available?: boolean
  h1b_sponsorship_confidence?: number
  experience_level?: string
  job_type?: string
  industry?: string
  source_url?: string
  posted_date?: string
  expires_date?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface SavedJob {
  id: string
  user_id: string
  job_id: string
  saved_at: string
  notes?: string
}

export interface H1BHistory {
  id: string
  company_id?: string
  company_name: string
  job_title?: string
  wage_rate_from?: number
  wage_rate_to?: number
  work_location?: string
  filing_year: number
  petition_type?: string
  case_status?: string
  decision_date?: string
  data_source?: string
  naics_code?: string
  created_at: string
}