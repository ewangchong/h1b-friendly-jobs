import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  AlertTriangle, 
  CheckCircle, 
  Flag, 
  ThumbsUp, 
  ThumbsDown,
  X,
  Send
} from 'lucide-react'
import { Button } from './ui/button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface JobFeedbackProps {
  jobId: string
  currentH1BStatus?: boolean
  currentConfidence?: number
}

type FeedbackType = 'not_h1b_friendly' | 'incorrect_company' | 'outdated' | 'duplicate' | 'inappropriate' | 'positive'

interface FeedbackOption {
  type: FeedbackType
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

const feedbackOptions: FeedbackOption[] = [
  {
    type: 'positive',
    label: 'Accurate & Helpful',
    icon: <ThumbsUp className="w-4 h-4" />,
    color: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
    description: 'This job posting is accurate and H1B-friendly'
  },
  {
    type: 'not_h1b_friendly',
    label: 'Not H1B Friendly',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
    description: 'This company does not sponsor H1B visas'
  },
  {
    type: 'incorrect_company',
    label: 'Wrong Company Info',
    icon: <Flag className="w-4 h-4" />,
    color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
    description: 'Company name or details are incorrect'
  },
  {
    type: 'outdated',
    label: 'Outdated Posting',
    icon: <X className="w-4 h-4" />,
    color: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100',
    description: 'This job posting is no longer available'
  },
  {
    type: 'duplicate',
    label: 'Duplicate Job',
    icon: <Flag className="w-4 h-4" />,
    color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
    description: 'This job is duplicated in the system'
  },
  {
    type: 'inappropriate',
    label: 'Inappropriate Content',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
    description: 'Contains inappropriate or misleading content'
  }
]

export default function JobFeedback({ jobId, currentH1BStatus, currentConfidence }: JobFeedbackProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null)
  const [reason, setReason] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Fetch feedback stats and user's previous feedback
  const { data: feedbackData } = useQuery({
    queryKey: ['job-feedback', jobId],
    queryFn: async () => {
      if (!user) return null
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-feedback-handler?job_id=${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch feedback data')
      }

      return response.json()
    },
    enabled: !!user && !!jobId
  })

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ feedbackType, feedbackReason }: { feedbackType: FeedbackType, feedbackReason: string }) => {
      if (!user) throw new Error('Must be logged in to submit feedback')
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-feedback-handler`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            job_id: jobId,
            feedback_type: feedbackType,
            reason: feedbackReason,
            additional_info: {
              h1b_status_when_reported: currentH1BStatus,
              confidence_when_reported: currentConfidence
            }
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to submit feedback')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-feedback', jobId] })
      toast.success('Thank you for your feedback! This helps improve our data quality.')
      setShowForm(false)
      setSelectedFeedback(null)
      setReason('')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit feedback')
    }
  })

  const handleSubmitFeedback = () => {
    if (!selectedFeedback) {
      toast.error('Please select a feedback type')
      return
    }

    submitFeedbackMutation.mutate({
      feedbackType: selectedFeedback,
      feedbackReason: reason
    })
  }

  const stats = feedbackData?.data?.stats
  const userFeedback = feedbackData?.data?.user_feedback

  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-600 mb-2">Help improve our data quality</p>
        <p className="text-sm text-gray-500">Sign in to report job accuracy</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Job Quality Feedback</h3>
        {stats && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <ThumbsUp className="w-4 h-4 mr-1 text-green-600" />
              {stats.positive_count}
            </span>
            <span className="flex items-center">
              <ThumbsDown className="w-4 h-4 mr-1 text-red-600" />
              {stats.negative_count}
            </span>
            {stats.h1b_accuracy_score < 0.8 && (
              <span className="text-orange-600 font-medium">
                Under Review
              </span>
            )}
          </div>
        )}
      </div>

      {userFeedback ? (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">Thank you for your feedback!</span>
          </div>
          <p className="text-sm text-blue-700">
            You reported this job as: <strong>{feedbackOptions.find(opt => opt.type === userFeedback.feedback_type)?.label}</strong>
          </p>
          {userFeedback.reason && (
            <p className="text-sm text-blue-600 mt-1 italic">"{userFeedback.reason}"</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="mt-3"
          >
            Update Feedback
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">
            Help us improve job quality by reporting any issues with this posting.
          </p>
          
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Flag className="w-4 h-4" />
              <span>Report Issue or Give Feedback</span>
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {feedbackOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setSelectedFeedback(option.type)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedFeedback === option.type
                        ? option.color + ' ring-2 ring-offset-2 ring-current'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </button>
                ))}
              </div>

              {selectedFeedback && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="feedback-reason" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional details (optional)
                    </label>
                    <textarea
                      id="feedback-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide any additional context that would help us improve this job posting..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={submitFeedbackMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setSelectedFeedback(null)
                        setReason('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {stats && stats.recent_feedback && stats.recent_feedback.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Community Feedback</h4>
          <div className="space-y-2">
            {stats.recent_feedback.slice(0, 3).map((feedback: any, index: number) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <div className={`p-1 rounded ${
                  feedback.feedback_type === 'positive' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {feedback.feedback_type === 'positive' ? 
                    <ThumbsUp className="w-3 h-3 text-green-600" /> : 
                    <ThumbsDown className="w-3 h-3 text-red-600" />
                  }
                </div>
                <div className="flex-1">
                  <span className="font-medium">
                    {feedbackOptions.find(opt => opt.type === feedback.feedback_type)?.label}
                  </span>
                  {feedback.reason && (
                    <p className="text-gray-600 text-xs mt-1">{feedback.reason}</p>
                  )}
                  <p className="text-gray-400 text-xs">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}