import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Building2, Users, Award, DollarSign, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Statistics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-statistics'],
    queryFn: async () => {
      // Get total jobs
      const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      // Get H1B jobs
      const { count: h1bJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('h1b_sponsorship_available', true)
        .eq('is_active', true)
      
      // Get total companies
      const { count: totalCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
      
      // Get active H1B sponsors
      const { count: activeSponsors } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('h1b_sponsor_status', 'active')
      
      // Get average approval rate
      const { data: approvalData } = await supabase
        .from('companies')
        .select('approval_rate')
        .not('approval_rate', 'is', null)
      
      const avgApprovalRate = approvalData && approvalData.length > 0
        ? approvalData.reduce((sum, company) => sum + (company.approval_rate || 0), 0) / approvalData.length
        : 0
      
      // Get average salary
      const { data: salaryData } = await supabase
        .from('jobs')
        .select('salary_min, salary_max')
        .eq('h1b_sponsorship_available', true)
        .not('salary_min', 'is', null)
        .not('salary_max', 'is', null)
      
      const avgSalary = salaryData && salaryData.length > 0
        ? salaryData.reduce((sum, job) => {
            const avgJobSalary = ((job.salary_min || 0) + (job.salary_max || 0)) / 2
            return sum + avgJobSalary
          }, 0) / salaryData.length
        : 0
      
      return {
        totalJobs: totalJobs || 0,
        h1bJobs: h1bJobs || 0,
        totalCompanies: totalCompanies || 0,
        activeSponsors: activeSponsors || 0,
        avgApprovalRate: Math.round(avgApprovalRate * 10) / 10,
        avgSalary: Math.round(avgSalary / 1000) * 1000
      }
    },
  })

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Statistics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 text-center animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const statItems = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      value: stats?.totalJobs?.toLocaleString() || '0',
      label: 'Total Jobs',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Award className="w-8 h-8 text-green-600" />,
      value: stats?.h1bJobs?.toLocaleString() || '0',
      label: 'H1B Jobs',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Building2 className="w-8 h-8 text-purple-600" />,
      value: stats?.totalCompanies?.toLocaleString() || '0',
      label: 'Companies',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-indigo-600" />,
      value: stats?.activeSponsors?.toLocaleString() || '0',
      label: 'Active Sponsors',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: <Award className="w-8 h-8 text-yellow-600" />,
      value: `${stats?.avgApprovalRate || 0}%`,
      label: 'Avg Approval Rate',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: <DollarSign className="w-8 h-8 text-emerald-600" />,
      value: stats?.avgSalary ? `$${(stats.avgSalary / 1000).toFixed(0)}k` : '$0',
      label: 'Avg Salary',
      color: 'from-emerald-500 to-emerald-600'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Platform Statistics
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time data from our comprehensive H1B jobs and companies database.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {statItems.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <div className="text-white">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Data updated in real-time from USCIS and Department of Labor sources
          </p>
        </div>
      </div>
    </section>
  )
}