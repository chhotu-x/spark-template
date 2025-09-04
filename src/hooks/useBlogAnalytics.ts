import { useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { BlogAnalytics, ViewSession } from '@/lib/types'

/**
 * Enhanced analytics hook for blog performance tracking
 */
export function useBlogAnalytics() {
  const [analytics, setAnalytics] = useKV<BlogAnalytics>('blog-analytics', {
    views: {},
    likes: {},
    comments: {},
    shares: {},
    readingTime: {},
    popularTags: {},
    dailyViews: {},
    userEngagement: {
      totalSessions: 0,
      averageSessionTime: 0,
      bounceRate: 0
    }
  })

  const [currentSession, setCurrentSession] = useKV<ViewSession | null>('current-session', null)

  // Track post view
  const trackView = (postId: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    setAnalytics(prev => ({
      ...prev,
      views: {
        ...prev.views,
        [postId]: (prev.views[postId] || 0) + 1
      },
      dailyViews: {
        ...prev.dailyViews,
        [today]: (prev.dailyViews[today] || 0) + 1
      }
    }))

    // Start session tracking
    setCurrentSession({
      postId,
      startTime: Date.now()
    })
  }

  // Track reading time when user finishes reading
  const trackReadingTime = (postId: string, timeSpent: number) => {
    setAnalytics(prev => ({
      ...prev,
      readingTime: {
        ...prev.readingTime,
        [postId]: [...(prev.readingTime[postId] || []), timeSpent]
      }
    }))

    // End current session
    if (currentSession?.postId === postId) {
      const sessionTime = Date.now() - currentSession.startTime
      setAnalytics(prev => {
        const totalSessions = prev.userEngagement.totalSessions + 1
        const newAverageTime = ((prev.userEngagement.averageSessionTime * prev.userEngagement.totalSessions) + sessionTime) / totalSessions
        
        return {
          ...prev,
          userEngagement: {
            ...prev.userEngagement,
            totalSessions,
            averageSessionTime: newAverageTime
          }
        }
      })
      setCurrentSession(null)
    }
  }

  // Track like
  const trackLike = (postId: string) => {
    setAnalytics(prev => ({
      ...prev,
      likes: {
        ...prev.likes,
        [postId]: (prev.likes[postId] || 0) + 1
      }
    }))
  }

  // Track share
  const trackShare = (postId: string) => {
    setAnalytics(prev => ({
      ...prev,
      shares: {
        ...prev.shares,
        [postId]: (prev.shares[postId] || 0) + 1
      }
    }))
  }

  // Track tag popularity
  const trackTagViews = (tags: string[]) => {
    setAnalytics(prev => {
      const newPopularTags = { ...prev.popularTags }
      tags.forEach(tag => {
        newPopularTags[tag] = (newPopularTags[tag] || 0) + 1
      })
      return {
        ...prev,
        popularTags: newPopularTags
      }
    })
  }

  // Computed analytics
  const computedAnalytics = useMemo(() => {
    const totalViews = Object.values(analytics.views).reduce((sum, views) => sum + views, 0)
    const totalLikes = Object.values(analytics.likes).reduce((sum, likes) => sum + likes, 0)
    const totalShares = Object.values(analytics.shares).reduce((sum, shares) => sum + shares, 0)

    // Most popular posts
    const popularPosts = Object.entries(analytics.views)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    // Most popular tags
    const popularTags = Object.entries(analytics.popularTags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)

    // Average reading time per post
    const avgReadingTime: Record<string, number> = {}
    Object.entries(analytics.readingTime).forEach(([postId, times]) => {
      if (times.length > 0) {
        avgReadingTime[postId] = times.reduce((sum, time) => sum + time, 0) / times.length
      }
    })

    // Engagement rate (likes + shares / views)
    const engagementRate = totalViews > 0 ? ((totalLikes + totalShares) / totalViews) * 100 : 0

    // Growth trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const weeklyTrend = last7Days.map(date => ({
      date,
      views: analytics.dailyViews[date] || 0
    }))

    return {
      totalViews,
      totalLikes,
      totalShares,
      popularPosts,
      popularTags,
      avgReadingTime,
      engagementRate,
      weeklyTrend,
      userEngagement: analytics.userEngagement
    }
  }, [analytics])

  // Cleanup sessions on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSession) {
        trackReadingTime(currentSession.postId, Date.now() - currentSession.startTime)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [currentSession])

  return {
    analytics,
    computedAnalytics,
    trackView,
    trackReadingTime,
    trackLike,
    trackShare,
    trackTagViews,
    currentSession
  }
}