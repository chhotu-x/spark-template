import { PenTool, User, Home, Globe, ChartBar } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useKV } from '@github/spark/hooks'
import type { Page } from '@/App'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [posts] = useKV<any[]>('blog-posts', [])

  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: Home },
  ]

  const blogItems = [
    { id: 'blog' as Page, label: 'Blog Manager', icon: PenTool, badge: posts.length },
    { id: 'public-blog' as Page, label: 'Public Blog', icon: Globe },
    { id: 'analytics' as Page, label: 'Analytics', icon: ChartBar },
  ]

  const profileItems = [
    { id: 'profile' as Page, label: 'Profile', icon: User },
  ]

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <PenTool size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">BlogCraft</h1>
            <p className="text-xs text-muted-foreground">Content Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-4 space-y-1">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 h-10"
              onClick={() => onNavigate(item.id)}
            >
              <item.icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Content
          </h3>
          {blogItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 h-10"
              onClick={() => onNavigate(item.id)}
            >
              <item.icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {profileItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 h-10"
              onClick={() => onNavigate(item.id)}
            >
              <item.icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Built with BlogCraft Platform
        </div>
      </div>
    </div>
  )
}