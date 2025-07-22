// Scraping Orchestrator - Updated with MyVisaJobs and Enhanced Error Handling
// Main function that coordinates the entire scraping pipeline

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ScrapingSource {
  id: string
  name: string
  source_type: string
  is_active: boolean
  last_scraped_at?: string
  scraping_frequency_hours: number
  search_keywords: string[]
  rate_limit_delay_ms: number
  max_pages_per_run: number
}

interface OrchestrationResult {
  runs_executed: number
  total_jobs_scraped: number
  total_jobs_processed: number
  errors: string[]
  sources_processed: string[]
  execution_time_ms: number
  robots_compliance_summary: any[]
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

  const startTime = Date.now()
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Log which key we're using for debugging
    console.log('Using Supabase key type:', supabaseKey.includes('service_role') ? 'service_role' : 'anon')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { force_run = false, source_ids = [] } = await req.json()

    // Get active scraping sources
    let sourcesQuery = supabase
      .from('job_sources')
      .select('*')
      .eq('is_active', true)

    if (source_ids.length > 0) {
      sourcesQuery = sourcesQuery.in('id', source_ids)
    }

    const { data: sources, error: sourcesError } = await sourcesQuery

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`)
    }

    const errors: string[] = []
    const sourcesProcessed: string[] = []
    const robotsComplianceSummary: any[] = []
    let totalJobsScraped = 0
    let totalJobsProcessed = 0
    let runsExecuted = 0

    console.log(`Found ${sources?.length || 0} active sources to process`)

    for (const source of sources || []) {
      try {
        // Check if source needs scraping
        if (!force_run && source.last_scraped_at) {
          const lastScraped = new Date(source.last_scraped_at)
          const hoursSinceLastScrape = (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceLastScrape < source.scraping_frequency_hours) {
            console.log(`Skipping ${source.name}: last scraped ${hoursSinceLastScrape.toFixed(1)} hours ago`)
            continue
          }
        }

        console.log(`Starting scraping run for ${source.name} (${source.source_type})`)

        // Create scraping run record
        const { data: run, error: runError } = await supabase
          .from('scraping_runs')
          .insert({
            source_id: source.id,
            run_type: force_run ? 'manual' : 'scheduled',
            status: 'running'
          })
          .select('id')
          .single()

        if (runError) {
          errors.push(`Failed to create run for ${source.name}: ${runError.message}`)
          continue
        }

        const runId = run.id
        runsExecuted++

        try {
          // Execute scraping based on source type
          let scrapingResult
          
          if (source.source_type === 'indeed') {
            console.log(`Calling Indeed scraper for ${source.name}`)
            const response = await fetch(`${supabaseUrl}/functions/v1/indeed-scraper`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                keywords: source.search_keywords,
                max_pages: source.max_pages_per_run,
                respect_robots: true
              })
            })

            if (response.ok) {
              const data = await response.json()
              scrapingResult = data.data
              
              if (scrapingResult.robots_compliance) {
                robotsComplianceSummary.push({
                  source: source.name,
                  compliance: scrapingResult.robots_compliance
                })
              }
            } else {
              const errorText = await response.text()
              throw new Error(`Indeed scraper failed (${response.status}): ${errorText}`)
            }
            
          } else if (source.source_type === 'myvisajobs') {
            console.log(`Calling MyVisaJobs scraper for ${source.name}`)
            const response = await fetch(`${supabaseUrl}/functions/v1/myvisajobs-scraper`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                keywords: source.search_keywords,
                max_pages: source.max_pages_per_run,
                respect_robots: true
              })
            })

            if (response.ok) {
              const data = await response.json()
              scrapingResult = data.data
              
              if (scrapingResult.robots_compliance) {
                robotsComplianceSummary.push({
                  source: source.name,
                  compliance: scrapingResult.robots_compliance
                })
              }
            } else {
              const errorText = await response.text()
              throw new Error(`MyVisaJobs scraper failed (${response.status}): ${errorText}`)
            }
            
          } else if (source.source_type === 'h1b_board') {
            // For other H1B boards, create sample data for now
            console.log(`Processing H1B board: ${source.name}`)
            scrapingResult = {
              jobs: [
                {
                  title: 'Software Engineer - H1B Sponsorship Available',
                  company: 'H1B Friendly Tech Company',
                  location: 'San Francisco, CA',
                  description: `Exciting opportunity for a Software Engineer. We sponsor H1B visas for qualified candidates. Found on ${source.name}.`,
                  url: source.base_url,
                  job_type: 'Full-time',
                  source: source.name
                }
              ],
              total_found: 1,
              pages_scraped: 1,
              errors: [],
              robots_compliance: { allowed: true, crawlDelay: 2000, reason: 'Sample data generation' }
            }
            
            robotsComplianceSummary.push({
              source: source.name,
              compliance: scrapingResult.robots_compliance
            })
          }

          if (!scrapingResult) {
            throw new Error(`No scraping implementation for source type: ${source.source_type}`)
          }

          // Update run with scraping results
          await supabase
            .from('scraping_runs')
            .update({
              jobs_found: scrapingResult.total_found,
              pages_scraped: scrapingResult.pages_scraped
            })
            .eq('id', runId)

          totalJobsScraped += scrapingResult.total_found
          console.log(`${source.name}: Found ${scrapingResult.total_found} jobs`)

          // Process the scraped jobs if any were found
          if (scrapingResult.jobs.length > 0) {
            console.log(`Processing ${scrapingResult.jobs.length} jobs from ${source.name}`)
            
            const processingResponse = await fetch(`${supabaseUrl}/functions/v1/job-data-processor`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                jobs: scrapingResult.jobs.map(job => ({ ...job, source: source.name })),
                run_id: runId
              })
            })

            if (processingResponse.ok) {
              const processingData = await processingResponse.json()
              totalJobsProcessed += processingData.data.processed_count
              console.log(`${source.name}: Processed ${processingData.data.processed_count} jobs successfully`)
              
              if (processingData.data.errors_count > 0) {
                errors.push(`${source.name} processing errors: ${processingData.data.errors_count}`)
              }
            } else {
              const errorText = await processingResponse.text()
              errors.push(`Job processing failed for ${source.name}: ${errorText}`)
            }
          } else {
            console.log(`${source.name}: No jobs to process`)
          }

          // Update source last scraped time
          await supabase
            .from('job_sources')
            .update({ last_scraped_at: new Date().toISOString() })
            .eq('id', source.id)

          sourcesProcessed.push(source.name)

        } catch (sourceError) {
          console.error(`Error processing ${source.name}:`, sourceError)
          
          // Update run status to failed
          await supabase
            .from('scraping_runs')
            .update({
              status: 'failed',
              error_details: { error: sourceError.message },
              completed_at: new Date().toISOString()
            })
            .eq('id', runId)

          errors.push(`Error processing ${source.name}: ${sourceError.message}`)
        }

      } catch (error) {
        errors.push(`Error with source ${source.name}: ${error.message}`)
      }
    }

    // Clean up old jobs (older than 30 days)
    console.log('Cleaning up old jobs...')
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: deactivatedJobs } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .lt('posted_date', thirtyDaysAgo)
      .eq('is_active', true)
      .select('id')

    console.log(`Deactivated ${deactivatedJobs?.length || 0} old jobs`)

    // Clean up old scraping runs (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('scraping_runs')
      .delete()
      .lt('started_at', sevenDaysAgo)

    const executionTime = Date.now() - startTime

    const result: OrchestrationResult = {
      runs_executed: runsExecuted,
      total_jobs_scraped: totalJobsScraped,
      total_jobs_processed: totalJobsProcessed,
      errors,
      sources_processed: sourcesProcessed,
      execution_time_ms: executionTime,
      robots_compliance_summary: robotsComplianceSummary
    }

    console.log('Orchestration completed:', result)

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Orchestration error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'ORCHESTRATION_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})