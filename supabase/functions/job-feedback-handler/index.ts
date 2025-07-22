// Job Feedback Handler - Processes user feedback for data quality improvement
// Handles submission, validation, and quality score updates

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface FeedbackSubmission {
  job_id: string
  feedback_type: 'not_h1b_friendly' | 'incorrect_company' | 'outdated' | 'duplicate' | 'inappropriate' | 'positive'
  reason?: string
  additional_info?: any
}

interface FeedbackStats {
  total_feedback: number
  positive_count: number
  negative_count: number
  h1b_accuracy_score: number
  overall_quality_score: number
  needs_review: boolean
  recent_feedback: any[]
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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header required'
        }
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        }
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { method } = req
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)

    if (method === 'POST') {
      // Submit feedback
      const { job_id, feedback_type, reason, additional_info }: FeedbackSubmission = await req.json()

      // Validate required fields
      if (!job_id || !feedback_type) {
        return new Response(JSON.stringify({
          error: {
            code: 'INVALID_INPUT',
            message: 'job_id and feedback_type are required'
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate feedback type
      const validTypes = ['not_h1b_friendly', 'incorrect_company', 'outdated', 'duplicate', 'inappropriate', 'positive']
      if (!validTypes.includes(feedback_type)) {
        return new Response(JSON.stringify({
          error: {
            code: 'INVALID_FEEDBACK_TYPE',
            message: `feedback_type must be one of: ${validTypes.join(', ')}`
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check if job exists
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, h1b_sponsorship_confidence')
        .eq('id', job_id)
        .single()

      if (jobError || !job) {
        return new Response(JSON.stringify({
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found'
          }
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check if user already provided feedback for this job
      const { data: existingFeedback } = await supabase
        .from('job_feedback')
        .select('id, feedback_type')
        .eq('job_id', job_id)
        .eq('user_id', user.id)
        .single()

      if (existingFeedback) {
        // Update existing feedback instead of creating new
        const { data: updatedFeedback, error: updateError } = await supabase
          .from('job_feedback')
          .update({
            feedback_type,
            reason,
            additional_info,
            created_at: new Date().toISOString() // Update timestamp
          })
          .eq('id', existingFeedback.id)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        return new Response(JSON.stringify({
          data: {
            feedback: updatedFeedback,
            message: 'Feedback updated successfully'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        // Create new feedback
        const { data: newFeedback, error: insertError } = await supabase
          .from('job_feedback')
          .insert({
            job_id,
            user_id: user.id,
            feedback_type,
            confidence_before: job.h1b_sponsorship_confidence,
            reason,
            additional_info
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        return new Response(JSON.stringify({
          data: {
            feedback: newFeedback,
            message: 'Feedback submitted successfully'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

    } else if (method === 'GET') {
      // Get feedback stats for a job
      const jobId = url.searchParams.get('job_id')
      
      if (!jobId) {
        return new Response(JSON.stringify({
          error: {
            code: 'MISSING_JOB_ID',
            message: 'job_id parameter is required'
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get quality scores
      const { data: qualityScore } = await supabase
        .from('job_quality_scores')
        .select('*')
        .eq('job_id', jobId)
        .single()

      // Get recent feedback
      const { data: recentFeedback } = await supabase
        .from('job_feedback')
        .select(`
          id,
          feedback_type,
          reason,
          created_at,
          is_verified,
          profiles:user_id (
            full_name
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get user's feedback for this job
      const { data: userFeedback } = await supabase
        .from('job_feedback')
        .select('feedback_type, reason, created_at')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .single()

      const stats: FeedbackStats = {
        total_feedback: (qualityScore?.positive_feedback_count || 0) + (qualityScore?.negative_feedback_count || 0),
        positive_count: qualityScore?.positive_feedback_count || 0,
        negative_count: qualityScore?.negative_feedback_count || 0,
        h1b_accuracy_score: qualityScore?.h1b_accuracy_score || 1.0,
        overall_quality_score: qualityScore?.overall_quality_score || 1.0,
        needs_review: qualityScore?.needs_review || false,
        recent_feedback: recentFeedback || []
      }

      return new Response(JSON.stringify({
        data: {
          stats,
          user_feedback: userFeedback
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      return new Response(JSON.stringify({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET and POST methods are supported'
        }
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Job feedback handler error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})