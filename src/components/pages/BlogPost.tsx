import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, FloppyDisk, Eye, Share, Tag, Calendar, BookOpen, Clock } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { Page } from '@/App'

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

interface BlogPostProps {
  postId: string | null
  onNavigate: (page: Page) => void
}

export default function BlogPost({ postId, onNavigate }: BlogPostProps) {
  const [posts, setPosts] = useKV<BlogPost[]>('blog-posts', [])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [publishingMode, setPublishingMode] = useState<'immediate' | 'scheduled'>('immediate')
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const currentPost = posts.find(post => post.id === postId)

  useEffect(() => {
    if (currentPost) {
      setTitle(currentPost.title)
      setContent(currentPost.content)
      setExcerpt(currentPost.excerpt || '')
      setTags(currentPost.tags)
      setStatus(currentPost.status)
      
      // Set scheduling fields if post is scheduled
      if (currentPost.scheduledAt) {
        const scheduledDateTime = new Date(currentPost.scheduledAt)
        setScheduledDate(scheduledDateTime.toISOString().split('T')[0])
        setScheduledTime(scheduledDateTime.toTimeString().slice(0, 5))
        setPublishingMode('scheduled')
      }
    }
  }, [currentPost])

  useEffect(() => {
    if (!postId || !title || !content) return

    const autoSaveTimer = setTimeout(() => {
      savePost(false)
    }, 2000)

    return () => clearTimeout(autoSaveTimer)
  }, [title, content, excerpt, tags, status, scheduledDate, scheduledTime])

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200
    const words = text.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(words / wordsPerMinute))
  }

  const savePost = async (showToast = true) => {
    if (!postId) return

    setIsAutoSaving(true)

    // Determine scheduled datetime if scheduling
    let scheduledAt: string | undefined
    if (status === 'scheduled' && scheduledDate && scheduledTime) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
    }

    const updatedPost: BlogPost = {
      id: postId,
      title: title || 'Untitled Post',
      content,
      excerpt: excerpt || content.substring(0, 150) + (content.length > 150 ? '...' : ''),
      status,
      tags,
      createdAt: currentPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: status === 'published' && currentPost?.status !== 'published' 
        ? new Date().toISOString() 
        : currentPost?.publishedAt,
      scheduledAt,
      readTime: calculateReadTime(content)
    }

    setPosts(currentPosts => 
      currentPosts.map(post => 
        post.id === postId ? updatedPost : post
      )
    )

    setLastSaved(new Date())
    setIsAutoSaving(false)

    if (showToast) {
      if (status === 'scheduled') {
        toast.success(`Post scheduled for ${new Date(scheduledAt!).toLocaleDateString()} at ${new Date(scheduledAt!).toLocaleTimeString()}`)
      } else {
        toast.success('Post saved successfully!')
      }
    }
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handlePublishingModeChange = (mode: 'immediate' | 'scheduled') => {
    setPublishingMode(mode)
    
    if (mode === 'immediate') {
      setStatus('published')
      setScheduledDate('')
      setScheduledTime('')
    } else {
      setStatus('scheduled')
      // Set default scheduled time to 1 hour from now
      const defaultTime = new Date()
      defaultTime.setHours(defaultTime.getHours() + 1)
      setScheduledDate(defaultTime.toISOString().split('T')[0])
      setScheduledTime(defaultTime.toTimeString().slice(0, 5))
    }
  }

  const isScheduledTimeValid = () => {
    if (!scheduledDate || !scheduledTime) return false
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
    return scheduledDateTime > new Date()
  }

  const handleSaveWithValidation = () => {
    if (status === 'scheduled' && !isScheduledTimeValid()) {
      toast.error('Scheduled time must be in the future')
      return
    }
    savePost(true)
  }

  const toggleStatus = () => {
    if (status === 'draft') {
      // When transitioning from draft, default to immediate publishing
      setPublishingMode('immediate')
      setStatus('published')
      toast.success('Post will be published when saved!')
    } else {
      setStatus('draft')
      setPublishingMode('immediate')
      setScheduledDate('')
      setScheduledTime('')
      toast.success('Post moved to drafts!')
    }
  }

  const sharePost = () => {
    const url = `${window.location.origin}/blog/${postId}`
    navigator.clipboard.writeText(url)
    toast.success('Blog post URL copied to clipboard!')
  }

  if (!postId || !currentPost) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Post not found</h3>
            <p className="text-muted-foreground mb-4">
              The blog post you're looking for doesn't exist.
            </p>
            <Button onClick={() => onNavigate('blog')}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Blog Manager
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('blog')}
              className="self-start"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Posts
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isAutoSaving && <span>Saving...</span>}
              {lastSaved && !isAutoSaving && (
                <span>Last saved {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={sharePost} size="sm">
              <Share size={16} className="mr-2" />
              Share
            </Button>
            <Button onClick={handleSaveWithValidation} size="sm">
              <FloppyDisk size={16} className="mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Editor</CardTitle>
                <CardDescription>
                  Write and format your blog post content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Post Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter your post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of your post..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {excerpt.length}/160 characters recommended for SEO
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Start writing your blog post..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{content.split(/\s+/).filter(word => word).length} words</span>
                    <span>{calculateReadTime(content)} min read</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye size={18} />
                  Publishing Options
                </CardTitle>
                <CardDescription>
                  Control when and how your post is published
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {status === 'published' 
                        ? 'Visible to readers' 
                        : status === 'scheduled'
                        ? 'Will be published automatically'
                        : 'Save as draft'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      status === 'published' ? 'default' : 
                      status === 'scheduled' ? 'outline' : 
                      'secondary'
                    }>
                      {status}
                    </Badge>
                    <Switch
                      checked={status !== 'draft'}
                      onCheckedChange={toggleStatus}
                    />
                  </div>
                </div>

                {status !== 'draft' && (
                  <>
                    <Separator />
                    
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Publishing Method</Label>
                      <Select value={publishingMode} onValueChange={handlePublishingModeChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">
                            <div className="flex items-center gap-2">
                              <Eye size={14} />
                              Publish immediately
                            </div>
                          </SelectItem>
                          <SelectItem value="scheduled">
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              Schedule for later
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {publishingMode === 'scheduled' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="scheduled-date" className="text-sm">Date</Label>
                            <Input
                              id="scheduled-date"
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="scheduled-time" className="text-sm">Time</Label>
                            <Input
                              id="scheduled-time"
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {scheduledDate && scheduledTime && (
                          <div className={`p-3 border rounded-md ${
                            isScheduledTimeValid() 
                              ? 'bg-accent/10 border-accent/20' 
                              : 'bg-destructive/10 border-destructive/20'
                          }`}>
                            <p className={`text-sm font-medium ${
                              isScheduledTimeValid() ? 'text-accent' : 'text-destructive'
                            }`}>
                              {isScheduledTimeValid() 
                                ? `Scheduled for: ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString()} at ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleTimeString()}`
                                : 'Invalid: Scheduled time must be in the future'
                              }
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isScheduledTimeValid() 
                                ? 'Your post will be automatically published at this time'
                                : 'Please select a future date and time'
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Publication Info</Label>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Created: {new Date(currentPost.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Updated: {new Date(currentPost.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {currentPost.publishedAt && (
                      <div className="flex items-center gap-2">
                        <Eye size={14} />
                        <span>Published: {new Date(currentPost.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {currentPost.scheduledAt && currentPost.status === 'scheduled' && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>Scheduled: {new Date(currentPost.scheduledAt).toLocaleDateString()} at {new Date(currentPost.scheduledAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag size={18} />
                  Tags & SEO
                </CardTitle>
                <CardDescription>
                  Organize content and improve discoverability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Add tags (press Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                  />
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Preview</Label>
                  <div className="p-3 bg-muted rounded border">
                    <h3 className="text-sm font-medium text-primary truncate">
                      {title || 'Untitled Post'}
                    </h3>
                    <p className="text-xs text-success">
                      linkcraft.app/blog/{postId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {excerpt || content.substring(0, 160) + (content.length > 160 ? '...' : '')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Content Stats</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{content.split(/\s+/).filter(word => word).length}</div>
                      <div className="text-xs text-muted-foreground">Words</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{calculateReadTime(content)}</div>
                      <div className="text-xs text-muted-foreground">Min read</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}