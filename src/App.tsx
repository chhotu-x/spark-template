import { useState } from 'react'
import { toast, Toaster } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import Dashboard from '@/components/pages/Dashboard'
import URLShortener from '@/components/pages/URLShortener'
import LinkManager from '@/components/pages/LinkManager'
import Analytics from '@/components/pages/Analytics'
import BlogManager from '@/components/pages/BlogManager'
import BlogPost from '@/components/pages/BlogPost'
import Profile from '@/components/pages/Profile'
import PublicBlog from '@/components/pages/PublicBlog'
import { Menu, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export type Page = 'dashboard' | 'shorten' | 'links' | 'analytics' | 'blog' | 'blog-post' | 'profile' | 'public-blog'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedBlogPost, setSelectedBlogPost] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNavigate = (page: Page, postId?: string) => {
    setCurrentPage(page)
    if (postId) {
      setSelectedBlogPost(postId)
    }
    // Close sidebar on mobile after navigation
    setSidebarOpen(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      case 'shorten':
        return <URLShortener />
      case 'links':
        return <LinkManager />
      case 'analytics':
        return <Analytics />
      case 'blog':
        return <BlogManager onNavigate={handleNavigate} />
      case 'blog-post':
        return <BlogPost postId={selectedBlogPost} onNavigate={handleNavigate} />
      case 'profile':
        return <Profile />
      case 'public-blog':
        return <PublicBlog onNavigate={handleNavigate} />
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
            <span className="font-semibold text-foreground">LinkCraft</span>
          </div>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
        
        <main className="flex-1 overflow-hidden">
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
    </div>
  )
}

export default App