import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved. Let's get you back to finding your dream H1B job!
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/">
            <Button className="w-full flex items-center justify-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Button>
          </Link>
          <Link to="/jobs">
            <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Browse H1B Jobs</span>
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  )
}