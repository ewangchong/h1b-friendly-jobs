// Advanced Indeed Scraper with Anti-Bot Evasion
// Uses multiple techniques to bypass anti-bot measures

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
  technique_used: string
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
      max_pages = 2,
      use_advanced_techniques = true
    } = await req.json()

    const jobs: JobData[] = []
    const errors: string[] = []
    let totalFound = 0
    let pagesScraped = 0
    let techniqueUsed = 'basic'
    let robotsCompliance: any = null

    // Rotating User Agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15'
    ]

    // Proxy endpoints (free/demo proxies for testing)
    const proxyEndpoints = [
      null, // Direct connection first
      'https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=us&format=textplain',
      'https://www.proxy-list.download/api/v1/get?type=http&anon=elite&country=US'
    ]

    // Check robots.txt compliance first
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
              robots_compliance: robotsCompliance,
              technique_used: 'blocked'
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
    } catch (robotsError) {
      console.warn('Robots.txt check failed:', robotsError.message)
      robotsCompliance = { allowed: true, crawlDelay: 3000, reason: 'Robots check error, using conservative approach' }
    }

    const delay = Math.max(robotsCompliance?.crawlDelay || 3000, 3000) // Minimum 3 seconds

    // Enhanced scraping with multiple techniques
    for (const keyword of keywords) {
      for (let page = 0; page < max_pages; page++) {
        let success = false
        
        // Try different techniques in order of sophistication
        const techniques = use_advanced_techniques ? 
          ['direct', 'user_agent_rotation', 'headers_spoofing', 'timing_variation'] : 
          ['direct']
        
        for (const technique of techniques) {
          if (success) break
          
          try {
            console.log(`Trying technique: ${technique} for keyword: ${keyword}, page: ${page + 1}`)
            
            let headers: Record<string, string> = {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none'
            }
            
            // Apply technique-specific modifications
            switch (technique) {
              case 'user_agent_rotation':
                headers['User-Agent'] = userAgents[Math.floor(Math.random() * userAgents.length)]
                techniqueUsed = 'user_agent_rotation'
                break
                
              case 'headers_spoofing':
                headers = {
                  ...headers,
                  'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
                  'Referer': 'https://www.google.com/',
                  'Cache-Control': 'max-age=0',
                  'DNT': '1',
                  'Sec-Fetch-User': '?1'
                }
                techniqueUsed = 'headers_spoofing'
                break
                
              case 'timing_variation':
                headers['User-Agent'] = userAgents[Math.floor(Math.random() * userAgents.length)]
                // Add random delay variation
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
                techniqueUsed = 'timing_variation'
                break
                
              default:
                headers['User-Agent'] = 'H1BJobsBot/1.0 (+https://h1bfriendly.com)'
                techniqueUsed = 'direct'
            }
            
            // Construct search URL
            const searchParams = new URLSearchParams({
              q: keyword,
              l: location,
              start: (page * 10).toString(),
              sort: 'date',
              fromage: '7' // Last 7 days
            })
            
            const url = `https://www.indeed.com/jobs?${searchParams.toString()}`
            console.log(`Fetching: ${url}`)
            
            const response = await fetch(url, { 
              headers,
              signal: AbortSignal.timeout(30000) // 30 second timeout
            })
            
            if (response.status === 200) {
              const html = await response.text()
              
              // Parse job listings using multiple selector strategies
              const jobPatterns = [
                // Pattern 1: Standard Indeed structure
                /<div[^>]*data-jk="([^"]+)"[^>]*>.*?<h2[^>]*><a[^>]*><span[^>]*title="([^"]+)".*?<span[^>]*data-testid="company-name"[^>]*>([^<]+)<.*?<div[^>]*data-testid="job-location"[^>]*>([^<]+)<\/div>/gs,
                
                // Pattern 2: Alternative structure
                /<div[^>]*class="[^"]*jobsearch-SerpJobCard[^"]*"[^>]*>.*?data-jk="([^"]+)".*?<a[^>]*title="([^"]+)".*?<span[^>]*class="[^"]*companyName[^"]*"[^>]*>([^<]+)<.*?<div[^>]*class="[^"]*companyLocation[^"]*"[^>]*>([^<]+)<\/div>/gs,
                
                // Pattern 3: Mobile-optimized
                /<article[^>]*data-jk="([^"]+)"[^>]*>.*?<h2[^>]*>.*?<span[^>]*>([^<]+)<\/span>.*?<span[^>]*>([^<]+)<\/span>.*?<div[^>]*>([^<]+)<\/div>/gs
              ]
              
              let pageJobCount = 0
              
              for (const pattern of jobPatterns) {
                const matches = html.matchAll(pattern)
                
                for (const match of matches) {
                  try {
                    const [, jobId, title, company, jobLocation] = match
                    
                    if (!jobId || !title || !company) continue
                    
                    // Create job data with available information
                    const jobData: JobData = {
                      title: title.trim(),
                      company: company.trim(),
                      location: jobLocation?.trim() || location,
                      description: `${title} position at ${company}. Located in ${jobLocation || location}. H1B visa sponsorship may be available - please verify with employer.`,
                      url: `https://www.indeed.com/viewjob?jk=${jobId}`,
                      posted_date: new Date().toISOString().split('T')[0], // Today's date as fallback
                      job_type: 'Full-time'
                    }
                    
                    jobs.push(jobData)
                    pageJobCount++
                    
                    // Limit jobs per page to avoid overwhelming
                    if (pageJobCount >= 10) break
                    
                  } catch (jobError) {
                    errors.push(`Error processing job: ${jobError.message}`)
                  }
                }
                
                // If we found jobs with this pattern, no need to try others
                if (pageJobCount > 0) break
              }
              
              // If no jobs found with patterns, try alternative extraction
              if (pageJobCount === 0) {
                // Look for any job-like content
                const titleMatches = html.matchAll(/<h2[^>]*>.*?<a[^>]*>.*?<span[^>]*title="([^"]+)"/g)
                const companyMatches = html.matchAll(/data-testid="company-name"[^>]*>([^<]+)</g)
                
                const titles = Array.from(titleMatches).map(m => m[1])
                const companies = Array.from(companyMatches).map(m => m[1])
                
                for (let i = 0; i < Math.min(titles.length, companies.length, 5); i++) {
                  if (titles[i] && companies[i]) {
                    const jobData: JobData = {
                      title: titles[i].trim(),
                      company: companies[i].trim(),
                      location: location,
                      description: `${titles[i]} opportunity at ${companies[i]}. H1B sponsorship status should be verified with employer.`,
                      url: `https://www.indeed.com/jobs?q=${encodeURIComponent(titles[i])}&l=${encodeURIComponent(location)}`,
                      job_type: 'Full-time'
                    }
                    
                    jobs.push(jobData)
                    pageJobCount++
                  }
                }
              }
              
              totalFound += pageJobCount
              pagesScraped++
              success = true
              
              console.log(`Successfully scraped page ${page + 1} with technique ${technique}: ${pageJobCount} jobs found`)
              
              // Respectful delay between requests
              await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 2000))
              
            } else if (response.status === 403) {
              console.log(`403 Forbidden with technique ${technique} - trying next technique`)
              errors.push(`HTTP 403 with technique ${technique}`)
              // Continue to next technique
            } else {
              console.log(`HTTP ${response.status} with technique ${technique}`)
              errors.push(`HTTP ${response.status} with technique ${technique}`)
            }
            
          } catch (error) {
            console.log(`Technique ${technique} failed:`, error.message)
            errors.push(`Technique ${technique} failed: ${error.message}`)
          }
        }
        
        if (!success) {
          console.log(`All techniques failed for page ${page + 1}`)
          break // Stop trying more pages if we can't access any
        }
      }
    }

    const result: ScrapingResult = {
      jobs,
      total_found: totalFound,
      pages_scraped: pagesScraped,
      errors,
      robots_compliance: robotsCompliance,
      technique_used: techniqueUsed
    }

    console.log(`Advanced Indeed scraping completed: ${totalFound} jobs found using ${techniqueUsed}`)

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Advanced Indeed scraping error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'ADVANCED_SCRAPING_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})