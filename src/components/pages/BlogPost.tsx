import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useKV } from '@github/spark/hooks'
import { ArrowLeft, Calendar, Clock, Eye, Save, Trash2, Share } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BlogPost, Page } from '@/lib/types'
import { useBlogAnalytics } from '@/hooks/useBlogAnalytics'

interface BlogPostProps {
  postId: string | null
  onNavigate: (page: Page, postId?: string) => void
}

export default function BlogPost({ postId, onNavigate }: BlogPostProps) {
  const [posts, setPosts] = useKV<BlogPost[]>('blog-posts', [])
  const { trackView, trackReadingTime, analytics } = useBlogAnalytics()
  
  // Current post
  const post = useMemo(() => 
    posts.find(p => p.id === postId), 
    [posts, postId]
  )
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editExcerpt, setEditExcerpt] = useState('')
  const [editStatus, setEditStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [editTags, setEditTags] = useState('')
  const [editScheduledAt, setEditScheduledAt] = useState('')
  
  // Reading tracking
  const [startTime, setStartTime] = useState<number | null>(null)

  // Initialize edit form when post changes
  useEffect(() => {
    if (post) {
      setEditTitle(post.title)
      setEditContent(post.content)
      setEditExcerpt(post.excerpt || '')
      setEditStatus(post.status)
      setEditTags(post.tags.join(', '))
      setEditScheduledAt(post.scheduledAt || '')
      
      // Track view and start reading timer
      trackView(post.id)
      setStartTime(Date.now())
    }
  }, [post, trackView])

  // Track reading time when component unmounts or post changes
  useEffect(() => {
    return () => {
      if (post && startTime) {
        const readingTime = Date.now() - startTime
        trackReadingTime(post.id, readingTime)
      }
    }
  }, [post, startTime, trackReadingTime])

  // Calculate reading time (rough estimate: 200 words per minute)
  const calculateReadTime = (content: string): number => {
    const words = content.split(/\s+/).length
    return Math.ceil(words / 200)
  }

  // Save changes
  const savePost = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content are required')
      return
    }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          title: editTitle.trim(),
          content: editContent.trim(),
          excerpt: editExcerpt.trim() || editContent.slice(0, 150) + '...',
          status: editStatus,
          tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
          updatedAt: new Date().toISOString(),
          publishedAt: editStatus === 'published' && !p.publishedAt ? new Date().toISOString() : p.publishedAt,
          scheduledAt: editStatus === 'scheduled' ? editScheduledAt : undefined,
          readTime: calculateReadTime(editContent)
        }
      }
      return p
    }))
    
    setIsEditing(false)
    toast.success('Post saved successfully!')
  }

  // Delete post
  const deletePost = () => {
    if (postId) {
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast.success('Post deleted successfully')
      onNavigate('blog')
    }
  }

  // Share post
  const sharePost = async () => {
    if (!post) return
    
    try {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href
      })
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: BlogPost['status']) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-700 border-green-500/20'
      case 'scheduled': return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
      case 'draft': return 'bg-gray-500/10 text-gray-700 border-gray-500/20'
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20'
    }
  }

  if (!postId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No post selected</h3>
            <p className="text-muted-foreground text-sm mb-4">Select a post to view or edit</p>
            <Button onClick={() => onNavigate('blog')}>
              Go to Blog Manager
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">Post not found</h3>
            <p className="text-muted-foreground text-sm mb-4">The requested post could not be found</p>
            <Button onClick={() => onNavigate('blog')}>
              Go to Blog Manager
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const postViews = analytics.views[post.id] || 0
  const postLikes = analytics.likes[post.id] || 0

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => onNavigate('blog')}
          className="gap-2"
        >
          <ArrowLeft size={20} />
          Back to Blog Manager
        </Button>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Save size={16} />
                Edit
              </Button>
              
              <Button
                variant="outline"
                onClick={sharePost}
                className="gap-2"
              >
                <Share size={16} />
                Share
              </Button>
              
              <Button
                variant="destructive"
                onClick={deletePost}
                className="gap-2"
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  // Reset form
                  setEditTitle(post.title)
                  setEditContent(post.content)
                  setEditExcerpt(post.excerpt || '')
                  setEditStatus(post.status)
                  setEditTags(post.tags.join(', '))
                  setEditScheduledAt(post.scheduledAt || '')
                }}
              >
                Cancel
              </Button>
              
              <Button onClick={savePost} className="gap-2">
                <Save size={16} />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Main Content */}
        <Card>
          <CardHeader>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter post title..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Excerpt</label>
                  <Textarea
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    placeholder="Brief description of the post..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Tags (comma-separated)</label>
                  <Input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="react, javascript, tutorial..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={editStatus} onValueChange={(value: any) => setEditStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {editStatus === 'scheduled' && (
                    <div>
                      <label className="text-sm font-medium">Scheduled Date</label>
                      <Input
                        type="datetime-local"
                        value={editScheduledAt}
                        onChange={(e) => setEditScheduledAt(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{post.title}</CardTitle>
                    <CardDescription className="text-base">
                      {post.excerpt}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(post.status)}>
                    {post.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    {post.readTime} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={16} />
                    {postViews} views
                  </span>
                  <span>Created: {formatDate(post.createdAt)}</span>
                  {post.publishedAt && (
                    <span>Published: {formatDate(post.publishedAt)}</span>
                  )}
                  {post.scheduledAt && (
                    <span>Scheduled: {formatDate(post.scheduledAt)}</span>
                  )}
                </div>
                
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardHeader>
          
          <CardContent>
            {isEditing ? (
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write your post content..."
                  rows={20}
                  className="mt-2"
                />
              </div>
            ) : (
              <div className="prose prose-gray max-w-none">
                {post.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Post Analytics */}
        {!isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Post Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{postViews}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{postLikes}</div>
                  <div className="text-sm text-muted-foreground">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{post.readTime}</div>
                  <div className="text-sm text-muted-foreground">Est. Read Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">
                    {analytics.shares[post.id] || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Shares</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}