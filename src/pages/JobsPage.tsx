import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, MapPin, DollarSign, Building2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, Job } from '../lib/supabase'
import { Button } from '../components/ui/button'
import JobCard from '../components/JobCard'
import JobFilters from '../components/JobFilters'

interface SearchFilters {
  query: string
  location: string
  h1bSponsorship: boolean
  experienceLevel: string[]
  industry: string[]
  jobType: string[]
  remoteWork: boolean
  salaryMin: string
  salaryMax: string
}

const JOBS_PER_PAGE = 20

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    h1bSponsorship: searchParams.get('h1b') === 'true',
    experienceLevel: searchParams.getAll('experience') || [],
    industry: searchParams.getAll('industry') || [],
    jobType: searchParams.getAll('type') || [],
    remoteWork: searchParams.get('remote') === 'true',
    salaryMin: searchParams.get('salary_min') || '',
    salaryMax: searchParams.get('salary_max') || ''
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.query) params.set('q', filters.query)
    if (filters.location) params.set('location', filters.location)
    if (filters.h1bSponsorship) params.set('h1b', 'true')
    if (filters.remoteWork) params.set('remote', 'true')
    if (filters.salaryMin) params.set('salary_min', filters.salaryMin)
    if (filters.salaryMax) params.set('salary_max', filters.salaryMax)
    
    filters.experienceLevel.forEach(level => params.append('experience', level))
    filters.industry.forEach(ind => params.append('industry', ind))
    filters.jobType.forEach(type => params.append('type', type))
    
    setSearchParams(params)
  }, [filters, setSearchParams])

  // Get total count for pagination
  const { data: totalJobsData } = useQuery({
    queryKey: ['jobs-count', JSON.stringify(filters)],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
      
      // Apply same filters for count
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,company_name.ilike.%${filters.query}%`)
      }
      
      if (filters.location) {
        query = query.or(`location.ilike.%${filters.location}%,city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
      }
      
      if (filters.h1bSponsorship) {
        query = query.eq('h1b_sponsorship_available', true)
      }
      
      if (filters.experienceLevel.length > 0) {
        query = query.in('experience_level', filters.experienceLevel)
      }
      
      if (filters.industry.length > 0) {
        query = query.in('industry', filters.industry)
      }
      
      if (filters.jobType.length > 0) {
        query = query.in('job_type', filters.jobType)
      }
      
      if (filters.remoteWork) {
        query = query.eq('remote_friendly', true)
      }
      
      if (filters.salaryMin) {
        query = query.gte('salary_min', parseInt(filters.salaryMin))
      }
      
      if (filters.salaryMax) {
        query = query.lte('salary_max', parseInt(filters.salaryMax))
      }
      
      const { count, error } = await query
      
      if (error) throw error
      return count || 0
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', JSON.stringify(filters), currentPage],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('posted_date', { ascending: false })
      
      // Apply filters
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,company_name.ilike.%${filters.query}%`)
      }
      
      if (filters.location) {
        query = query.or(`location.ilike.%${filters.location}%,city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
      }
      
      if (filters.h1bSponsorship) {
        query = query.eq('h1b_sponsorship_available', true)
      }
      
      if (filters.experienceLevel.length > 0) {
        query = query.in('experience_level', filters.experienceLevel)
      }
      
      if (filters.industry.length > 0) {
        query = query.in('industry', filters.industry)
      }
      
      if (filters.jobType.length > 0) {
        query = query.in('job_type', filters.jobType)
      }
      
      if (filters.remoteWork) {
        query = query.eq('remote_friendly', true)
      }
      
      if (filters.salaryMin) {
        query = query.gte('salary_min', parseInt(filters.salaryMin))
      }
      
      if (filters.salaryMax) {
        query = query.lte('salary_max', parseInt(filters.salaryMax))
      }
      
      // Add pagination
      const from = (currentPage - 1) * JOBS_PER_PAGE
      const to = from + JOBS_PER_PAGE - 1
      
      const { data, error } = await query.range(from, to)
      
      if (error) throw error
      return data as Job[]
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // Force refetch when filters change
  useEffect(() => {
    refetch()
  }, [filters, refetch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The search will trigger automatically due to the useEffect
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      h1bSponsorship: false,
      experienceLevel: [],
      industry: [],
      jobType: [],
      remoteWork: false,
      salaryMin: '',
      salaryMax: ''
    })
    setCurrentPage(1)
  }

  // Pagination calculations
  const totalJobs = totalJobsData || 0
  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE)
  const startJob = (currentPage - 1) * JOBS_PER_PAGE + 1
  const endJob = Math.min(currentPage * JOBS_PER_PAGE, totalJobs)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFiltersCount = [
    filters.h1bSponsorship,
    filters.remoteWork,
    filters.experienceLevel.length > 0,
    filters.industry.length > 0,
    filters.jobType.length > 0,
    filters.salaryMin,
    filters.salaryMax
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Find H1B Jobs</h1>
            <p className="text-gray-600">Discover opportunities with companies that sponsor H1B visas</p>
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Job title, company, keywords..."
                  value={filters.query}
                  onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="City, state, or remote"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 py-3"
              >
                Search Jobs
              </Button>
            </div>
          </form>
          
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <JobFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            </div>
          )}
          
          {/* Job Results */}
          <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isLoading ? 'Loading...' : `${totalJobs} jobs found`}
                </h2>
                {!isLoading && totalJobs > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {startJob}-{endJob} of {totalJobs} jobs
                  </p>
                )}
                {filters.h1bSponsorship && (
                  <p className="text-sm text-blue-600 mt-1">
                    Showing only H1B sponsorship available positions
                  </p>
                )}
              </div>
            </div>
            
            {/* Job Listings */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
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
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Error loading jobs. Please try again.</p>
              </div>
            ) : jobs && jobs.length > 0 ? (
              <>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-8">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startJob}</span> to{' '}
                          <span className="font-medium">{endJob}</span> of{' '}
                          <span className="font-medium">{totalJobs}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                          </Button>
                          
                          {/* Page numbers */}
                          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let pageNumber
                            if (totalPages <= 7) {
                              pageNumber = i + 1
                            } else if (currentPage <= 4) {
                              pageNumber = i + 1
                            } else if (currentPage >= totalPages - 3) {
                              pageNumber = totalPages - 6 + i
                            } else {
                              pageNumber = currentPage - 3 + i
                            }
                            
                            return (
                              <Button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold"
                              >
                                {pageNumber}
                              </Button>
                            )
                          })}
                          
                          <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                          </Button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}