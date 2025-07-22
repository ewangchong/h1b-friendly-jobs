import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck,
  ArrowLeft,
  Calendar,
  Users,
  Award
} from 'lucide-react'
import { supabase, Job } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatSalary, getRelativeTime, getH1BSponsorshipBadge, getExperienceLevelColor, formatDate } from '../lib/utils'
import { Button } from '../components/ui/button'
import toast from 'react-hot-toast'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) throw new Error('Job ID is required')
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (error) throw error
      if (!data) throw new Error('Job not found')
      
      return data as Job
    },
    enabled: !!id
  })

  // Fetch company details
  const { data: company } = useQuery({
    queryKey: ['company', job?.company_id],
    queryFn: async () => {
      if (!job?.company_id) return null
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', job.company_id)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!job?.company_id
  })

  // Check if job is saved
  const { data: savedJob } = useQuery({
    queryKey: ['saved-job', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null
      
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', id)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!user && !!id
  })

  // Update bookmark state when data changes
  useEffect(() => {
    setIsBookmarked(!!savedJob)
  }, [savedJob])

  // Fetch similar jobs
  const { data: similarJobs } = useQuery({
    queryKey: ['similar-jobs', job?.company_name, job?.industry],
    queryFn: async () => {
      if (!job) return []
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .neq('id', job.id)
        .eq('is_active', true)
        .or(`company_name.eq.${job.company_name},industry.eq.${job.industry}`)
        .limit(4)
      
      if (error) throw error
      return data as Job[]
    },
    enabled: !!job
  })

  const saveJobMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Must be logged in to save jobs')
      
      if (isBookmarked) {
        // Remove from saved jobs
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', id)
        
        if (error) throw error
      } else {
        // Add to saved jobs
        const { error } = await supabase
          .from('saved_jobs')
          .insert({
            user_id: user.id,
            job_id: id,
            saved_at: new Date().toISOString()
          })
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked)
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast.success(isBookmarked ? 'Job removed from saved jobs' : 'Job saved successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save job')
    }
  })

  const handleSaveJob = () => {
    if (!user) {
      toast.error('Please sign in to save jobs')
      return
    }
    
    saveJobMutation.mutate()
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h1>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Link to="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </div>
      </div>
    )
  }

  const h1bBadge = getH1BSponsorshipBadge(job.h1b_sponsorship_available, job.h1b_sponsorship_confidence)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to="/jobs" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to jobs
        </Link>

        {/* Job Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {job.title}
              </h1>
              
              <Link to={`/companies/${job.company_id}`} className="flex items-center text-xl text-gray-700 hover:text-gray-900 transition-colors mb-4">
                <Building2 className="w-5 h-5 mr-2" />
                {job.company_name}
              </Link>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className={`h1b-badge ${h1bBadge.color}`}>
                  {h1bBadge.text}
                </span>
                {job.experience_level && (
                  <span className={`experience-badge ${getExperienceLevelColor(job.experience_level)}`}>
                    {job.experience_level}
                  </span>
                )}
                {job.remote_friendly && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Remote OK
                  </span>
                )}
                {job.job_type && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {job.job_type}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 ml-6">
              <Button
                variant="outline"
                onClick={handleSaveJob}
                disabled={saveJobMutation.isPending}
                className="flex items-center space-x-2"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                <span>{isBookmarked ? 'Saved' : 'Save Job'}</span>
              </Button>
              
              {job.source_url && (
                <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                  <Button className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Apply Now</span>
                  </Button>
                </a>
              )}
            </div>
          </div>
          
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            {job.location && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{job.location}</span>
              </div>
            )}
            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-4 h-4 mr-2" />
                <span>{formatSalary(job.salary_min, job.salary_max)}</span>
              </div>
            )}
            {job.posted_date && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>Posted {getRelativeTime(job.posted_date)}</span>
              </div>
            )}
            {job.expires_date && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Expires {formatDate(job.expires_date)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            {job.description && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              </div>
            )}
            
            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {job.requirements}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Company Info */}
            {company && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About {company.name}</h3>
                
                <div className="flex items-center mb-4">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={`${company.name} logo`}
                      className="w-12 h-12 rounded-lg object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    {company.industry && (
                      <p className="text-sm text-gray-600">{company.industry}</p>
                    )}
                  </div>
                </div>
                
                {company.description && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-4">
                    {company.description}
                  </p>
                )}
                
                <div className="space-y-3 text-sm">
                  {company.approval_rate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        H1B Approval Rate
                      </span>
                      <span className="font-semibold text-green-600">
                        {company.approval_rate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  
                  {company.total_h1b_approvals && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Total H1B Approvals
                      </span>
                      <span className="font-semibold text-blue-600">
                        {company.total_h1b_approvals.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {company.size_category && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Company Size</span>
                      <span className="font-medium text-gray-900">
                        {company.size_category}
                      </span>
                    </div>
                  )}
                </div>
                
                <Link to={`/companies/${company.id}`} className="block mt-4">
                  <Button variant="outline" className="w-full">
                    View Company Profile
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Similar Jobs */}
            {similarJobs && similarJobs.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Jobs</h3>
                <div className="space-y-3">
                  {similarJobs.map((similarJob) => (
                    <Link key={similarJob.id} to={`/jobs/${similarJob.id}`} className="block">
                      <div className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {similarJob.title}
                        </h4>
                        <p className="text-gray-600 text-xs mb-2">{similarJob.company_name}</p>
                        {similarJob.location && (
                          <p className="text-gray-500 text-xs flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {similarJob.location}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}