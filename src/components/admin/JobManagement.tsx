import { useState, useEffect } from 'react'
import { Edit, Trash2, Eye, Flag, CheckCircle, XCircle, Plus, Search, Filter } from 'lucide-react'
import { supabase, Job } from '../../lib/supabase'
import { Button } from '../ui/button'
import { formatSalary, getRelativeTime } from '../../lib/utils'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface JobWithFeedback extends Job {
  job_quality_scores?: {
    positive_feedback_count: number
    negative_feedback_count: number
    h1b_accuracy_score: number
    overall_quality_score: number
    needs_review: boolean
  }
  feedback_count?: number
}

interface JobManagementProps {
  onEditJob: (job: Job) => void
  onCreateJob: () => void
}

export default function JobManagement({ onEditJob, onCreateJob }: JobManagementProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'flagged'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const JOBS_PER_PAGE = 20

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['admin-jobs', searchQuery, statusFilter, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          job_quality_scores(
            positive_feedback_count,
            negative_feedback_count,
            h1b_accuracy_score,
            overall_quality_score,
            needs_review
          )
        `)
        .order('created_at', { ascending: false })
      
      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
      }
      
      // Apply status filter
      switch (statusFilter) {
        case 'active':
          query = query.eq('is_active', true)
          break
        case 'inactive':
          query = query.eq('is_active', false)
          break
        case 'flagged':
          // We'll filter this after getting the data since it involves checking quality scores
          break
      }
      
      // Add pagination
      const from = (currentPage - 1) * JOBS_PER_PAGE
      const to = from + JOBS_PER_PAGE - 1
      
      const { data, error, count } = await query.range(from, to)
      
      if (error) throw error
      
      let filteredData = data as JobWithFeedback[]
      
      // Apply flagged filter if needed
      if (statusFilter === 'flagged') {
        filteredData = filteredData.filter(job => 
          job.job_quality_scores && job.job_quality_scores.needs_review
        )
      }
      
      return {
        jobs: filteredData,
        total: count || 0
      }
    },
    refetchOnWindowFocus: false
  })

  const toggleJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string, isActive: boolean }) => {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', jobId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      toast.success('Job status updated successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to update job status')
    }
  })

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      toast.success('Job deleted successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to delete job')
    }
  })

  const markAsReviewedMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('job_quality_scores')
        .update({ needs_review: false })
        .eq('job_id', jobId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      toast.success('Job marked as reviewed')
    },
    onError: (error: any) => {
      toast.error('Failed to mark job as reviewed')
    }
  })

  const handleToggleStatus = (job: Job) => {
    const action = job.is_active ? 'deactivate' : 'activate'
    if (window.confirm(`Are you sure you want to ${action} this job?`)) {
      toggleJobStatusMutation.mutate({ jobId: job.id, isActive: job.is_active })
    }
  }

  const handleDeleteJob = (job: Job) => {
    if (window.confirm(`Are you sure you want to permanently delete "${job.title}" at ${job.company_name}? This action cannot be undone.`)) {
      deleteJobMutation.mutate(job.id)
    }
  }

  const totalPages = Math.ceil((jobsData?.total || 0) / JOBS_PER_PAGE)
  const jobs = jobsData?.jobs || []

  const getStatusBadge = (job: JobWithFeedback) => {
    if (job.job_quality_scores?.needs_review) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Flagged</span>
    }
    if (job.is_active) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
  }

  const getQualityIndicator = (job: JobWithFeedback) => {
    const scores = job.job_quality_scores
    if (!scores) return null
    
    const totalFeedback = scores.positive_feedback_count + scores.negative_feedback_count
    if (totalFeedback === 0) return null
    
    if (scores.overall_quality_score >= 0.8) {
      return <span className="text-green-600 text-sm">✓ High Quality</span>
    } else if (scores.overall_quality_score >= 0.6) {
      return <span className="text-yellow-600 text-sm">⚠ Medium Quality</span>
    } else {
      return <span className="text-red-600 text-sm">✗ Low Quality</span>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Jobs</option>
            <option value="active">Active Jobs</option>
            <option value="inactive">Inactive Jobs</option>
            <option value="flagged">Flagged Jobs</option>
          </select>
        </div>
        
        <Button
          onClick={onCreateJob}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Job</span>
        </Button>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {jobs.length} of {jobsData?.total || 0} jobs
        </span>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1">
                    {job.title}
                  </h3>
                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusBadge(job)}
                    {getQualityIndicator(job)}
                  </div>
                </div>
                
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">{job.company_name}</span>
                  {job.location && <span className="ml-2">• {job.location}</span>}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Posted {getRelativeTime(job.posted_date)}</span>
                  {(job.salary_min || job.salary_max) && (
                    <span>• {formatSalary(job.salary_min, job.salary_max)}</span>
                  )}
                  {job.job_quality_scores && (
                    <span>• {job.job_quality_scores.positive_feedback_count + job.job_quality_scores.negative_feedback_count} feedback</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* H1B Status */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                job.h1b_sponsorship_available 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {job.h1b_sponsorship_available ? '✓ H1B Friendly' : '✗ No H1B Sponsorship'}
                {job.h1b_sponsorship_confidence && (
                  <span className="ml-1">({Math.round(job.h1b_sponsorship_confidence * 100)}%)</span>
                )}
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                  className="flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditJob(job)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(job)}
                  disabled={toggleJobStatusMutation.isPending}
                  className={`flex items-center space-x-1 ${
                    job.is_active 
                      ? 'text-red-600 border-red-200 hover:bg-red-50' 
                      : 'text-green-600 border-green-200 hover:bg-green-50'
                  }`}
                >
                  {job.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  <span>{job.is_active ? 'Deactivate' : 'Activate'}</span>
                </Button>
                
                {job.job_quality_scores?.needs_review && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsReviewedMutation.mutate(job.id)}
                    disabled={markAsReviewedMutation.isPending}
                    className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Mark Reviewed</span>
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteJob(job)}
                disabled={deleteJobMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
