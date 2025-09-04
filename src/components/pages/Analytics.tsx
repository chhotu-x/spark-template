import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ChartBar, TrendUp, Eye, Users, Calendar, Download, BookOpen, Tag } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface BlogPost {
  id: string
  title: string
  content: string
  status: 'draft' | 'published' | 'scheduled'
  views: number
  createdAt: string
  updatedAt: string
  tags: string[]
  readTime: number
}

export default function Analytics() {
  const [posts] = useKV<BlogPost[]>('blog-posts', [])

  const publishedPosts = (posts || []).filter(post => post.status === 'published')
  const totalViews = publishedPosts.reduce((sum, post) => sum + (post.views || 0), 0)
  const averageReadTime = publishedPosts.length > 0 
    ? publishedPosts.reduce((sum, post) => sum + (post.readTime || 5), 0) / publishedPosts.length 
    : 0

  // Generate mock analytics data for demo purposes
  const viewsData = [
    { name: 'Mon', views: 45, readers: 32 },
    { name: 'Tue', views: 52, readers: 41 },
    { name: 'Wed', views: 48, readers: 38 },
    { name: 'Thu', views: 61, readers: 47 },
    { name: 'Fri', views: 55, readers: 43 },
    { name: 'Sat', views: 38, readers: 29 },
    { name: 'Sun', views: 42, readers: 34 },
  ]

  const topPosts = publishedPosts
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)

  const tagData = (posts || []).reduce((acc, post) => {
    post.tags?.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + (post.views || 0)
    })
    return acc
  }, {} as Record<string, number>)

  const topTags = Object.entries(tagData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([name, views], index) => ({
      name,
      views,
      color: `hsl(${index * 60}, 70%, 50%)`
    }))

  const exportData = () => {
    const data = {
      summary: {
        totalPosts: (posts || []).length,
        publishedPosts: publishedPosts.length,
        totalViews,
        averageReadTime: Math.round(averageReadTime)
      },
      posts: publishedPosts.map(post => ({
        title: post.title,
        views: post.views || 0,
        readTime: post.readTime,
        createdAt: post.createdAt,
        tags: post.tags
      })),
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blog-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Blog Analytics</h1>
            <p className="text-muted-foreground">
              Track performance and gain insights from your blog content.
            </p>
          </div>
          <Button onClick={exportData} variant="outline" className="self-start sm:self-auto">
            <Download size={16} className="mr-2" />
            Export Data
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
              <BookOpen size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{(posts || []).length}</div>
              <p className="text-xs text-muted-foreground">
                {publishedPosts.length} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {publishedPosts.length > 0 ? Math.round(totalViews / publishedPosts.length) : 0} avg per post
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Read Time</CardTitle>
              <Calendar size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(averageReadTime)}m
              </div>
              <p className="text-xs text-muted-foreground">
                Minutes per article
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
              <TrendUp size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">94%</div>
              <p className="text-xs text-muted-foreground">
                Reader retention
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Top Posts</TabsTrigger>
            <TabsTrigger value="tags">Popular Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Views</CardTitle>
                  <CardDescription>Blog post views over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="#8884d8" />
                      <Bar dataKey="readers" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reader Engagement</CardTitle>
                  <CardDescription>How readers interact with your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Read Completion</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Return Readers</span>
                        <span>62%</span>
                      </div>
                      <Progress value={62} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Bounce Rate</span>
                        <span>15%</span>
                      </div>
                      <Progress value={15} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>
                  Your most viewed blog posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topPosts.length > 0 ? (
                  <div className="space-y-4">
                    {topPosts.map((post, index) => (
                      <div key={post.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {post.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()} • {post.readTime}m read
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">
                            {(post.views || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">views</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No published posts yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tag Performance</CardTitle>
                  <CardDescription>Most popular content categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {topTags.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={topTags}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="views"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {topTags.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">
                      <Tag size={48} className="text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tags yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tag Rankings</CardTitle>
                  <CardDescription>Views by content category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topTags.map((tag, index) => (
                      <div key={tag.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium">{tag.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {tag.views.toLocaleString()}
                          </span>
                          <Badge variant="secondary">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
