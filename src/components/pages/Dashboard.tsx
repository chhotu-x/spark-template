import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pen, Eye, Users, Globe, Clock } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { Badge } from '@/components/ui/badge'
import type { Page, NavigationProps, BlogPost } from '@/lib/types'

export default function Dashboard({ onNavigate }: NavigationProps) {
  const [posts] = useKV<BlogPost[]>('blog-posts', [])
  const [profile] = useKV<any>('user-profile', null)

  const publishedPosts = posts?.filter(post => post.status === 'published').length || 0
  const draftPosts = posts?.filter(post => post.status === 'draft').length || 0
  const scheduledPosts = posts?.filter(post => post.status === 'scheduled').length || 0
  const recentPosts = posts?.slice(-3).reverse() || []

  // Get next scheduled post
  const nextScheduledPost = posts
    ?.filter(post => post.status === 'scheduled' && post.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0]

  const stats = [
    {
      title: 'Total Posts',
      value: posts?.length || 0,
      description: 'All blog posts created',
      icon: Pen,
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
      title: 'Scheduled',
      value: scheduledPosts,
      description: 'Awaiting publication',
      icon: Clock,
      color: 'text-accent',
      action: () => onNavigate('blog')
    },
    {
      title: 'Drafts',
      value: draftPosts,
      description: 'Work in progress',
      icon: Pen,
      color: 'text-muted-foreground',
      action: () => onNavigate('blog')
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
                        variant={
                          post.status === 'published' ? 'default' : 
                          post.status === 'scheduled' ? 'outline' : 
                          'secondary'
                        }
                      >
                        {post.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Pen size={48} className="text-muted-foreground mx-auto mb-4" />
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
              <CardTitle>Publishing Schedule</CardTitle>
              <CardDescription>
                Upcoming scheduled content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextScheduledPost ? (
                <div className="space-y-4">
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {nextScheduledPost.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Next to publish
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        Scheduled
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <Clock size={14} />
                      <span>
                        {new Date(nextScheduledPost.scheduledAt!).toLocaleDateString()} at{' '}
                        {new Date(nextScheduledPost.scheduledAt!).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  {scheduledPosts > 1 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        +{scheduledPosts - 1} more scheduled post{scheduledPosts - 1 > 1 ? 's' : ''}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onNavigate('blog')}
                        className="mt-2"
                      >
                        View all scheduled
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No scheduled posts</p>
                  <Button onClick={() => onNavigate('blog')}>
                    Schedule a post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 lg:mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Content Overview</CardTitle>
              <CardDescription>
                Your publishing activity breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe size={20} className="text-success" />
                    <span className="font-medium">Published</span>
                  </div>
                  <Badge variant="default">{publishedPosts}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-accent" />
                    <span className="font-medium">Scheduled</span>
                  </div>
                  <Badge variant="outline">{scheduledPosts}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Pen size={20} className="text-muted-foreground" />
                    <span className="font-medium">Drafts</span>
                  </div>
                  <Badge variant="secondary">{draftPosts}</Badge>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => onNavigate('blog')}
                >
                  <Pen size={24} />
                  <span>Write Post</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => onNavigate('blog')}
                >
                  <Clock size={24} />
                  <span>Schedule Post</span>
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