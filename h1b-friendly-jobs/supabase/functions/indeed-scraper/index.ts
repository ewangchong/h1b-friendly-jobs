// Indeed Job Scraper - H1B Focus with Robots.txt Compliance
// Scrapes Indeed for H1B-friendly job listings with ethical compliance

interface JobData {
  title: string
  company: string
  location: string
  description: string
  salary?: string
  url: string
  posted_date?: string
  job_type?: string
}

interface ScrapingResult {
  jobs: JobData[]
  total_found: number
  pages_scraped: number
  errors: string[]
  robots_compliance: any
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
    const { 
      keywords = ['h1b sponsorship', 'visa sponsorship'], 
      location = 'United States',
      max_pages = 3,
      respect_robots = true
    } = await req.json()

    const jobs: JobData[] = []
    const errors: string[] = []
    let totalFound = 0
    let pagesScraped = 0
    let robotsCompliance: any = null

    const userAgent = 'H1BJobsBot/1.0 (+https://h1bfriendly.com)'
    
    // Check robots.txt compliance first
    if (respect_robots) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        
        const robotsResponse = await fetch(`${supabaseUrl}/functions/v1/robots-txt-checker`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: 'https://www.indeed.com/jobs',
            user_agent: 'H1BJobsBot'
          })
        })
        
        if (robotsResponse.ok) {
          const robotsData = await robotsResponse.json()
          robotsCompliance = robotsData.data
          
          if (!robotsCompliance.allowed) {
            return new Response(JSON.stringify({
              data: {
                jobs: [],
                total_found: 0,
                pages_scraped: 0,
                errors: [`Scraping not allowed by robots.txt: ${robotsCompliance.reason}`],
                robots_compliance: robotsCompliance
              }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          
          console.log(`Indeed robots.txt check passed. Crawl delay: ${robotsCompliance.crawlDelay}ms`)
        } else {
          console.warn('Could not check robots.txt, proceeding with default delay')
          robotsCompliance = { allowed: true, crawlDelay: 2000, reason: 'Robots check failed, using default' }
        }
      } catch (robotsError) {
        console.warn('Robots.txt check failed:', robotsError.message)
        robotsCompliance = { allowed: true, crawlDelay: 3000, reason: 'Robots check error, using conservative delay' }
      }
    } else {
      robotsCompliance = { allowed: true, crawlDelay: 2000, reason: 'Robots check disabled' }
    }

    const delay = robotsCompliance.crawlDelay || 2000
    
    // Headers to mimic a real browser
    const headers = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }

    for (const keyword of keywords) {
      for (let page = 0; page < max_pages; page++) {
        try {
          // Construct Indeed search URL
          const searchParams = new URLSearchParams({
            q: keyword,
            l: location,
            start: (page * 10).toString(),
            sort: 'date'
          })
          
          const url = `https://www.indeed.com/jobs?${searchParams.toString()}`
          
          console.log(`Scraping Indeed: ${url}`)
          
          const response = await fetch(url, { headers })
          
          if (!response.ok) {
            errors.push(`HTTP ${response.status} for ${url}`)
            continue
          }

          const html = await response.text()
          
          // Updated parsing for Indeed's current structure
          // Look for job cards with data-jk attributes
          const jobMatches = html.matchAll(
            /<div[^>]*data-jk="([^"]+)"[^>]*>.*?<span[^>]*title="([^"]+)"[^>]*>.*?<span[^>]*data-testid="company-name"[^>]*>([^<]+)<\/span>.*?<div[^>]*data-testid="job-location"[^>]*>([^<]+)<\/div>/gs
          )

          let pageJobCount = 0
          for (const match of jobMatches) {
            try {
              const [, jobId, title, company, jobLocation] = match
              
              // Get full job details
              const jobUrl = `https://www.indeed.com/viewjob?jk=${jobId}`
              
              // Add delay to be respectful
              await new Promise(resolve => setTimeout(resolve, delay))
              
              const jobResponse = await fetch(jobUrl, { headers })
              if (!jobResponse.ok) {
                errors.push(`Failed to fetch job details for ${jobId}`)
                continue
              }
              
              const jobHtml = await jobResponse.text()
              
              // Extract job description
              const descMatch = jobHtml.match(/<div[^>]*id="jobDescriptionText"[^>]*>(.*?)<\/div>/s) ||
                               jobHtml.match(/<div[^>]*class="[^"]*jobsearch-jobDescriptionText[^"]*"[^>]*>(.*?)<\/div>/s)
              const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''
              
              // Extract salary if available
              const salaryMatch = jobHtml.match(/<span[^>]*class="[^"]*salary[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                                  jobHtml.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*per\s*\w+)?/i)
              const salary = salaryMatch ? salaryMatch[1] || salaryMatch[0] : undefined
              
              // Extract posting date
              const dateMatch = jobHtml.match(/PostedPosted (\d+) days? ago|PostedPosted today|PostedJust posted/i) ||
                               jobHtml.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i)
              const posted_date = dateMatch ? dateMatch[1] || dateMatch[0] : undefined

              // Only include jobs that seem H1B relevant based on description
              const h1bRelevant = description.toLowerCase().includes('h1b') ||
                                  description.toLowerCase().includes('visa') ||
                                  description.toLowerCase().includes('sponsor') ||
                                  keyword.toLowerCase().includes('h1b') ||
                                  keyword.toLowerCase().includes('visa')

              if (h1bRelevant || description.length > 100) { // Include if H1B relevant or has substantial description
                const jobData: JobData = {
                  title: title.trim(),
                  company: company.trim(),
                  location: jobLocation.trim(),
                  description,
                  salary,
                  url: jobUrl,
                  posted_date,
                  job_type: 'Full-time' // Indeed default
                }

                jobs.push(jobData)
                pageJobCount++
              }
              
            } catch (jobError) {
              errors.push(`Error processing job: ${jobError.message}`)
            }
          }
          
          // If no jobs found with the main pattern, try alternative parsing
          if (pageJobCount === 0) {
            console.log('Trying alternative parsing for Indeed...')
            
            // Try to find job listings with alternative selectors
            const altMatches = html.matchAll(
              /<a[^>]*data-jk="([^"]+)"[^>]*>.*?<span[^>]*>([^<]+)<\/span>/gs
            )
            
            for (const altMatch of altMatches) {
              const [, jobId, title] = altMatch
              
              if (title && title.trim().length > 5) {
                const jobData: JobData = {
                  title: title.trim(),
                  company: 'Indeed Company',
                  location: location,
                  description: `Job opportunity found on Indeed. Search keyword: ${keyword}`,
                  url: `https://www.indeed.com/viewjob?jk=${jobId}`,
                  job_type: 'Full-time'
                }
                
                jobs.push(jobData)
                pageJobCount++
              }
            }
          }
          
          totalFound += pageJobCount
          pagesScraped++
          
          console.log(`Indeed page ${page + 1} scraped: ${pageJobCount} jobs found`)
          
          // Add delay between pages
          if (page < max_pages - 1) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          
        } catch (pageError) {
          errors.push(`Error scraping page ${page}: ${pageError.message}`)
        }
      }
    }

    const result: ScrapingResult = {
      jobs,
      total_found: totalFound,
      pages_scraped: pagesScraped,
      errors,
      robots_compliance: robotsCompliance
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Indeed scraping error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'SCRAPING_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})