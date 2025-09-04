import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useBlogAnalytics } from '@/hooks/useBlogAnalytics'
import { usePerformance } from '@/hooks/usePerformance'
import { 
  Eye, 
  Heart, 
  Share, 
  TrendUp, 
  Clock, 
  Users,
  Target,
  Lightning
} from '@phosphor-icons/react'

/**
 * Enhanced analytics dashboard with performance metrics and blog insights
 */
export default function AnalyticsDashboard() {
  const { computedAnalytics } = useBlogAnalytics()
  const { metrics, cacheSize } = usePerformance()

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your blog performance and system metrics
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(computedAnalytics.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              Across all published posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(computedAnalytics.totalLikes)}</div>
            <p className="text-xs text-muted-foreground">
              User engagement metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(computedAnalytics.totalShares)}</div>
            <p className="text-xs text-muted-foreground">
              Content amplification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{computedAnalytics.engagementRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Likes + shares / views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightning className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            System performance and optimization metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Page Load Time</span>
                <span className="font-medium">{formatTime(metrics?.pageLoadTime || 0)}</span>
              </div>
              <Progress 
                value={Math.min(((metrics?.pageLoadTime || 0) / 3000) * 100, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Render Time</span>
                <span className="font-medium">{formatTime(metrics?.renderTime || 0)}</span>
              </div>
              <Progress 
                value={Math.min(((metrics?.renderTime || 0) / 100) * 100, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cache Entries</span>
                <span className="font-medium">{cacheSize}</span>
              </div>
              <Progress 
                value={Math.min((cacheSize / 50) * 100, 100)} 
                className="h-2"
              />
            </div>
          </div>
          
          {metrics && metrics.memoryUsage && metrics.memoryUsage > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">Memory Usage</div>
              <div className="text-xs text-muted-foreground">
                {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendUp className="h-5 w-5" />
              Popular Posts
            </CardTitle>
            <CardDescription>
              Top performing content by views
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {computedAnalytics.popularPosts.slice(0, 5).map(([postId, views], index) => (
                <div key={postId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate">
                      Post {postId.slice(0, 8)}...
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(views)} views
                  </span>
                </div>
              ))}
              {computedAnalytics.popularPosts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No posts data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Tags</CardTitle>
            <CardDescription>
              Most used content categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {computedAnalytics.popularTags.slice(0, 8).map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {count} uses
                  </span>
                </div>
              ))}
              {computedAnalytics.popularTags.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Engagement
            </CardTitle>
            <CardDescription>
              Session and interaction metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Sessions</span>
                <span className="text-sm text-muted-foreground">
                  {computedAnalytics.userEngagement.totalSessions}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Avg Session Time</span>
                <span className="text-sm text-muted-foreground">
                  {formatTime(computedAnalytics.userEngagement.averageSessionTime)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bounce Rate</span>
                <span className="text-sm text-muted-foreground">
                  {computedAnalytics.userEngagement.bounceRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Weekly Trend
            </CardTitle>
            <CardDescription>
              Daily views for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {computedAnalytics.weeklyTrend.map(({ date, views }) => (
                <div key={date} className="flex items-center justify-between">
                  <span className="text-sm">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((views / Math.max(...computedAnalytics.weeklyTrend.map(t => t.views))) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {views}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}