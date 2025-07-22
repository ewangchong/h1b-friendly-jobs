import { useState, useEffect } from 'react'
import { Activity, Database, Clock, AlertTriangle, Play, Pause, Download, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import toast from 'react-hot-toast'

interface AdminStats {
  total_jobs: number
  active_jobs: number
  h1b_jobs: number
  total_companies: number
  h1b_companies: number
  recent_runs: any[]
  sources_status: any[]
  error_summary: any[]
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrapingInProgress, setScrapingInProgress] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scraping-admin', {
        body: { action: 'dashboard' }
      })
      
      if (error) throw error
      setStats(data.data)
    } catch (error: any) {
      toast.error(`Failed to load dashboard: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const triggerScraping = async (sourceIds: string[] = []) => {
    setScrapingInProgress(true)
    try {
      const { data, error } = await supabase.functions.invoke('scraping-admin', {
        body: { 
          action: 'trigger_scraping',
          source_ids: sourceIds,
          force: true
        }
      })
      
      if (error) throw error
      
      toast.success(`Scraping triggered successfully. ${data.data.runs_executed} runs started.`)
      
      // Reload dashboard after a delay
      setTimeout(() => {
        loadDashboardData()
      }, 3000)
      
    } catch (error: any) {
      toast.error(`Failed to trigger scraping: ${error.message}`)
    } finally {
      setScrapingInProgress(false)
    }
  }

  const toggleSource = async (sourceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('scraping-admin', {
        body: {
          action: 'update_source',
          source_id: sourceId,
          updates: { is_active: !isActive }
        }
      })
      
      if (error) throw error
      
      toast.success(`Source ${!isActive ? 'enabled' : 'disabled'} successfully`)
      loadDashboardData()
      
    } catch (error: any) {
      toast.error(`Failed to update source: ${error.message}`)
    }
  }

  const deactivateOldJobs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scraping-admin', {
        body: {
          action: 'deactivate_jobs',
          days_old: 30
        }
      })
      
      if (error) throw error
      
      toast.success(`Deactivated ${data.data.deactivated_count} old jobs`)
      loadDashboardData()
      
    } catch (error: any) {
      toast.error(`Failed to deactivate jobs: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Failed to load dashboard data. Please try again.</p>
          <Button onClick={loadDashboardData} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scraping Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => triggerScraping()}
              disabled={scrapingInProgress}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{scrapingInProgress ? 'Running...' : 'Start Scraping'}</span>
            </Button>
            <Button
              onClick={loadDashboardData}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_jobs.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_jobs.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">H1B Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.h1b_jobs.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">H1B Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.h1b_companies.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Sources */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sources</h2>
            <div className="space-y-4">
              {stats.sources_status.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{source.name}</h3>
                    <p className="text-sm text-gray-600">
                      {source.source_type} • Last scraped: {source.last_scraped_at ? new Date(source.last_scraped_at).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      source.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSource(source.id, source.is_active)}
                    >
                      {source.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Runs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Scraping Runs</h2>
            <div className="space-y-3">
              {stats.recent_runs.slice(0, 8).map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                  <div>
                    <p className="font-medium text-gray-900">
                      {run.job_sources?.name || 'Unknown Source'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(run.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      run.status === 'completed' ? 'bg-green-100 text-green-800' :
                      run.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {run.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {run.jobs_saved || 0} jobs saved
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Summary */}
        {stats.error_summary.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Recent Errors</h2>
            </div>
            <div className="space-y-2">
              {stats.error_summary.slice(0, 5).map((error, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="font-medium text-red-800">{error.source}</p>
                  <p className="text-sm text-red-600">
                    {typeof error.errors === 'string' ? error.errors : JSON.stringify(error.errors)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={deactivateOldJobs}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Deactivate Old Jobs</span>
            </Button>
            
            <Button
              onClick={() => triggerScraping(['indeed'])}
              disabled={scrapingInProgress}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Scrape Indeed Only</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}