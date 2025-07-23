// Job Data Processor
// Processes scraped job data, applies NLP analysis, and saves to database

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RawJobData {
  title: string
  company: string
  location: string
  description: string
  salary?: string
  url: string
  posted_date?: string
  job_type?: string
  source: string
}

interface ProcessedJob {
  title: string
  company_name: string
  description: string
  requirements?: string
  salary_min?: number
  salary_max?: number
  salary_currency: string
  location: string
  city?: string
  state?: string
  country: string
  remote_friendly: boolean
  h1b_sponsorship_available: boolean
  h1b_sponsorship_confidence: number
  experience_level?: string
  job_type?: string
  industry?: string
  source_url: string
  posted_date?: string
  is_active: boolean
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { jobs, run_id } = await req.json()
    
    if (!jobs || !Array.isArray(jobs)) {
      throw new Error('Jobs array is required')
    }

    const processedJobs = []
    const errors = []
    let nlpAnalysisCount = 0
    
    for (const rawJob of jobs) {
      try {
        // Run NLP analysis
        const nlpResponse = await fetch(`${supabaseUrl}/functions/v1/nlp-h1b-classifier`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: rawJob.description,
            job_title: rawJob.title,
            company_name: rawJob.company
          })
        })

        let nlpResult = { confidence: 0.3, matched_keywords: [] }
        
        if (nlpResponse.ok) {
          const nlpData = await nlpResponse.json()
          nlpResult = nlpData.data
          nlpAnalysisCount++
        } else {
          console.warn('NLP analysis failed for job:', rawJob.title)
        }

        // Parse salary information
        let salaryMin, salaryMax
        if (rawJob.salary) {
          const salaryNumbers = rawJob.salary.match(/\$?([\d,]+)/g)
          if (salaryNumbers) {
            const nums = salaryNumbers.map(s => parseInt(s.replace(/[^\d]/g, '')))
            if (nums.length === 1) {
              salaryMin = nums[0]
            } else if (nums.length >= 2) {
              salaryMin = Math.min(...nums)
              salaryMax = Math.max(...nums)
            }
          }
        }

        // Parse location
        const locationParts = rawJob.location.split(',')
        let city, state, country = 'United States'
        
        if (locationParts.length >= 2) {
          city = locationParts[0].trim()
          state = locationParts[1].trim()
        } else {
          city = rawJob.location.trim()
        }

        // Detect remote work
        const remoteKeywords = ['remote', 'work from home', 'telecommute', 'distributed']
        const isRemote = remoteKeywords.some(keyword => 
          rawJob.title.toLowerCase().includes(keyword) || 
          rawJob.description.toLowerCase().includes(keyword) ||
          rawJob.location.toLowerCase().includes(keyword)
        )

        // Determine experience level
        let experienceLevel
        const description = rawJob.description.toLowerCase()
        if (description.includes('senior') || description.includes('lead') || description.includes('principal')) {
          experienceLevel = 'Senior'
        } else if (description.includes('junior') || description.includes('entry') || description.includes('new grad')) {
          experienceLevel = 'Entry'
        } else {
          experienceLevel = 'Mid'
        }

        // Determine industry based on job title and description
        let industry
        const title = rawJob.title.toLowerCase()
        if (title.includes('software') || title.includes('developer') || title.includes('engineer')) {
          industry = 'Technology'
        } else if (title.includes('data') || title.includes('analytics') || title.includes('scientist')) {
          industry = 'Data Science'
        } else if (title.includes('product') || title.includes('manager')) {
          industry = 'Product Management'
        } else if (title.includes('finance') || title.includes('financial')) {
          industry = 'Finance'
        } else {
          industry = 'Other'
        }

        // Check for duplicates based on title + company
        const { data: existingJobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('title', rawJob.title)
          .eq('company_name', rawJob.company)
          .limit(1)

        if (existingJobs && existingJobs.length > 0) {
          console.log(`Duplicate job found: ${rawJob.title} at ${rawJob.company}`)
          continue
        }

        // Find or create company
        let companyId
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('name', rawJob.company)
          .limit(1)

        if (existingCompany && existingCompany.length > 0) {
          companyId = existingCompany[0].id
        } else {
          // Create new company
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: rawJob.company,
              location: rawJob.location,
              city,
              state,
              country,
              h1b_sponsor_status: nlpResult.confidence > 0.6 ? 'Active' : 'Possible',
              industry
            })
            .select('id')
            .single()

          if (companyError) {
            console.error('Error creating company:', companyError)
            errors.push(`Failed to create company ${rawJob.company}: ${companyError.message}`)
            continue
          }
          
          companyId = newCompany.id
        }

        const processedJob: ProcessedJob = {
          title: rawJob.title,
          company_name: rawJob.company,
          description: rawJob.description,
          salary_min: salaryMin,
          salary_max: salaryMax,
          salary_currency: 'USD',
          location: rawJob.location,
          city,
          state,
          country,
          remote_friendly: isRemote,
          h1b_sponsorship_available: nlpResult.confidence > 0.6,
          h1b_sponsorship_confidence: nlpResult.confidence,
          experience_level: experienceLevel,
          job_type: rawJob.job_type || 'Full-time',
          industry,
          source_url: rawJob.url,
          posted_date: rawJob.posted_date || new Date().toISOString(),
          is_active: true
        }

        // Insert job into database
        const { data: insertedJob, error: jobError } = await supabase
          .from('jobs')
          .insert({
            ...processedJob,
            company_id: companyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (jobError) {
          errors.push(`Failed to insert job ${rawJob.title}: ${jobError.message}`)
          continue
        }

        processedJobs.push({
          ...processedJob,
          id: insertedJob.id,
          company_id: companyId
        })

      } catch (error) {
        errors.push(`Error processing job ${rawJob.title}: ${error.message}`)
      }
    }

    // Update scraping run status
    if (run_id) {
      await supabase
        .from('scraping_runs')
        .update({
          jobs_processed: jobs.length,
          jobs_saved: processedJobs.length,
          errors_count: errors.length,
          error_details: errors.length > 0 ? { errors } : null,
          status: errors.length === jobs.length ? 'failed' : 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', run_id)
    }

    return new Response(JSON.stringify({
      data: {
        processed_count: processedJobs.length,
        total_input: jobs.length,
        errors_count: errors.length,
        nlp_analysis_count: nlpAnalysisCount,
        errors: errors.slice(0, 10) // Limit error output
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Job processing error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'PROCESSING_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})