import { useState, useEffect } from 'react'
import { User, Mail, MapPin, Briefcase, Save, Edit3, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'

interface UserProfile {
  full_name: string
  email: string
  location: string
  experience_level: string
  preferred_industries: string[]
  visa_status: string
}

const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Principal', 'Director+']
const VISA_STATUSES = ['H1B', 'F1 OPT', 'F1 STEM OPT', 'Green Card', 'US Citizen', 'Other']
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
  'Real Estate',
  'Non-profit',
  'Government'
]

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    location: '',
    experience_level: '',
    preferred_industries: [],
    visa_status: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user!.email || '',
          location: data.location || '',
          experience_level: data.experience_level || '',
          preferred_industries: data.preferred_industries || [],
          visa_status: data.visa_status || ''
        })
      } else {
        // Create profile if it doesn't exist
        setProfile(prev => ({
          ...prev,
          email: user!.email || ''
        }))
        setIsEditing(true)
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile.full_name.trim()) {
      toast.error('Please enter your full name')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user!.id,
          email: user!.email,
          full_name: profile.full_name,
          location: profile.location,
          experience_level: profile.experience_level,
          preferred_industries: profile.preferred_industries,
          visa_status: profile.visa_status,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleIndustryToggle = (industry: string) => {
    setProfile(prev => ({
      ...prev,
      preferred_industries: prev.preferred_industries.includes(industry)
        ? prev.preferred_industries.filter(i => i !== industry)
        : [...prev.preferred_industries, industry]
    }))
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg p-8">
              <div className="space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account information and job preferences</p>
          </div>
          <div className="flex items-center space-x-4">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    loadProfile() // Reload to cancel changes
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-900">{profile.full_name || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email Address
                </label>
                <p className="text-gray-600 text-sm">Email cannot be changed from profile</p>
                <p className="text-gray-900">{profile.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, State (e.g., San Francisco, CA)"
                  />
                ) : (
                  <p className="text-gray-900">{profile.location || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Professional Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                {isEditing ? (
                  <select
                    value={profile.experience_level}
                    onChange={(e) => setProfile(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select experience level</option>
                    {EXPERIENCE_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.experience_level || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visa Status
                </label>
                {isEditing ? (
                  <select
                    value={profile.visa_status}
                    onChange={(e) => setProfile(prev => ({ ...prev, visa_status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select visa status</option>
                    {VISA_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.visa_status || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Industries
                </label>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {INDUSTRIES.map(industry => (
                      <label key={industry} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.preferred_industries.includes(industry)}
                          onChange={() => handleIndustryToggle(industry)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{industry}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.preferred_industries.length > 0 ? (
                      profile.preferred_industries.map(industry => (
                        <span
                          key={industry}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {industry}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No preferences selected</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {!isEditing && profile.full_name && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm text-green-700">
                  Your profile is complete! This helps us provide better job recommendations.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
