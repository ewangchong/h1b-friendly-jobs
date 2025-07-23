import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck, Trash2, ExternalLink, Filter, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Job } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { formatSalary, getRelativeTime, getH1BSponsorshipBadge } from '../lib/utils'
import toast from 'react-hot-toast'
import { Navigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface SavedJob {
  id: string
  job_id: string
  saved_at: string
  jobs: Job
}

export default function SavedJobsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'h1b' | 'recent'>('all')

  const { data: savedJobs, isLoading } = useQuery({
    queryKey: ['saved-jobs', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('saved_jobs')
        .select(`
          id,
          job_id,
          saved_at,
          jobs (
            id,
            title,
            company_name,
            location,
            salary_min,
            salary_max,
            experience_level,
            job_type,
            remote_friendly,
            h1b_sponsorship_available,
            h1b_sponsorship_confidence,
            posted_date,
            source_url,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })
      
      if (error) throw error
      return (data || []) as unknown as SavedJob[]
    },
    enabled: !!user
  })

  const removeSavedJobMutation = useMutation({
    mutationFn: async (savedJobId: string) => {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('id', savedJobId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast.success('Job removed from saved jobs')
    },
    onError: (error: any) => {
      toast.error('Failed to remove job')
    }
  })

  const clearAllSavedJobsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast.success('All saved jobs cleared')
    },
    onError: (error: any) => {
      toast.error('Failed to clear saved jobs')
    }
  })

  const filteredJobs = savedJobs?.filter(savedJob => {
    const job = savedJob.jobs
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        job.title.toLowerCase().includes(searchLower) ||
        job.company_name.toLowerCase().includes(searchLower) ||
        job.location?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }
    
    // Apply category filter
    switch (selectedFilter) {
      case 'h1b':
        return job.h1b_sponsorship_available
      case 'recent':
        const savedDate = new Date(savedJob.saved_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return savedDate > weekAgo
      default:
        return true
    }
  })

  const handleRemoveJob = (savedJobId: string) => {
    if (window.confirm('Are you sure you want to remove this job from your saved list?')) {
      removeSavedJobMutation.mutate(savedJobId)
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove ALL saved jobs? This action cannot be undone.')) {
      clearAllSavedJobsMutation.mutate()
    }
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Bookmark className="w-8 h-8 mr-3 text-blue-600" />
              Saved Jobs
            </h1>
            <p className="text-gray-600 mt-2">
              {savedJobs?.length || 0} job{savedJobs?.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          
          {savedJobs && savedJobs.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={clearAllSavedJobsMutation.isPending}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        {savedJobs && savedJobs.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search saved jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'All Jobs', count: savedJobs.length },
                  { key: 'h1b', label: 'H1B Friendly', count: savedJobs.filter(j => j.jobs.h1b_sponsorship_available).length },
                  { key: 'recent', label: 'Saved This Week', count: savedJobs.filter(j => {
                    const savedDate = new Date(j.saved_at)
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    return savedDate > weekAgo
                  }).length }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedFilter === filter.key
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Job List */}
        {!savedJobs || savedJobs.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No saved jobs yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start browsing jobs and save the ones you're interested in!
            </p>
            <Link to="/jobs">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Browse Jobs
              </Button>
            </Link>
          </div>
        ) : filteredJobs?.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No jobs match your search
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedFilter('all')
              }}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((savedJob) => {
              const job = savedJob.jobs
              const h1bBadge = getH1BSponsorshipBadge(job.h1b_sponsorship_available, job.h1b_sponsorship_confidence)
              
              return (
                <div key={savedJob.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <Link to={`/jobs/${job.id}`} className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                            {job.title}
                          </h3>
                        </Link>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveJob(savedJob.id)}
                            disabled={removeSavedJobMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Link to={`/companies/${job.company_name}`} className="text-gray-600 hover:text-gray-900 transition-colors mb-3 block">
                        <span className="font-medium">{job.company_name}</span>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`h1b-badge ${h1bBadge.color}`}>
                      {h1bBadge.text}
                    </span>
                    {job.experience_level && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {job.experience_level}
                      </span>
                    )}
                    {job.remote_friendly && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Remote OK
                      </span>
                    )}
                  </div>
                  
                  {/* Job Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                    {job.location && (
                      <div className="flex items-center">
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                    {(job.salary_min || job.salary_max) && (
                      <div className="flex items-center">
                        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span>Saved {getRelativeTime(savedJob.saved_at)}</span>
                    </div>
                  </div>
                  
                  {/* Job Description Preview */}
                  {job.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {job.description.length > 150 
                        ? `${job.description.substring(0, 150)}...` 
                        : job.description
                      }
                    </p>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Link to={`/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    
                    {job.source_url && (
                      <a 
                        href={job.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Apply on company site
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
