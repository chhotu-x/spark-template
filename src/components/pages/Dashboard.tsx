import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link, BarChart3, PenTool, Eye, TrendingUp, Users } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { Badge } from '@/components/ui/badge'
import type { Page } from '@/App'

interface DashboardProps {
  onNavigate: (page: Page) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [links] = useKV<any[]>('shortened-links', [])
  const [posts] = useKV<any[]>('blog-posts', [])
  const [profile] = useKV<any>('user-profile', null)

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0)
  const publishedPosts = posts.filter(post => post.status === 'published').length
  const recentLinks = links.slice(-3).reverse()
  const recentPosts = posts.slice(-2).reverse()

  const stats = [
    {
      title: 'Total Links',
      value: links.length,
      description: 'Shortened URLs created',
      icon: Link,
      color: 'text-primary',
      action: () => onNavigate('links')
    },
    {
      title: 'Total Clicks',
      value: totalClicks,
      description: 'Across all links',
      icon: TrendingUp,
      color: 'text-accent',
      action: () => onNavigate('analytics')
    },
    {
      title: 'Blog Posts',
      value: publishedPosts,
      description: 'Published articles',
      icon: PenTool,
      color: 'text-success',
      action: () => onNavigate('blog')
    },
    {
      title: 'Profile Views',
      value: 247,
      description: 'This month',
      icon: Eye,
      color: 'text-muted-foreground',
      action: () => onNavigate('profile')
    }
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your links and content today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card 
              key={stat.title} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={stat.action}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon size={20} className={stat.color} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Links</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onNavigate('links')}
                >
                  View all
                </Button>
              </CardTitle>
              <CardDescription>
                Your latest shortened URLs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentLinks.length > 0 ? (
                <div className="space-y-4">
                  {recentLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {link.title || link.originalUrl}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          linkcraft.app/{link.shortCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {link.clicks || 0} clicks
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Link size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No links created yet</p>
                  <Button onClick={() => onNavigate('shorten')}>
                    Create your first link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Blog Posts</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onNavigate('blog')}
                >
                  View all
                </Button>
              </CardTitle>
              <CardDescription>
                Your latest content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={post.status === 'published' ? 'default' : 'secondary'}
                      >
                        {post.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PenTool size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No blog posts yet</p>
                  <Button onClick={() => onNavigate('blog')}>
                    Write your first post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to help you get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => onNavigate('shorten')}
                >
                  <Link size={24} />
                  <span>Shorten URL</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => onNavigate('blog')}
                >
                  <PenTool size={24} />
                  <span>Write Post</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => onNavigate('analytics')}
                >
                  <BarChart3 size={24} />
                  <span>View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}