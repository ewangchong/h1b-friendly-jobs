// Scraping Admin Dashboard
// Provides monitoring and management capabilities for the scraping system

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AdminStats {
  total_jobs: number
  active_jobs: number
  h1b_jobs: number
  total_companies: number
  h1b_companies: number
  recent_runs: any[]
  sources_status: any[]
  error_summary: any[]
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

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'dashboard'

    switch (action) {
      case 'dashboard':
        return await getDashboardStats(supabase, corsHeaders)
      
      case 'trigger_scraping':
        return await triggerScraping(supabase, corsHeaders, req)
      
      case 'update_source':
        return await updateSource(supabase, corsHeaders, req)
      
      case 'deactivate_jobs':
        return await deactivateOldJobs(supabase, corsHeaders, req)
        
      case 'export_data':
        return await exportData(supabase, corsHeaders, req)
        
      default:
        throw new Error('Unknown action')
    }
    
  } catch (error) {
    console.error('Admin error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'ADMIN_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function getDashboardStats(supabase: any, corsHeaders: any) {
  // Get job statistics
  const { data: jobStats } = await supabase
    .from('jobs')
    .select('id, h1b_sponsorship_available, is_active')
  
  const totalJobs = jobStats?.length || 0
  const activeJobs = jobStats?.filter(j => j.is_active).length || 0
  const h1bJobs = jobStats?.filter(j => j.h1b_sponsorship_available).length || 0

  // Get company statistics
  const { data: companyStats } = await supabase
    .from('companies')
    .select('id, h1b_sponsor_status')
  
  const totalCompanies = companyStats?.length || 0
  const h1bCompanies = companyStats?.filter(c => c.h1b_sponsor_status === 'Active').length || 0

  // Get recent scraping runs
  const { data: recentRuns } = await supabase
    .from('scraping_runs')
    .select(`
      id, run_type, status, started_at, completed_at, 
      jobs_found, jobs_processed, jobs_saved, errors_count,
      job_sources(name)
    `)
    .order('started_at', { ascending: false })
    .limit(10)

  // Get sources status
  const { data: sourcesStatus } = await supabase
    .from('job_sources')
    .select('*')
    .order('name')

  // Get error summary from recent runs
  const { data: errorRuns } = await supabase
    .from('scraping_runs')
    .select('error_details, job_sources(name)')
    .not('error_details', 'is', null)
    .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(20)

  const errorSummary = errorRuns?.map(run => ({
    source: run.job_sources?.name,
    errors: run.error_details
  })) || []

  const stats: AdminStats = {
    total_jobs: totalJobs,
    active_jobs: activeJobs,
    h1b_jobs: h1bJobs,
    total_companies: totalCompanies,
    h1b_companies: h1bCompanies,
    recent_runs: recentRuns || [],
    sources_status: sourcesStatus || [],
    error_summary: errorSummary
  }

  return new Response(JSON.stringify({ data: stats }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function triggerScraping(supabase: any, corsHeaders: any, req: Request) {
  const { source_ids = [], force = true } = await req.json()
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  const response = await fetch(`${supabaseUrl}/functions/v1/scraping-orchestrator`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      force_run: force,
      source_ids: source_ids
    })
  })

  if (response.ok) {
    const result = await response.json()
    return new Response(JSON.stringify({ data: result.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } else {
    throw new Error('Failed to trigger scraping')
  }
}

async function updateSource(supabase: any, corsHeaders: any, req: Request) {
  const { source_id, updates } = await req.json()
  
  const { data, error } = await supabase
    .from('job_sources')
    .update(updates)
    .eq('id', source_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update source: ${error.message}`)
  }

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function deactivateOldJobs(supabase: any, corsHeaders: any, req: Request) {
  const { days_old = 30 } = await req.json()
  
  const cutoffDate = new Date(Date.now() - days_old * 24 * 60 * 60 * 1000).toISOString()
  
  const { data, error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .lt('posted_date', cutoffDate)
    .eq('is_active', true)
    .select('id')

  if (error) {
    throw new Error(`Failed to deactivate jobs: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    data: { 
      deactivated_count: data?.length || 0,
      cutoff_date: cutoffDate
    } 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function exportData(supabase: any, corsHeaders: any, req: Request) {
  const { export_type = 'jobs', format = 'json' } = await req.json()
  
  let data
  
  switch (export_type) {
    case 'jobs':
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('posted_date', { ascending: false })
      data = jobs
      break
      
    case 'companies':
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .order('name')
      data = companies
      break
      
    case 'runs':
      const { data: runs } = await supabase
        .from('scraping_runs')
        .select(`
          *, 
          job_sources(name)
        `)
        .order('started_at', { ascending: false })
        .limit(100)
      data = runs
      break
      
    default:
      throw new Error('Invalid export type')
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(data)
    return new Response(csv, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${export_type}_export.csv"`
      }
    })
  }

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = []
  
  // Add header row
  csvRows.push(headers.join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string') {
        const escaped = value.replace(/"/g, '""')
        return escaped.includes(',') ? `"${escaped}"` : escaped
      }
      return value
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}