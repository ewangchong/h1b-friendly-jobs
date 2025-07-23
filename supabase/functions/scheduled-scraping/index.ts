// Scheduled Scraping Cron Job
// Runs the scraping orchestrator on a scheduled basis

Deno.serve(async (req) => {
  console.log('Starting scheduled scraping job...')
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Call the scraping orchestrator
    const response = await fetch(`${supabaseUrl}/functions/v1/scraping-orchestrator`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        force_run: false, // Respect frequency settings
        source_ids: [] // Process all active sources
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Scheduled scraping completed:', result)
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Scheduled scraping completed successfully',
        data: result.data
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      const error = await response.text()
      console.error('Scheduled scraping failed:', error)
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Scheduled scraping failed',
        error: error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
  } catch (error) {
    console.error('Cron job error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Cron job execution failed',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})