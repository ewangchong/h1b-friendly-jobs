// H1B NLP Classifier Edge Function
// Analyzes job descriptions for H1B sponsorship indicators

interface H1BKeyword {
  keyword: string
  weight: number
  category: string
}

interface AnalysisResult {
  confidence: number
  matched_keywords: string[]
  negative_indicators: string[]
  analysis_details: {
    explicit_matches: number
    implicit_matches: number
    negative_matches: number
    total_score: number
  }
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
    const { text, job_title, company_name } = await req.json()
    
    if (!text) {
      throw new Error('Text content is required for analysis')
    }

    // Default H1B keywords with weights
    const keywords: H1BKeyword[] = [
      { keyword: 'h1b sponsorship', weight: 1.0, category: 'explicit' },
      { keyword: 'visa sponsorship', weight: 0.9, category: 'explicit' },
      { keyword: 'will sponsor h1b', weight: 1.0, category: 'explicit' },
      { keyword: 'h1b visa', weight: 0.8, category: 'explicit' },
      { keyword: 'work authorization', weight: 0.6, category: 'implicit' },
      { keyword: 'sponsor visa', weight: 0.8, category: 'explicit' },
      { keyword: 'immigration sponsorship', weight: 0.9, category: 'explicit' },
      { keyword: 'will sponsor work visa', weight: 0.9, category: 'explicit' },
      { keyword: 'h1b friendly', weight: 1.0, category: 'explicit' },
      { keyword: 'open to visa sponsorship', weight: 0.8, category: 'explicit' },
      { keyword: 'no sponsorship', weight: -1.0, category: 'negative' },
      { keyword: 'us citizens only', weight: -1.0, category: 'negative' },
      { keyword: 'no visa sponsorship', weight: -1.0, category: 'negative' },
      { keyword: 'must be authorized to work', weight: -0.3, category: 'negative' },
      { keyword: 'work visa support', weight: 0.7, category: 'explicit' },
      { keyword: 'visa assistance', weight: 0.7, category: 'explicit' },
      { keyword: 'sponsorship available', weight: 0.6, category: 'implicit' },
      { keyword: 'international candidates', weight: 0.5, category: 'implicit' }
    ]

    // Normalize text for analysis
    const normalizedText = text.toLowerCase()
    const normalizedTitle = job_title?.toLowerCase() || ''
    const combinedText = `${normalizedText} ${normalizedTitle}`

    let totalScore = 0
    let explicitMatches = 0
    let implicitMatches = 0
    let negativeMatches = 0
    const matchedKeywords: string[] = []
    const negativeIndicators: string[] = []

    // Analyze keywords
    for (const keywordObj of keywords) {
      const keyword = keywordObj.keyword.toLowerCase()
      
      if (combinedText.includes(keyword)) {
        totalScore += keywordObj.weight
        
        if (keywordObj.category === 'explicit') {
          explicitMatches++
          matchedKeywords.push(keywordObj.keyword)
        } else if (keywordObj.category === 'implicit') {
          implicitMatches++
          matchedKeywords.push(keywordObj.keyword)
        } else if (keywordObj.category === 'negative') {
          negativeMatches++
          negativeIndicators.push(keywordObj.keyword)
        }
      }
    }

    // Additional heuristics
    // Check for specific patterns
    const patterns = [
      /sponsor.*h[-\s]?1[-\s]?b/i,
      /h[-\s]?1[-\s]?b.*sponsor/i,
      /visa.*support/i,
      /work.*visa/i,
      /employment.*authorization/i
    ]

    for (const pattern of patterns) {
      if (pattern.test(combinedText)) {
        totalScore += 0.3
        implicitMatches++
      }
    }

    // Company-based adjustments (known H1B sponsors get bonus)
    const knownH1BCompanies = [
      'google', 'microsoft', 'amazon', 'meta', 'apple', 'netflix', 
      'uber', 'tesla', 'salesforce', 'adobe', 'oracle', 'ibm'
    ]
    
    if (company_name) {
      const normalizedCompany = company_name.toLowerCase()
      for (const knownCompany of knownH1BCompanies) {
        if (normalizedCompany.includes(knownCompany)) {
          totalScore += 0.2
          break
        }
      }
    }

    // Calculate final confidence score (0-1 scale)
    let confidence = Math.max(0, Math.min(1, (totalScore + 1) / 2))
    
    // Apply penalties for strong negative indicators
    if (negativeMatches > 0 && explicitMatches === 0) {
      confidence = Math.max(0, confidence - (negativeMatches * 0.3))
    }

    const result: AnalysisResult = {
      confidence: Math.round(confidence * 100) / 100,
      matched_keywords: matchedKeywords,
      negative_indicators: negativeIndicators,
      analysis_details: {
        explicit_matches: explicitMatches,
        implicit_matches: implicitMatches,
        negative_matches: negativeMatches,
        total_score: Math.round(totalScore * 100) / 100
      }
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('NLP Analysis error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'NLP_ANALYSIS_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})