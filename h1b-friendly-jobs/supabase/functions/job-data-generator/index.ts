// H1B Job Data Generator - Creates realistic job listings for the platform
// Generates diverse H1B-friendly jobs from various sources and companies

interface JobData {
  title: string
  company: string
  location: string
  description: string
  salary?: string
  url: string
  posted_date?: string
  job_type?: string
  source: string
  h1b_info?: string
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
      count = 50,
      source = 'H1BConnect',
      include_variety = true
    } = await req.json()

    // Real H1B-friendly companies
    const h1bCompanies = [
      { name: 'Microsoft', locations: ['Seattle, WA', 'Redmond, WA', 'San Francisco, CA', 'New York, NY'] },
      { name: 'Google', locations: ['Mountain View, CA', 'Austin, TX', 'Seattle, WA', 'Chicago, IL'] },
      { name: 'Amazon', locations: ['Seattle, WA', 'Austin, TX', 'Arlington, VA', 'New York, NY'] },
      { name: 'Meta', locations: ['Menlo Park, CA', 'Seattle, WA', 'Austin, TX', 'New York, NY'] },
      { name: 'Apple', locations: ['Cupertino, CA', 'Austin, TX', 'Seattle, WA'] },
      { name: 'Netflix', locations: ['Los Gatos, CA', 'Los Angeles, CA', 'New York, NY'] },
      { name: 'Uber', locations: ['San Francisco, CA', 'Seattle, WA', 'New York, NY', 'Austin, TX'] },
      { name: 'Airbnb', locations: ['San Francisco, CA', 'Seattle, WA', 'New York, NY'] },
      { name: 'Salesforce', locations: ['San Francisco, CA', 'Seattle, WA', 'Indianapolis, IN', 'Chicago, IL'] },
      { name: 'Oracle', locations: ['Austin, TX', 'Redwood City, CA', 'Seattle, WA', 'Burlington, MA'] },
      { name: 'IBM', locations: ['Armonk, NY', 'Austin, TX', 'San Francisco, CA', 'Research Triangle Park, NC'] },
      { name: 'Intel', locations: ['Santa Clara, CA', 'Austin, TX', 'Phoenix, AZ', 'Folsom, CA'] },
      { name: 'Nvidia', locations: ['Santa Clara, CA', 'Austin, TX', 'Seattle, WA'] },
      { name: 'Tesla', locations: ['Austin, TX', 'Fremont, CA', 'Palo Alto, CA'] },
      { name: 'SpaceX', locations: ['Hawthorne, CA', 'Austin, TX', 'Cape Canaveral, FL'] },
      { name: 'Stripe', locations: ['San Francisco, CA', 'Seattle, WA', 'New York, NY'] },
      { name: 'Palantir', locations: ['Palo Alto, CA', 'New York, NY', 'Washington, DC'] },
      { name: 'Snowflake', locations: ['San Mateo, CA', 'Seattle, WA', 'New York, NY'] },
      { name: 'Databricks', locations: ['San Francisco, CA', 'Seattle, WA', 'Amsterdam, Netherlands'] },
      { name: 'Coinbase', locations: ['San Francisco, CA', 'New York, NY', 'Chicago, IL'] },
      { name: 'DoorDash', locations: ['San Francisco, CA', 'Seattle, WA', 'New York, NY'] },
      { name: 'Robinhood', locations: ['Menlo Park, CA', 'New York, NY'] },
      { name: 'Zoom', locations: ['San Jose, CA', 'Seattle, WA', 'Austin, TX'] },
      { name: 'Slack', locations: ['San Francisco, CA', 'Seattle, WA', 'New York, NY'] },
      { name: 'Workday', locations: ['Pleasanton, CA', 'Atlanta, GA', 'Chicago, IL'] },
      { name: 'ServiceNow', locations: ['Santa Clara, CA', 'Seattle, WA', 'Austin, TX'] },
      { name: 'Atlassian', locations: ['San Francisco, CA', 'Austin, TX', 'New York, NY'] },
      { name: 'MongoDB', locations: ['New York, NY', 'Austin, TX', 'San Francisco, CA'] },
      { name: 'Elastic', locations: ['Mountain View, CA', 'Boston, MA', 'Austin, TX'] },
      { name: 'Twilio', locations: ['San Francisco, CA', 'Seattle, WA', 'Austin, TX'] }
    ]

    // Job titles with H1B focus
    const jobTitles = [
      'Software Engineer',
      'Senior Software Engineer',
      'Full Stack Developer',
      'Backend Engineer',
      'Frontend Engineer',
      'Data Scientist',
      'Senior Data Scientist',
      'Machine Learning Engineer',
      'DevOps Engineer',
      'Cloud Engineer',
      'Product Manager',
      'Senior Product Manager',
      'Technical Product Manager',
      'Data Analyst',
      'Business Analyst',
      'Software Development Engineer',
      'Principal Software Engineer',
      'Staff Software Engineer',
      'Engineering Manager',
      'Tech Lead',
      'Database Administrator',
      'System Administrator',
      'Network Engineer',
      'Security Engineer',
      'Cybersecurity Analyst',
      'QA Engineer',
      'Test Engineer',
      'Site Reliability Engineer',
      'Platform Engineer',
      'Mobile Developer',
      'iOS Developer',
      'Android Developer',
      'UI/UX Designer',
      'Product Designer',
      'Research Scientist',
      'Applied Scientist',
      'Financial Analyst',
      'Quantitative Analyst',
      'Investment Banking Analyst',
      'Management Consultant',
      'Strategy Consultant',
      'Marketing Manager',
      'Digital Marketing Specialist',
      'Sales Engineer',
      'Solutions Architect',
      'Technical Writer',
      'Program Manager',
      'Project Manager',
      'Scrum Master',
      'Business Intelligence Analyst',
      'Operations Research Analyst'
    ]

    // H1B-specific job descriptions
    const jobDescriptions = {
      'Software Engineer': 'Design, develop, and maintain scalable software applications. Work with cross-functional teams to deliver high-quality products. Must have strong programming skills in Java, Python, or similar languages. H1B visa sponsorship available for qualified candidates.',
      'Data Scientist': 'Analyze large datasets to extract business insights and build predictive models. Use machine learning and statistical techniques to solve complex problems. Requirements include Masters in Computer Science, Statistics, or related field. Company sponsors H1B visas.',
      'Product Manager': 'Drive product strategy and roadmap for key initiatives. Work closely with engineering, design, and business teams. MBA preferred. Experience with agile methodologies required. H1B sponsorship provided.',
      'DevOps Engineer': 'Build and maintain CI/CD pipelines, infrastructure automation, and monitoring systems. Experience with AWS, Docker, Kubernetes required. H1B visa sponsorship available.',
      'Machine Learning Engineer': 'Design and implement ML systems at scale. Build recommendation systems, computer vision, and NLP applications. PhD in ML/AI preferred. Company provides H1B sponsorship.',
      'Full Stack Developer': 'Develop end-to-end web applications using modern frameworks. Experience with React, Node.js, and cloud platforms required. H1B visa sponsorship available for experienced developers.',
      'Financial Analyst': 'Perform financial modeling, forecasting, and analysis to support business decisions. CFA or Masters in Finance preferred. H1B sponsorship provided.',
      'Quantitative Analyst': 'Develop mathematical models for trading and risk management. Strong background in mathematics, statistics, and programming required. H1B visa sponsorship available.'
    }

    const jobs: JobData[] = []
    const today = new Date()
    
    for (let i = 0; i < count; i++) {
      const company = h1bCompanies[Math.floor(Math.random() * h1bCompanies.length)]
      const title = jobTitles[Math.floor(Math.random() * jobTitles.length)]
      const location = company.locations[Math.floor(Math.random() * company.locations.length)]
      
      // Generate realistic posting dates (last 30 days)
      const daysAgo = Math.floor(Math.random() * 30)
      const postedDate = new Date(today)
      postedDate.setDate(today.getDate() - daysAgo)
      
      // Generate salary ranges based on role level
      let salaryRange = ''
      const isSSenior = title.includes('Senior') || title.includes('Principal') || title.includes('Staff')
      const isManager = title.includes('Manager') || title.includes('Lead')
      
      if (isManager) {
        const min = 140000 + Math.floor(Math.random() * 60000)
        const max = min + 40000 + Math.floor(Math.random() * 60000)
        salaryRange = `$${min.toLocaleString()} - $${max.toLocaleString()}`
      } else if (isSSenior) {
        const min = 120000 + Math.floor(Math.random() * 50000)
        const max = min + 30000 + Math.floor(Math.random() * 50000)
        salaryRange = `$${min.toLocaleString()} - $${max.toLocaleString()}`
      } else {
        const min = 80000 + Math.floor(Math.random() * 40000)
        const max = min + 20000 + Math.floor(Math.random() * 40000)
        salaryRange = `$${min.toLocaleString()} - $${max.toLocaleString()}`
      }
      
      // Get base description or generate one
      let description = jobDescriptions[title.replace(/Senior |Principal |Staff /, '')] || 
        `Exciting opportunity for a ${title} at ${company.name}. Join our innovative team and work on cutting-edge technology. We sponsor H1B visas for qualified international candidates. Competitive salary and comprehensive benefits package included.`
      
      // Add company-specific details
      description += ` As a leading technology company, ${company.name} offers excellent growth opportunities, collaborative work environment, and the chance to work on products used by millions of users worldwide.`
      
      const jobData: JobData = {
        title,
        company: company.name,
        location,
        description,
        salary: salaryRange,
        url: `https://careers.${company.name.toLowerCase().replace(' ', '')}.com/jobs/${title.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 10000)}`,
        posted_date: postedDate.toISOString().split('T')[0],
        job_type: Math.random() > 0.1 ? 'Full-time' : 'Contract',
        source,
        h1b_info: 'H1B visa sponsorship available'
      }
      
      jobs.push(jobData)
    }
    
    return new Response(JSON.stringify({
      data: {
        jobs,
        total_generated: jobs.length,
        source,
        generated_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Job generation error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'GENERATION_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})