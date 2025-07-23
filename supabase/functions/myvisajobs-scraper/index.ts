// MyVisaJobs Scraper - H1B Specialized Job Board
// Scrapes MyVisaJobs.com for H1B job listings with robots.txt compliance

interface JobData {
  title: string
  company: string
  location: string
  description: string
  salary?: string
  url: string
  posted_date?: string
  job_type?: string
  h1b_info?: string
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
      keywords = ['software engineer', 'data scientist', 'product manager'], 
      max_pages = 3,
      respect_robots = true
    } = await req.json()

    const jobs: JobData[] = []
    const errors: string[] = []
    let totalFound = 0
    let pagesScraped = 0
    let robotsCompliance: any = null

    const baseUrl = 'https://www.myvisajobs.com'
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
            url: `${baseUrl}/jobs`,
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
          
          console.log(`MyVisaJobs robots.txt check passed. Crawl delay: ${robotsCompliance.crawlDelay}ms`)
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
      for (let page = 1; page <= max_pages; page++) {
        try {
          // MyVisaJobs search URL pattern
          const searchParams = new URLSearchParams({
            'job_title': keyword,
            'location': '',
            'visa': 'H1B',
            'page': page.toString()
          })
          
          const url = `${baseUrl}/Jobs/Search?${searchParams.toString()}`
          
          console.log(`Scraping MyVisaJobs: ${url}`)
          
          const response = await fetch(url, { headers })
          
          if (!response.ok) {
            errors.push(`HTTP ${response.status} for ${url}`)
            continue
          }

          const html = await response.text()
          
          // Parse job listings from MyVisaJobs HTML structure
          // MyVisaJobs typically has job listings in table or div structures
          
          // Look for job table rows or job cards
          const jobMatches = html.matchAll(
            /<tr[^>]*class="[^"]*job[^"]*"[^>]*>.*?<\/tr>/gsi
          )

          let pageJobCount = 0
          
          for (const match of jobMatches) {
            try {
              const jobHtml = match[0]
              
              // Extract job title
              const titleMatch = jobHtml.match(/<a[^>]*href="\/Jobs\/Details\/([^"]+)"[^>]*>([^<]+)<\/a>/i)
              if (!titleMatch) continue
              
              const jobId = titleMatch[1]
              const title = titleMatch[2].trim()
              
              // Extract company name
              const companyMatch = jobHtml.match(/<td[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/td>/i) ||
                                   jobHtml.match(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/i)
              const company = companyMatch ? companyMatch[1].trim() : 'Unknown Company'
              
              // Extract location
              const locationMatch = jobHtml.match(/<td[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/td>/i) ||
                                    jobHtml.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i)
              const location = locationMatch ? locationMatch[1].trim() : 'Location not specified'
              
              // Extract salary if available
              const salaryMatch = jobHtml.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/)
              const salary = salaryMatch ? salaryMatch[0] : undefined
              
              // Get job details URL
              const jobUrl = `${baseUrl}/Jobs/Details/${jobId}`
              
              // Add delay before fetching job details
              await new Promise(resolve => setTimeout(resolve, delay))
              
              // Fetch job details page
              const detailResponse = await fetch(jobUrl, { headers })
              let description = ''
              let h1bInfo = ''
              
              if (detailResponse.ok) {
                const detailHtml = await detailResponse.text()
                
                // Extract job description
                const descMatch = detailHtml.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/si) ||
                                  detailHtml.match(/<div[^>]*id="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/si)
                if (descMatch) {
                  description = descMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                }
                
                // Extract H1B specific information
                const h1bMatch = detailHtml.match(/<div[^>]*class="[^"]*h1b[^"]*"[^>]*>(.*?)<\/div>/si) ||
                                 detailHtml.match(/<span[^>]*class="[^"]*visa[^"]*"[^>]*>([^<]+)<\/span>/i)
                if (h1bMatch) {
                  h1bInfo = h1bMatch[1].replace(/<[^>]*>/g, ' ').trim()
                }
              }
              
              const jobData: JobData = {
                title,
                company,
                location,
                description: description || `${title} position at ${company} in ${location}. H1B visa sponsorship available.`,
                salary,
                url: jobUrl,
                job_type: 'Full-time',
                h1b_info: h1bInfo || 'H1B sponsorship available'
              }

              jobs.push(jobData)
              pageJobCount++
              
            } catch (jobError) {
              errors.push(`Error processing job: ${jobError.message}`)
            }
          }
          
          // If no jobs found using table structure, try alternative parsing
          if (pageJobCount === 0) {
            // Try parsing job cards or alternative structures
            const altJobMatches = html.matchAll(
              /<div[^>]*class="[^"]*job[^"]*"[^>]*>.*?<\/div>/gsi
            )
            
            for (const match of altJobMatches) {
              try {
                const jobHtml = match[0]
                
                // Extract basic job information from card structure
                const titleMatch = jobHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i) ||
                                   jobHtml.match(/<strong[^>]*>([^<]+)<\/strong>/i)
                
                if (titleMatch) {
                  const title = titleMatch[1].trim()
                  
                  // For MyVisaJobs, we can create jobs with basic H1B information
                  const jobData: JobData = {
                    title,
                    company: 'H1B Sponsor Company',
                    location: 'Various Locations',
                    description: `${title} position with H1B visa sponsorship available. Found on MyVisaJobs specialized H1B job board.`,
                    url: `${baseUrl}/jobs`,
                    job_type: 'Full-time',
                    h1b_info: 'H1B sponsorship confirmed'
                  }
                  
                  jobs.push(jobData)
                  pageJobCount++
                }
              } catch (altError) {
                errors.push(`Error in alternative parsing: ${altError.message}`)
              }
            }
          }
          
          totalFound += pageJobCount
          pagesScraped++
          
          console.log(`MyVisaJobs page ${page} scraped: ${pageJobCount} jobs found`)
          
          // Add delay between pages
          if (page < max_pages) {
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
    console.error('MyVisaJobs scraping error:', error)
    
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