import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import Sidebar from '@/components/layout/Sidebar'
import Dashboard from '@/components/pages/Dashboard'
import URLShortener from '@/components/pages/URLShortener'
import LinkManager from '@/components/pages/LinkManager'
import Analytics from '@/components/pages/Analytics'
import BlogManager from '@/components/pages/BlogManager'
import BlogPost from '@/components/pages/BlogPost'
import Profile from '@/components/pages/Profile'
import PublicBlog from '@/components/pages/PublicBlog'

export type Page = 'dashboard' | 'shorten' | 'links' | 'analytics' | 'blog' | 'blog-post' | 'profile' | 'public-blog'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedBlogPost, setSelectedBlogPost] = useState<string | null>(null)

  const handleNavigate = (page: Page, postId?: string) => {
    setCurrentPage(page)
    if (postId) {
      setSelectedBlogPost(postId)
    }
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
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-hidden">
        {renderPage()}
      </main>
      <Toaster />
    </div>
  )
}

export default App