import React, { useState } from 'react'
import { BookOpen, Pen, Eye, User, ChartBar, Globe } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useKV } from '@github/spark/hooks'
import type { Page } from '@/App'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

interface NavItem {
  page: Page
  label: string
  icon: React.ReactNode
  badge?: number
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const [posts] = useKV<any[]>('blog-posts', [])
  const [profile] = useKV<any>('user-profile', null)
  
  const publishedCount = (posts || []).filter(post => post.status === 'published').length
  const draftCount = (posts || []).filter(post => post.status === 'draft').length
  const scheduledCount = (posts || []).filter(post => post.status === 'scheduled').length

  
  const navItems: NavItem[] = [
    {
      page: 'dashboard',
      label: 'Dashboard',
      icon: <BookOpen size={20} />,
    },
    {
      page: 'blog',
      label: 'Blog Manager',
      icon: <Pen size={20} />,
      badge: draftCount + scheduledCount,
    },
    {
      page: 'public-blog',
      label: 'View Blog',
      icon: <Globe size={20} />,
      badge: publishedCount,
    },
    {
      page: 'analytics',
      label: 'Analytics',
      icon: <ChartBar size={20} />,
    },
    {
      page: 'profile',
      label: 'Profile',
      icon: <User size={20} />,
    },
  ]

  return (
    <div className="bg-card border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen size={18} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">BlogCraft</h1>
            <p className="text-xs text-muted-foreground">Content Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <User size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {profile?.name || 'Blog Author'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.email || 'author@blogcraft.app'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.page
            return (
              <Button
                key={item.page}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start h-11 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => onNavigate(item.page)}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant={isActive ? 'outline' : 'secondary'} 
                    className={`ml-2 ${
                      isActive 
                        ? 'border-primary-foreground/20 text-primary-foreground' 
                        : ''
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Stats */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Stats
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Published</span>
              <span className="text-success font-medium">{publishedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Drafts</span>
              <span className="text-muted-foreground font-medium">{draftCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled</span>
              <span className="text-accent font-medium">{scheduledCount}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Total Posts: <span className="font-medium">{(posts || []).length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar