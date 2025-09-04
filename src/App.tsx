import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import PerformanceMonitor from '@/components/layout/PerformanceMonitor'
import BlogManager from '@/components/pages/BlogManager'
import BlogPost from '@/components/pages/BlogPost'
import Profile from '@/components/pages/Profile'
import PublicBlog from '@/components/pages/PublicBlog'
import AnalyticsDashboard from '@/components/pages/AnalyticsDashboard'
import Dashboard from '@/components/pages/Dashboard'
import { Menu } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useScheduledPosts } from '@/hooks/useScheduledPosts'
import { usePerformance } from '@/hooks/usePerformance'
import { useBlogAnalytics } from '@/hooks/useBlogAnalytics'

export type Page = 'dashboard' | 'blog' | 'blog-post' | 'profile' | 'public-blog' | 'analytics'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedBlogPost, setSelectedBlogPost] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Enable automatic publishing of scheduled posts
  useScheduledPosts()

  // Performance monitoring and optimization
  const { metrics, clearExpiredCache, debounce } = usePerformance()
  
  // Blog analytics tracking
  const { trackView } = useBlogAnalytics()

  // Debounced navigation to prevent rapid page switching
  const debouncedNavigate = debounce((page: Page, postId?: string) => {
    setCurrentPage(page)
    if (postId) {
      setSelectedBlogPost(postId)
      trackView(postId) // Track page view for analytics
    }
    setSidebarOpen(false)
  }, 150)

  const handleNavigate = (page: Page, postId?: string) => {
    debouncedNavigate(page, postId)
  }

  // Clean up expired cache periodically
  useEffect(() => {
    const cleanup = setInterval(clearExpiredCache, 300000) // Every 5 minutes
    return () => clearInterval(cleanup)
  }, [clearExpiredCache])

  // Monitor performance in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metrics:', metrics)
    }
  }, [metrics])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      case 'blog':
        return <BlogManager onNavigate={handleNavigate} />
      case 'blog-post':
        return <BlogPost postId={selectedBlogPost} onNavigate={handleNavigate} />
      case 'profile':
        return <Profile />
      case 'public-blog':
        return <PublicBlog onNavigate={handleNavigate} />
      case 'analytics':
        return <AnalyticsDashboard />
      default:
        return <Dashboard onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-in-out lg:transition-none
      `}>
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2"
          >
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
            </div>
            <span className="font-semibold text-foreground">BlogCraft</span>
          </div>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
        
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            color: 'var(--popover-foreground)',
          },
        }}
      />
      
      {/* Performance Monitor (development only) */}
      <PerformanceMonitor />
    </div>
  )
}

export default App