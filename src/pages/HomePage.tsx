import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Briefcase, Building2, TrendingUp, Award, Users, Globe } from 'lucide-react'
import { Button } from '../components/ui/button'
import FeaturedJobs from '../components/FeaturedJobs'
import TopCompanies from '../components/TopCompanies'
import Statistics from '../components/Statistics'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (location) params.set('location', location)
    params.set('h1b', 'true') // Default to H1B sponsorship filter
    navigate(`/jobs?${params.toString()}`)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Dream Job with
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                H1B Sponsorship
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Connect with top companies that actively sponsor H1B visas. 
              Access verified sponsorship data and find opportunities that match your skills.
            </p>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Job title, keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 rounded-xl border-0 focus:ring-2 focus:ring-yellow-400 outline-none text-lg"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="City, state, or remote"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 rounded-xl border-0 focus:ring-2 focus:ring-yellow-400 outline-none text-lg"
                    />
                  </div>
                  <Button 
                    type="submit"
                    size="lg"
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Search H1B Jobs
                  </Button>
                </div>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">15,000+</div>
                <div className="text-blue-200">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-blue-200">H1B Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">92%</div>
                <div className="text-blue-200">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">50k+</div>
                <div className="text-blue-200">Job Seekers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose H1B Friendly?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide the most comprehensive database of H1B-friendly employers with verified sponsorship data.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Verified H1B Data</h3>
              <p className="text-gray-600">
                Access real government data from USCIS and DOL showing actual H1B approval rates and sponsorship history.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Job Matching</h3>
              <p className="text-gray-600">
                Our algorithm matches you with opportunities based on your skills, experience, and H1B sponsorship likelihood.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Support</h3>
              <p className="text-gray-600">
                Join a community of international professionals sharing experiences and insights about the H1B process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <Statistics />

      {/* Featured Jobs */}
      <FeaturedJobs />

      {/* Top Companies */}
      <TopCompanies />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your H1B Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream jobs with H1B sponsorship through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold px-8 py-4 text-lg"
              onClick={() => navigate('/jobs?h1b=true')}
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Browse H1B Jobs
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg"
              onClick={() => navigate('/companies')}
            >
              <Building2 className="w-5 h-5 mr-2" />
              Explore Companies
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}