import { useState, useEffect } from 'react'
import { X, Save, MapPin, DollarSign, Building2, Calendar, Link as LinkIcon } from 'lucide-react'
import { supabase, Job } from '../../lib/supabase'
import { Button } from '../ui/button'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface JobEditorProps {
  job?: Job | null
  isOpen: boolean
  onClose: () => void
}

interface JobFormData {
  title: string
  company_name: string
  location: string
  description: string
  requirements: string
  salary_min: number | null
  salary_max: number | null
  experience_level: string
  job_type: string
  industry: string
  remote_friendly: boolean
  h1b_sponsorship_available: boolean
  h1b_sponsorship_confidence: number
  source_url: string
  posted_date: string
  is_active: boolean
}

const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Director']
const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship']
const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Media & Entertainment',
  'Automotive',
  'Consulting',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate'
]

export default function JobEditor({ job, isOpen, onClose }: JobEditorProps) {
  const queryClient = useQueryClient()
  const isEditing = !!job
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company_name: '',
    location: '',
    description: '',
    requirements: '',
    salary_min: null,
    salary_max: null,
    experience_level: '',
    job_type: 'full-time',
    industry: '',
    remote_friendly: false,
    h1b_sponsorship_available: true,
    h1b_sponsorship_confidence: 1.0,
    source_url: '',
    posted_date: new Date().toISOString().split('T')[0],
    is_active: true
  })

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        company_name: job.company_name || '',
        location: job.location || '',
        description: job.description || '',
        requirements: job.requirements || '',
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        experience_level: job.experience_level || '',
        job_type: job.job_type || 'full-time',
        industry: job.industry || '',
        remote_friendly: job.remote_friendly || false,
        h1b_sponsorship_available: job.h1b_sponsorship_available || false,
        h1b_sponsorship_confidence: job.h1b_sponsorship_confidence || 1.0,
        source_url: job.source_url || '',
        posted_date: job.posted_date ? new Date(job.posted_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        is_active: job.is_active ?? true
      })
    } else {
      // Reset form for new job
      setFormData({
        title: '',
        company_name: '',
        location: '',
        description: '',
        requirements: '',
        salary_min: null,
        salary_max: null,
        experience_level: '',
        job_type: 'full-time',
        industry: '',
        remote_friendly: false,
        h1b_sponsorship_available: true,
        h1b_sponsorship_confidence: 1.0,
        source_url: '',
        posted_date: new Date().toISOString().split('T')[0],
        is_active: true
      })
    }
  }, [job])

  const saveJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const jobData = {
        ...data,
        posted_date: new Date(data.posted_date).toISOString(),
        updated_at: new Date().toISOString(),
        ...(isEditing ? {} : { created_at: new Date().toISOString() })
      }

      if (isEditing) {
        const { error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', job!.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('jobs')
          .insert([jobData])
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      toast.success(isEditing ? 'Job updated successfully' : 'Job created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} job: ${error.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Job title is required')
      return
    }
    if (!formData.company_name.trim()) {
      toast.error('Company name is required')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Job description is required')
      return
    }
    
    saveJobMutation.mutate(formData)
  }

  const handleChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Job' : 'Create New Job'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Google"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posted Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.posted_date}
                    onChange={(e) => handleChange('posted_date', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Job Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => handleChange('experience_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select level</option>
                    {EXPERIENCE_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <select
                    value={formData.job_type}
                    onChange={(e) => handleChange('job_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {JOB_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Salary ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={formData.salary_min || ''}
                      onChange={(e) => handleChange('salary_min', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="80000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Salary ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={formData.salary_max || ''}
                      onChange={(e) => handleChange('salary_max', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="120000"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="url"
                    value={formData.source_url}
                    onChange={(e) => handleChange('source_url', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://company.com/careers"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text Areas */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed job description..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => handleChange('requirements', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Job requirements and qualifications..."
              />
            </div>
          </div>

          {/* Checkboxes and Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Job Settings</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Job is active</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.remote_friendly}
                    onChange={(e) => handleChange('remote_friendly', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Remote friendly</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">H1B Information</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.h1b_sponsorship_available}
                    onChange={(e) => handleChange('h1b_sponsorship_available', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">H1B sponsorship available</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    H1B Confidence Score (0.0 - 1.0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.h1b_sponsorship_confidence}
                    onChange={(e) => handleChange('h1b_sponsorship_confidence', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveJobMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saveJobMutation.isPending ? 'Saving...' : isEditing ? 'Update Job' : 'Create Job'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
