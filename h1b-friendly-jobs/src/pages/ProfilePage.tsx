import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Mail, MapPin, Briefcase, Award, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Profile } from '../lib/supabase'
import { Button } from '../components/ui/button'
import toast from 'react-hot-toast'

const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Executive']
const VISA_STATUSES = [
  'H1B',
  'L1',
  'F1 (Student)',
  'OPT',
  'CPT',
  'Green Card Holder',
  'US Citizen',
  'Other'
]
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
  'Energy',
  'Government',
  'Non-profit'
]

export default function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
    experience_level: '',
    visa_status: '',
    preferred_industries: [] as string[]
  })

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      return data as Profile | null
    },
    enabled: !!user
  })

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        location: profile.location || '',
        experience_level: profile.experience_level || '',
        visa_status: profile.visa_status || '',
        preferred_industries: profile.preferred_industries || []
      })
    }
  }, [profile])

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: typeof formData) => {
      if (!user) throw new Error('Must be logged in to update profile')
      
      const profileData = {
        user_id: user.id,
        email: user.email || '',
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      if (profile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id)
          .select()
          .maybeSingle()
        
        if (error) throw error
        return data
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            ...profileData,
            created_at: new Date().toISOString()
          })
          .select()
          .maybeSingle()
        
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  const handleIndustryChange = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_industries: prev.preferred_industries.includes(industry)
        ? prev.preferred_industries.filter(i => i !== industry)
        : [...prev.preferred_industries, industry]
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your profile information to get better job recommendations.
          </p>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="City, State or Country"
                />
              </div>
              
              <div>
                <label htmlFor="visa_status" className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="w-4 h-4 inline mr-1" />
                  Visa Status
                </label>
                <select
                  id="visa_status"
                  value={formData.visa_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, visa_status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select visa status</option>
                  {VISA_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Experience Level
              </label>
              <select
                id="experience_level"
                value={formData.experience_level}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select experience level</option>
                {EXPERIENCE_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            {/* Preferred Industries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Industries
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Select industries you're interested in working in (optional)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {INDUSTRIES.map(industry => (
                  <label key={industry} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferred_industries.includes(industry)}
                      onChange={() => handleIndustryChange(industry)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">{industry}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || isLoading}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </span>
              </Button>
            </div>
          </form>
        </div>
        
        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Why do we ask for this information?
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• To provide personalized job recommendations based on your experience and preferences</li>
            <li>• To help you find companies that are more likely to sponsor your visa status</li>
            <li>• To filter opportunities that match your location preferences</li>
            <li>• All information is kept private and secure</li>
          </ul>
        </div>
      </div>
    </div>
  )
}