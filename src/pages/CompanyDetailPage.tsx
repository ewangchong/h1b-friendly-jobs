import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft,
  ExternalLink,
  MapPin,
  Users,
  Award,
  TrendingUp,
  Building2,
  Calendar,
  DollarSign,
  Briefcase
} from 'lucide-react'
import { supabase, Company, Job, H1BHistory } from '../lib/supabase'
import { Button } from '../components/ui/button'
import JobCard from '../components/JobCard'
import { formatSalary } from '../lib/utils'

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()

  // Fetch company details
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) throw new Error('Company ID is required')
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (error) throw error
      if (!data) throw new Error('Company not found')
      
      return data as Company
    },
    enabled: !!id
  })

  // Fetch company jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['company-jobs', company?.name],
    queryFn: async () => {
      if (!company?.name) return []
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_name', company.name)
        .eq('is_active', true)
        .order('posted_date', { ascending: false })
        .limit(20)
      
      if (error) throw error
      return data as Job[]
    },
    enabled: !!company?.name
  })

  // Fetch H1B history
  const { data: h1bHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['company-h1b-history', company?.name],
    queryFn: async () => {
      if (!company?.name) return []
      
      const { data, error } = await supabase
        .from('h1b_history')
        .select('*')
        .eq('company_name', company.name)
        .order('filing_year', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data as H1BHistory[]
    },
    enabled: !!company?.name
  })

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-lg mr-6"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
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

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Company not found</h1>
          <p className="text-gray-600 mb-4">The company you're looking for doesn't exist.</p>
          <Link to="/companies">
            <Button>Browse Companies</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Calculate H1B statistics
  const h1bStats = h1bHistory?.reduce((acc, record) => {
    acc.totalFilings += 1
    if (record.case_status === 'Certified') {
      acc.approvals += 1
    }
    
    // Group by year
    if (!acc.byYear[record.filing_year]) {
      acc.byYear[record.filing_year] = { total: 0, approved: 0 }
    }
    acc.byYear[record.filing_year].total += 1
    if (record.case_status === 'Certified') {
      acc.byYear[record.filing_year].approved += 1
    }
    
    // Wage statistics
    if (record.wage_rate_from) {
      acc.wages.push(record.wage_rate_from)
    }
    
    return acc
  }, {
    totalFilings: 0,
    approvals: 0,
    byYear: {} as Record<number, { total: number, approved: number }>,
    wages: [] as number[]
  }) || { totalFilings: 0, approvals: 0, byYear: {}, wages: [] }

  const avgWage = h1bStats.wages.length > 0 
    ? h1bStats.wages.reduce((sum, wage) => sum + wage, 0) / h1bStats.wages.length
    : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to="/companies" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to companies
        </Link>

        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={`${company.name} logo`}
                  className="w-20 h-20 rounded-lg object-cover mr-6"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mr-6 ${company.logo_url ? 'hidden' : ''}`}>
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {company.name}
                </h1>
                {company.industry && (
                  <p className="text-xl text-gray-600 mb-2">{company.industry}</p>
                )}
                {company.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{company.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            {company.website_url && (
              <a href={company.website_url} target="_blank" rel="noopener noreferrer">
                <Button className="flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit Website</span>
                </Button>
              </a>
            )}
          </div>
          
          {company.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed">
                {company.description}
              </p>
            </div>
          )}
          
          {/* Company Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {company.approval_rate ? `${company.approval_rate.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Approval Rate</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {company.total_h1b_approvals?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Total Approvals</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {company.size_category || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Company Size</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {company.last_h1b_filing_year || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Last H1B Filing</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Jobs */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Current Openings</h2>
              
              {jobsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No current job openings at this company.</p>
                </div>
              )}
            </div>
            
            {/* H1B History */}
            {h1bHistory && h1bHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">H1B Filing History</h2>
                
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {h1bStats.approvals}
                      </div>
                      <div className="text-sm text-gray-600">Total Approvals</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {h1bStats.totalFilings}
                      </div>
                      <div className="text-sm text-gray-600">Total Filings</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {avgWage > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(avgWage) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Avg. Wage</div>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Wage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {h1bHistory.slice(0, 10).map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.filing_year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.job_title || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.case_status === 'Certified' 
                                ? 'bg-green-100 text-green-800'
                                : record.case_status === 'Denied'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.case_status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.work_location || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.wage_rate_from 
                              ? formatSalary(record.wage_rate_from, record.wage_rate_to)
                              : 'N/A'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {h1bHistory.length > 10 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Showing 10 of {h1bHistory.length} H1B filing records
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Industry</span>
                  <span className="font-medium text-gray-900">
                    {company.industry || 'Not specified'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">H1B Status</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    company.h1b_sponsor_status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {company.h1b_sponsor_status === 'active' ? 'Active Sponsor' : 'Inactive'}
                  </span>
                </div>
                
                {jobs && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Open Positions</span>
                    <span className="font-medium text-gray-900">
                      {jobs.length}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total H1B Petitions</span>
                  <span className="font-medium text-gray-900">
                    {company.total_h1b_petitions?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <Link to={`/jobs?company=${encodeURIComponent(company.name)}`} className="block">
                  <Button variant="outline" className="w-full">
                    View All Jobs
                  </Button>
                </Link>
                
                {company.website_url && (
                  <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Company Website
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}