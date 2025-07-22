import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Search, User, Bookmark, Building2, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import toast from 'react-hot-toast'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H1B</span>
            </div>
            <span className="text-xl font-bold text-gray-900">H1B Friendly</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/jobs" 
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
            >
              <Search className="w-4 h-4" />
              <span>Jobs</span>
            </Link>
            <Link 
              to="/companies" 
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
            >
              <Building2 className="w-4 h-4" />
              <span>Companies</span>
            </Link>
            {user && (
              <Link 
                to="/saved-jobs" 
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved Jobs</span>
              </Link>
            )}
          </nav>

          {/* User Authentication */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="max-w-32 truncate">{user.email}</span>
                </button>
                
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/saved-jobs"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Saved Jobs
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        handleSignOut()
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/jobs" 
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="w-4 h-4" />
                <span>Jobs</span>
              </Link>
              <Link 
                to="/companies" 
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Building2 className="w-4 h-4" />
                <span>Companies</span>
              </Link>
              {user && (
                <Link 
                  to="/saved-jobs" 
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Saved Jobs</span>
                </Link>
              )}
              
              {/* Mobile Auth */}
              <hr className="border-gray-200" />
              {user ? (
                <div className="flex flex-col space-y-2">
                  <Link 
                    to="/profile" 
                    className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleSignOut()
                    }}
                    className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}