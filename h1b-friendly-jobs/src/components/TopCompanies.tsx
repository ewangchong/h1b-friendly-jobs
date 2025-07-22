import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building2, MapPin, TrendingUp, Users } from 'lucide-react'
import { supabase, Company } from '../lib/supabase'
import { Button } from './ui/button'

export default function TopCompanies() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ['top-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('h1b_sponsor_status', 'active')
        .not('approval_rate', 'is', null)
        .order('total_h1b_approvals', { ascending: false })
        .limit(8)
      
      if (error) throw error
      return data as Company[]
    },
  })

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Top H1B Sponsors</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Top H1B Sponsors
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore companies with the highest H1B approval rates and sponsorship volumes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {companies?.map((company) => (
            <Link key={company.id} to={`/companies/${company.id}`} className="block">
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors hover:shadow-md">
                <div className="flex items-center mb-4">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={`${company.name} logo`}
                      className="w-12 h-12 rounded-lg object-cover mr-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm ${company.logo_url ? 'hidden' : ''}`}>
                    {company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                      {company.name}
                    </h3>
                    {company.industry && (
                      <p className="text-gray-600 text-xs">{company.industry}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Approval Rate</span>
                    <span className="font-semibold text-green-600">
                      {company.approval_rate ? `${company.approval_rate.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Approvals</span>
                    <span className="font-semibold text-blue-600">
                      {company.total_h1b_approvals?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  
                  {company.location && (
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="truncate">{company.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last Filing: {company.last_h1b_filing_year}</span>
                    <span className="text-green-600 font-medium">Active Sponsor</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/companies">
            <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              View All Companies
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}