import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, DollarSign, Building2, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Job, supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatSalary, getRelativeTime, getH1BSponsorshipBadge, getExperienceLevelColor } from '../lib/utils'
import { Button } from './ui/button'
import toast from 'react-hot-toast'

interface JobCardProps {
  job: Job
  showSaveButton?: boolean
  isSaved?: boolean
}

export default function JobCard({ job, showSaveButton = true, isSaved = false }: JobCardProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isBookmarked, setIsBookmarked] = useState(isSaved)
  
  const h1bBadge = getH1BSponsorshipBadge(job.h1b_sponsorship_available, job.h1b_sponsorship_confidence)

  const saveJobMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in to save jobs')
      
      // Get current auth status to ensure user is still authenticated
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !currentUser) {
        throw new Error('Authentication expired. Please sign in again.')
      }
      
      if (isBookmarked) {
        // Remove from saved jobs
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('job_id', job.id)
        
        if (error) throw new Error(`Failed to remove job: ${error.message}`)
      } else {
        // Add to saved jobs
        const { error } = await supabase
          .from('saved_jobs')
          .insert({
            user_id: currentUser.id,
            job_id: job.id,
            saved_at: new Date().toISOString()
          })
        
        if (error) {
          if (error.code === '23505') { // Duplicate key error
            throw new Error('Job is already saved')
          }
          throw new Error(`Failed to save job: ${error.message}`)
        }
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked)
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast.success(isBookmarked ? 'Job removed from saved jobs' : 'Job saved successfully')
    },
    onError: (error: any) => {
      if (error.message.includes('Authentication expired')) {
        toast.error('Please sign in again to save jobs')
        // Optionally could redirect to login here
      } else if (error.message.includes('Job is already saved')) {
        toast.error('This job is already in your saved jobs')
      } else {
        toast.error(error.message || 'Failed to save job')
      }
    }
  })

  const handleSaveJob = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.error('Please sign in to save jobs')
      return
    }
    
    saveJobMutation.mutate()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <Link to={`/jobs/${job.id}`} className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                {job.title}
              </h3>
            </Link>
            {showSaveButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveJob}
                disabled={saveJobMutation.isPending}
                className="ml-2 p-2 hover:bg-gray-100"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5 text-blue-600" />
                ) : (
                  <Bookmark className="w-5 h-5 text-gray-400" />
                )}
              </Button>
            )}
          </div>
          
          <Link to={`/companies/${job.company_id}`} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-3">
            <Building2 className="w-4 h-4 mr-2" />
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
          <span className={`experience-badge ${getExperienceLevelColor(job.experience_level)}`}>
            {job.experience_level}
          </span>
        )}
        {job.remote_friendly && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Remote OK
          </span>
        )}
        {job.job_type && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {job.job_type}
          </span>
        )}
      </div>
      
      {/* Job Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
        {job.location && (
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
        {(job.salary_min || job.salary_max) && (
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
            <span>{formatSalary(job.salary_min, job.salary_max)}</span>
          </div>
        )}
        {job.posted_date && (
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>{getRelativeTime(job.posted_date)}</span>
          </div>
        )}
      </div>
      
      {/* Job Description Preview */}
      {job.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {job.description.length > 200 
            ? `${job.description.substring(0, 200)}...` 
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
}