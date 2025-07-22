import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Building2, TrendingUp, MapPin, Users, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, Company } from '../lib/supabase'
import { Button } from '../components/ui/button'

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'approvals' | 'rate' | 'name'>('approvals')

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', searchQuery, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('*')
        .eq('h1b_sponsor_status', 'active')
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'approvals':
          query = query.order('total_h1b_approvals', { ascending: false })
          break
        case 'rate':
          query = query.order('approval_rate', { ascending: false })
          break
        case 'name':
          query = query.order('name', { ascending: true })
          break
      }
      
      const { data, error } = await query.limit(100)
      
      if (error) throw error
      return data as Company[]
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search will trigger automatically due to useQuery dependency
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              H1B Sponsor Companies
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore companies with proven H1B sponsorship track records. Find employers who actively support international talent.
            </p>
          </div>
          
          {/* Search and Sort */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search companies, industries, locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'approvals' | 'rate' | 'name')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="approvals">Most H1B Approvals</option>
                  <option value="rate">Highest Approval Rate</option>
                  <option value="name">Company Name (A-Z)</option>
                </select>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : companies && companies.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {companies.length} Active H1B Sponsors
              </h2>
              <p className="text-gray-600 mt-1">
                Companies with recent H1B sponsorship activity
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <Link key={company.id} to={`/companies/${company.id}`} className="block">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 h-full">
                    <div className="flex items-center mb-4">
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url} 
                          alt={`${company.name} logo`}
                          className="w-16 h-16 rounded-lg object-cover mr-4"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-4 ${company.logo_url ? 'hidden' : ''}`}>
                        {company.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                          {company.name}
                        </h3>
                        {company.industry && (
                          <p className="text-gray-600 text-sm truncate">
                            {company.industry}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          Approval Rate
                        </span>
                        <span className="font-semibold text-green-600">
                          {company.approval_rate ? `${company.approval_rate.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Total Approvals
                        </span>
                        <span className="font-semibold text-blue-600">
                          {company.total_h1b_approvals?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Company Size
                        </span>
                        <span className="font-medium text-gray-900 text-sm">
                          {company.size_category || 'Not specified'}
                        </span>
                      </div>
                      
                      {company.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-gray-600 text-sm truncate">
                            {company.location}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {company.description && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {company.description}
                      </p>
                    )}
                    
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Last Filing: {company.last_h1b_filing_year || 'N/A'}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          Active Sponsor
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No companies found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria
            </p>
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear search
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}