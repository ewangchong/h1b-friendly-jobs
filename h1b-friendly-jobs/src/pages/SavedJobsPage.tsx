import { useQuery } from '@tanstack/react-query'
import { Bookmark, Trash2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import JobCard from '../components/JobCard'
import { Button } from '../components/ui/button'

export default function SavedJobsPage() {
  const { user } = useAuth()

  const { data: savedJobs, isLoading } = useQuery({
    queryKey: ['saved-jobs', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      // First get saved job IDs
      const { data: savedJobIds, error: savedError } = await supabase
        .from('saved_jobs')
        .select('job_id, saved_at, notes')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })
      
      if (savedError) throw savedError
      if (!savedJobIds || savedJobIds.length === 0) return []
      
      // Then get job details
      const jobIds = savedJobIds.map(item => item.job_id)
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .in('id', jobIds)
      
      if (jobsError) throw jobsError
      
      // Combine job data with saved job metadata
      return savedJobIds.map(savedItem => {
        const job = jobs?.find(j => j.id === savedItem.job_id)
        return {
          ...job,
          saved_at: savedItem.saved_at,
          notes: savedItem.notes,
          isSaved: true
        }
      }).filter(Boolean)
    },
    enabled: !!user
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view saved jobs</h1>
          <p className="text-gray-600 mb-6">
            Create an account or sign in to save jobs and track your applications.
          </p>
          <div className="space-y-3">
            <Link to="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" className="w-full">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
          <p className="text-gray-600">
            Keep track of jobs you're interested in and manage your applications.
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  </div>
                </div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : savedJobs && savedJobs.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {savedJobs.length} Saved Job{savedJobs.length !== 1 ? 's' : ''}
              </h2>
            </div>
            
            <div className="space-y-4">
              {savedJobs.map((job) => (
                <div key={job.id} className="relative">
                  <JobCard 
                    job={job} 
                    showSaveButton={true} 
                    isSaved={true}
                  />
                  
                  {/* Saved Date */}
                  <div className="absolute top-4 right-4 text-xs text-gray-500">
                    Saved {new Date(job.saved_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No saved jobs yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start saving jobs that interest you to keep track of opportunities and come back to them later.
            </p>
            <Link to="/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}