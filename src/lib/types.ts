export interface BlogPost {
  id: string
  title: string
  content: string
  excerpt?: string
  status: 'draft' | 'published' | 'scheduled'
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
  scheduledAt?: string
  readTime: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  bio?: string
  avatar?: string
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
    website?: string
  }
  preferences?: {
    theme: 'light' | 'dark' | 'system'
    emailNotifications: boolean
    pushNotifications: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface BlogAnalytics {
  views: Record<string, number>
  likes: Record<string, number>
  comments: Record<string, number>
  shares: Record<string, number>
  readingTime: Record<string, number[]>
  popularTags: Record<string, number>
  dailyViews: Record<string, number>
  userEngagement: {
    totalSessions: number
    averageSessionTime: number
    bounceRate: number
  }
}

export interface ViewSession {
  postId: string
  startTime: number
  endTime?: number
}

export interface PerformanceMetrics {
  pageLoadTime: number
  renderTime: number
  interactionLatency: number
  memoryUsage?: number
  componentRenderCount?: number
  lastInteraction?: number
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
}

export interface SearchFilters {
  query: string
  tags: string[]
  status: BlogPost['status'] | 'all'
  dateRange: {
    start?: string
    end?: string
  }
  sortBy: 'created' | 'updated' | 'published' | 'title' | 'views'
  sortOrder: 'asc' | 'desc'
}

export interface NavigationProps {
  onNavigate: (page: Page, postId?: string) => void
}

export type Page = 'dashboard' | 'blog' | 'blog-post' | 'profile' | 'public-blog' | 'analytics'