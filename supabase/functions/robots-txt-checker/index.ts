// Robots.txt Checker and Parser
// Fetches and validates robots.txt compliance for ethical web scraping

interface RobotsRule {
  userAgent: string
  disallowed: string[]
  allowed: string[]
  crawlDelay?: number
  sitemaps: string[]
}

interface RobotsCheckResult {
  allowed: boolean
  crawlDelay: number
  reason?: string
  sitemaps: string[]
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
    const { url, user_agent = 'H1BJobsBot' } = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }

    // Extract domain from URL
    const urlObj = new URL(url)
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`
    
    console.log(`Checking robots.txt for ${urlObj.host}`)

    try {
      // Fetch robots.txt
      const robotsResponse = await fetch(robotsUrl, {
        headers: {
          'User-Agent': user_agent
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      })

      let robotsContent = ''
      if (robotsResponse.ok) {
        robotsContent = await robotsResponse.text()
      } else {
        console.log(`No robots.txt found at ${robotsUrl}, assuming allowed`)
        // If no robots.txt, assume scraping is allowed with default delay
        return new Response(JSON.stringify({
          data: {
            allowed: true,
            crawlDelay: 1000, // Default 1 second delay
            reason: 'No robots.txt found, using default settings',
            sitemaps: []
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Parse robots.txt
      const rules = parseRobotsTxt(robotsContent)
      
      // Check if our user agent and path are allowed
      const checkResult = checkRobotsCompliance(rules, user_agent, urlObj.pathname)
      
      return new Response(JSON.stringify({ data: checkResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    } catch (fetchError) {
      console.warn(`Failed to fetch robots.txt: ${fetchError.message}`)
      // If we can't fetch robots.txt, err on the side of caution
      return new Response(JSON.stringify({
        data: {
          allowed: true,
          crawlDelay: 2000, // Conservative 2 second delay
          reason: `Could not fetch robots.txt: ${fetchError.message}`,
          sitemaps: []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
  } catch (error) {
    console.error('Robots.txt checker error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'ROBOTS_CHECK_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function parseRobotsTxt(content: string): RobotsRule[] {
  const lines = content.split('\n').map(line => line.trim())
  const rules: RobotsRule[] = []
  let currentRule: Partial<RobotsRule> = {}
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line === '') continue
    
    const [directive, ...valueParts] = line.split(':')
    const value = valueParts.join(':').trim()
    
    switch (directive.toLowerCase()) {
      case 'user-agent':
        // Start new rule if we have a previous one
        if (currentRule.userAgent) {
          rules.push(currentRule as RobotsRule)
          currentRule = {}
        }
        currentRule.userAgent = value
        currentRule.disallowed = []
        currentRule.allowed = []
        currentRule.sitemaps = []
        break
        
      case 'disallow':
        if (currentRule.disallowed && value) {
          currentRule.disallowed.push(value)
        }
        break
        
      case 'allow':
        if (currentRule.allowed && value) {
          currentRule.allowed.push(value)
        }
        break
        
      case 'crawl-delay':
        const delay = parseInt(value)
        if (!isNaN(delay)) {
          currentRule.crawlDelay = delay * 1000 // Convert to milliseconds
        }
        break
        
      case 'sitemap':
        if (currentRule.sitemaps && value) {
          currentRule.sitemaps.push(value)
        }
        break
    }
  }
  
  // Add the last rule
  if (currentRule.userAgent) {
    rules.push(currentRule as RobotsRule)
  }
  
  return rules
}

function checkRobotsCompliance(rules: RobotsRule[], userAgent: string, path: string): RobotsCheckResult {
  // Find applicable rules (check for exact match, then wildcard)
  let applicableRule = rules.find(rule => rule.userAgent.toLowerCase() === userAgent.toLowerCase())
  
  if (!applicableRule) {
    applicableRule = rules.find(rule => rule.userAgent === '*')
  }
  
  if (!applicableRule) {
    // No rules found, assume allowed
    return {
      allowed: true,
      crawlDelay: 1000,
      reason: 'No applicable robots.txt rules found',
      sitemaps: []
    }
  }
  
  // Check disallowed paths first
  for (const disallowedPath of applicableRule.disallowed) {
    if (disallowedPath === '' || disallowedPath === '/') {
      // Empty disallow or root disallow means everything is disallowed
      if (disallowedPath === '' || path.startsWith(disallowedPath)) {
        return {
          allowed: false,
          crawlDelay: applicableRule.crawlDelay || 1000,
          reason: `Path ${path} is disallowed by robots.txt rule: Disallow: ${disallowedPath}`,
          sitemaps: applicableRule.sitemaps
        }
      }
    } else if (path.startsWith(disallowedPath)) {
      // Check if there's a more specific allow rule
      const hasAllowOverride = applicableRule.allowed.some(allowedPath => 
        path.startsWith(allowedPath) && allowedPath.length > disallowedPath.length
      )
      
      if (!hasAllowOverride) {
        return {
          allowed: false,
          crawlDelay: applicableRule.crawlDelay || 1000,
          reason: `Path ${path} is disallowed by robots.txt rule: Disallow: ${disallowedPath}`,
          sitemaps: applicableRule.sitemaps
        }
      }
    }
  }
  
  return {
    allowed: true,
    crawlDelay: applicableRule.crawlDelay || 1000,
    reason: 'Path is allowed by robots.txt',
    sitemaps: applicableRule.sitemaps
  }
}