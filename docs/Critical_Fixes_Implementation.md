# Critical Fixes Implementation Guide

## Fix 1: Authentication Profile Creation Issue

**Problem:** 401 Unauthorized error when creating user profiles

**Root Cause:** Profile creation happens with anon key but requires service role permissions

**Solution:** Modify the signup flow to handle profile creation properly

### Implementation:

```javascript
// File: src/contexts/AuthContext.tsx
// Replace the existing signUp function with:

async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || ''
      },
      emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
    }
  })

  // Don't try to create profile immediately - let the user verify email first
  // Profile will be created on first login or via trigger

  return { data, error }
}
```

### Alternative: Database Trigger Solution

```sql
-- Create a database trigger to automatically create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Fix 2: Job Filtering System

**Problem:** Filter changes don't trigger search result updates

**Root Cause:** Query key dependency not properly configured

**Solution:** Fix useQuery dependency and force refetch

### Implementation:

```javascript
// File: src/pages/JobsPage.tsx
// Update the useQuery hook:

const { data: jobs, isLoading, error, refetch } = useQuery({
  queryKey: ['jobs', JSON.stringify(filters)], // Use JSON.stringify for object dependency
  queryFn: async () => {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
    
    // Apply filters - existing code...
    
    const { data, error } = await query.limit(50)
    
    if (error) throw error
    return data as Job[]
  },
  refetchOnWindowFocus: false,
  staleTime: 1000 * 60 * 5, // 5 minutes
})

// Add useEffect to handle filter changes
useEffect(() => {
  refetch()
}, [filters, refetch])
```

## Fix 3: Error Handling for Login

**Problem:** No user feedback for invalid login attempts

**Solution:** Add proper error handling and user feedback

### Implementation:

```javascript
// File: src/pages/LoginPage.tsx
// Update the handleSubmit function:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  
  try {
    const { error } = await signIn(email, password)
    if (error) {
      // Handle specific error types
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.')
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please check your email and click the verification link before signing in.')
      } else if (error.message.includes('Too many requests')) {
        toast.error('Too many login attempts. Please wait a few minutes and try again.')
      } else {
        toast.error(`Login failed: ${error.message}`)
      }
    } else {
      toast.success('Signed in successfully!')
      navigate(from, { replace: true })
    }
  } catch (error: any) {
    console.error('Login error:', error)
    toast.error('An unexpected error occurred. Please try again later.')
  } finally {
    setIsLoading(false)
  }
}
```

## Fix 4: Add 404 Error Page

**Problem:** No custom 404 page for invalid URLs

**Solution:** Create and implement 404 page component

### Implementation:

```javascript
// File: src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'
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
            The page you're looking for doesn't exist or has been moved.
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
              <span>Browse Jobs</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// File: src/App.tsx
// Add the catch-all route:
import NotFoundPage from './pages/NotFoundPage'

// In the Routes component, add as the last route:
<Route path="*" element={<NotFoundPage />} />
```

## Fix 5: Improve Saved Jobs Authentication

**Problem:** Saved jobs functionality may fail due to auth issues

**Solution:** Add proper error handling and user feedback

### Implementation:

```javascript
// File: src/components/JobCard.tsx
// Update the saveJobMutation:

const saveJobMutation = useMutation({
  mutationFn: async () => {
    if (!user) throw new Error('Must be logged in to save jobs')
    
    // Get current auth status
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      throw new Error('Authentication expired. Please sign in again.')
    }
    
    if (isBookmarked) {
      // Remove from saved jobs
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('job_id', job.id)
      
      if (error) throw new Error(`Failed to remove job: ${error.message}`)
    } else {
      // Add to saved jobs
      const { error } = await supabase
        .from('saved_jobs')
        .insert({
          user_id: currentUser.id,
          job_id: job.id,
          saved_at: new Date().toISOString()
        })
      
      if (error) {
        if (error.code === '23505') { // Duplicate key error
          throw new Error('Job is already saved')
        }
        throw new Error(`Failed to save job: ${error.message}`)
      }
    }
  },
  onSuccess: () => {
    setIsBookmarked(!isBookmarked)
    queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
    toast.success(isBookmarked ? 'Job removed from saved jobs' : 'Job saved successfully')
  },
  onError: (error: any) => {
    if (error.message.includes('Authentication expired')) {
      toast.error('Please sign in again to save jobs')
      // Optionally redirect to login
    } else {
      toast.error(error.message || 'Failed to save job')
    }
  }
})
```

## Implementation Priority

1. **Deploy Database Trigger** (Fix 1) - Highest priority
2. **Fix Job Filtering** (Fix 2) - High priority
3. **Add Error Handling** (Fix 3, 5) - Medium priority
4. **Add 404 Page** (Fix 4) - Low priority

## Testing After Fixes

After implementing these fixes:
1. Test user registration flow completely
2. Test job filtering with multiple filters
3. Test invalid login attempts
4. Test saved jobs functionality
5. Test invalid URLs for 404 page

These fixes will significantly improve the user experience and make the website production-ready.