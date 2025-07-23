import { useState, useEffect } from 'react'
import { Activity, Database, Clock, AlertTriangle, Play, Pause, Download, RefreshCw, Shield, Lock, Briefcase, Users, Settings, BarChart3, Plus } from 'lucide-react'
import { supabase, Job } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import JobManagement from '../components/admin/JobManagement'
import JobEditor from '../components/admin/JobEditor'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'

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

interface AdminAuthCheck {
  is_admin: boolean
  email: string
  profile_admin: boolean
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrapingInProgress, setScrapingInProgress] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckLoading, setAdminCheckLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'scraping' | 'users' | 'settings'>('overview')
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [isJobEditorOpen, setIsJobEditorOpen] = useState(false)

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    }
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData()
    }
  }, [isAdmin])

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'check_admin' }
      })
      
      if (error) throw error
      
      const authCheck: AdminAuthCheck = data
      setIsAdmin(authCheck.is_admin)
      
      if (!authCheck.is_admin) {
        toast.error('Admin access required. Please contact support if you should have admin access.')
      }
    } catch (error: any) {
      console.error('Admin check error:', error)
      setIsAdmin(false)
      toast.error('Failed to verify admin status')
    } finally {
      setAdminCheckLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      // First verify admin status
      const { data: authData, error: authError } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'admin_action' }
      })
      
      if (authError) {
        toast.error('Admin verification failed')
        return
      }
      
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
    if (!isAdmin) {
      toast.error('Admin access required to trigger scraping')
      return
    }
    
    setScrapingInProgress(true)
    try {
      // Verify admin status before action
      const { data: authData, error: authError } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'admin_action' }
      })
      
      if (authError) {
        toast.error('Admin verification failed')
        return
      }
      
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
    if (!isAdmin) {
      toast.error('Admin access required to modify sources')
      return
    }
    
    try {
      // Verify admin status before action
      const { data: authData, error: authError } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'admin_action' }
      })
      
      if (authError) {
        toast.error('Admin verification failed')
        return
      }
      
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
    if (!isAdmin) {
      toast.error('Admin access required to deactivate jobs')
      return
    }
    
    try {
      // Verify admin status before action
      const { data: authData, error: authError } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'admin_action' }
      })
      
      if (authError) {
        toast.error('Admin verification failed')
        return
      }
      
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
  
  const handleEditJob = (job: Job) => {
    setEditingJob(job)
    setIsJobEditorOpen(true)
  }
  
  const handleCreateJob = () => {
    setEditingJob(null)
    setIsJobEditorOpen(true)
  }
  
  const handleCloseJobEditor = () => {
    setEditingJob(null)
    setIsJobEditorOpen(false)
    loadDashboardData() // Refresh stats when editor closes
  }

  // Redirect if not authenticated
  if (authLoading || adminCheckLoading) {
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

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-12">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-lg text-gray-600 mb-6">
              You don't have admin privileges to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              If you believe you should have admin access, please contact support.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => window.history.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => window.location.href = '/'} className="bg-blue-600 hover:bg-blue-700">
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex items-center mt-2">
                <Lock className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-600 font-medium">Admin Access Verified</span>
                <span className="text-sm text-gray-500 ml-2">({user.email})</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => triggerScraping()}
                disabled={scrapingInProgress || !isAdmin}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                <span>{scrapingInProgress ? 'Running...' : 'Refresh Jobs'}</span>
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
          
          {/* Navigation Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'jobs', label: 'Job Management', icon: Briefcase },
                { key: 'scraping', label: 'Data Sources', icon: Database },
                { key: 'users', label: 'User Management', icon: Users },
                { key: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Job Management</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create, edit, and manage job listings with H1B information.
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setActiveTab('jobs')}
                    >
                      Manage Jobs
                    </Button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Data Sources</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure job scraping sources and monitor status.
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setActiveTab('scraping')}
                    >
                      View Sources
                    </Button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Refresh Data</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manually trigger job data refresh from all sources.
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => triggerScraping()}
                      disabled={scrapingInProgress || !isAdmin}
                    >
                      {scrapingInProgress ? 'Refreshing...' : 'Refresh Now'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Job Management</h2>
                <Button 
                  onClick={handleCreateJob}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Job</span>
                </Button>
              </div>
              <JobManagement onEditJob={handleEditJob} onCreateJob={handleCreateJob} />
            </div>
          )}
          
          {activeTab === 'scraping' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Data Sources Management</h2>
              
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
                <div className="bg-white rounded-lg shadow-sm p-6">
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

              {/* Management Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Actions</h2>
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
          )}
          
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="text-gray-600">User management functionality will be implemented here.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="text-gray-600">System settings and configuration options will be implemented here.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Job Editor Modal */}
        <JobEditor
          job={editingJob}
          isOpen={isJobEditorOpen}
          onClose={handleCloseJobEditor}
        />
      </div>
    </div>
  )
}