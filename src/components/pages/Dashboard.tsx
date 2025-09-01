import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PenTool, Eye, Users, Globe } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { Badge } from '@/components/ui/badge'
import type { Page } from '@/App'

interface DashboardProps {
  onNavigate: (page: Page) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [posts] = useKV<any[]>('blog-posts', [])
  const [profile] = useKV<any>('user-profile', null)

  const publishedPosts = posts.filter(post => post.status === 'published').length
  const draftPosts = posts.filter(post => post.status === 'draft').length
  const recentPosts = posts.slice(-3).reverse()

  const stats = [
    {
      title: 'Total Posts',
      value: posts.length,
      description: 'All blog posts created',
      icon: PenTool,
      color: 'text-primary',
      action: () => onNavigate('blog')
    },
    {
      title: 'Published',
      value: publishedPosts,
      description: 'Live articles',
      icon: Globe,
      color: 'text-success',
      action: () => onNavigate('public-blog')
    },
    {
      title: 'Drafts',
      value: draftPosts,
      description: 'Work in progress',
      icon: PenTool,
      color: 'text-accent',
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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your blog and content today.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
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

          <Card>
            <CardHeader>
              <CardTitle>Content Overview</CardTitle>
              <CardDescription>
                Your publishing activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe size={20} className="text-success" />
                    <span className="font-medium">Published Posts</span>
                  </div>
                  <Badge variant="default">{publishedPosts}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <PenTool size={20} className="text-accent" />
                    <span className="font-medium">Draft Posts</span>
                  </div>
                  <Badge variant="secondary">{draftPosts}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye size={20} className="text-muted-foreground" />
                    <span className="font-medium">Total Views</span>
                  </div>
                  <Badge variant="outline">1.2k</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 lg:mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to help you get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  onClick={() => onNavigate('public-blog')}
                >
                  <Globe size={24} />
                  <span>View Blog</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => onNavigate('profile')}
                >
                  <Users size={24} />
                  <span>Edit Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}