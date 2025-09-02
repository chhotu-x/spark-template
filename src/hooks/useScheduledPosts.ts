import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface BlogPost {
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

/**
 * Hook to automatically publish scheduled posts when their scheduled time arrives
 */
export function useScheduledPosts() {
  const [posts, setPosts] = useKV<BlogPost[]>('blog-posts', [])

  useEffect(() => {
    const checkScheduledPosts = () => {
      setPosts(currentPosts => {
        const now = new Date()
        const postsToPublish = currentPosts.filter(post => 
          post.status === 'scheduled' && 
          post.scheduledAt && 
          new Date(post.scheduledAt) <= now
        )

        if (postsToPublish.length > 0) {
          // Show notifications for published posts
          postsToPublish.forEach(post => {
            toast.success(`"${post.title}" has been published!`)
          })

          return currentPosts.map(post => {
            if (postsToPublish.some(p => p.id === post.id)) {
              return {
                ...post,
                status: 'published' as const,
                publishedAt: now.toISOString(),
                scheduledAt: undefined
              }
            }
            return post
          })
        }

        return currentPosts
      })
    }

    // Check immediately
    checkScheduledPosts()

    // Then check every minute
    const interval = setInterval(checkScheduledPosts, 60000)

    return () => clearInterval(interval)
  }, [setPosts])

  return null
}