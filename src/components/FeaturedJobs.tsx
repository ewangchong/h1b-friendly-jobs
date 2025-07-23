import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapPin, Clock, DollarSign, Building2 } from 'lucide-react'
import { supabase, Job } from '../lib/supabase'
import { formatSalary, getRelativeTime, getH1BSponsorshipBadge, getExperienceLevelColor } from '../lib/utils'
import { Button } from './ui/button'

export default function FeaturedJobs() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('h1b_sponsorship_available', true)
        .eq('is_active', true)
        .order('h1b_sponsorship_confidence', { ascending: false })
        .limit(6)
      
      if (error) throw error
      return data as Job[]
    },
  })

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured H1B Jobs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured H1B Jobs
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the latest opportunities from companies with strong H1B sponsorship track records.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {jobs?.map((job) => {
            const h1bBadge = getH1BSponsorshipBadge(job.h1b_sponsorship_available, job.h1b_sponsorship_confidence)
            
            return (
              <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                        {job.title}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span className="font-medium">{job.company_name}</span>
                      </div>
                    </div>
                  </div>
                  
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
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {job.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {(job.salary_min || job.salary_max) && (
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                      </div>
                    )}
                    {job.posted_date && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{getRelativeTime(job.posted_date)}</span>
                      </div>
                    )}
                  </div>
                  
                  {job.description && (
                    <p className="text-gray-600 text-sm mt-4 line-clamp-3">
                      {job.description.substring(0, 120)}...
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
        
        <div className="text-center">
          <Link to="/jobs?h1b=true">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              View All H1B Jobs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}