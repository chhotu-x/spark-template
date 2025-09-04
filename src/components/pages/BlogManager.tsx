import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useKV } from '@github/spark/hooks'
import { Plus, Edit, Trash2, Calendar, Clock, Eye, Search } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BlogPost, Page, NavigationProps } from '@/lib/types'

export default function BlogManager({ onNavigate }: NavigationProps) {
  const [posts, setPosts] = useKV<BlogPost[]>('blog-posts', [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // New post form state
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newExcerpt, setNewExcerpt] = useState('')
  const [newStatus, setNewStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [newTags, setNewTags] = useState('')
  const [newScheduledAt, setNewScheduledAt] = useState('')

  // Calculate reading time (rough estimate: 200 words per minute)
  const calculateReadTime = (content: string): number => {
    const words = content.split(/\s+/).length
    return Math.ceil(words / 200)
  }

  // Filter posts based on search and status
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = searchTerm === '' || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [posts, searchTerm, statusFilter])

  // Create new post
  const createPost = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and content are required')
      return
    }

    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      excerpt: newExcerpt.trim() || newContent.slice(0, 150) + '...',
      status: newStatus,
      tags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: newStatus === 'published' ? new Date().toISOString() : undefined,
      scheduledAt: newStatus === 'scheduled' ? newScheduledAt : undefined,
      readTime: calculateReadTime(newContent)
    }

    setPosts(prev => [...prev, newPost])
    
    // Reset form
    setNewTitle('')
    setNewContent('')
    setNewExcerpt('')
    setNewStatus('draft')
    setNewTags('')
    setNewScheduledAt('')
    setIsCreateOpen(false)
    
    toast.success('Blog post created successfully!')
  }

  // Delete post
  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
    toast.success('Post deleted successfully')
  }

  // Update post status
  const updatePostStatus = (postId: string, status: BlogPost['status'], scheduledAt?: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          status,
          updatedAt: new Date().toISOString(),
          publishedAt: status === 'published' ? new Date().toISOString() : post.publishedAt,
          scheduledAt: status === 'scheduled' ? scheduledAt : undefined
        }
      }
      return post
    }))
    toast.success(`Post ${status} successfully`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Manager</h1>
          <p className="text-muted-foreground">Create, edit, and manage your blog posts</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={20} />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Blog Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter post title..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your post content..."
                  rows={10}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Excerpt (optional)</label>
                <Textarea
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="Brief description of the post..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="react, javascript, tutorial..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
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
                
                {newStatus === 'scheduled' && (
                  <div>
                    <label className="text-sm font-medium">Scheduled Date</label>
                    <Input
                      type="datetime-local"
                      value={newScheduledAt}
                      onChange={(e) => setNewScheduledAt(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createPost}>
                  Create Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-6">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-muted-foreground text-center">
                <h3 className="text-lg font-medium mb-2">No posts found</h3>
                <p className="text-sm">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first blog post to get started'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTime} min read
                      </span>
                      <span>Created: {formatDate(post.createdAt)}</span>
                      {post.publishedAt && (
                        <span>Published: {formatDate(post.publishedAt)}</span>
                      )}
                      {post.scheduledAt && (
                        <span>Scheduled: {formatDate(post.scheduledAt)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 ml-4">
                    <Badge className={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                  </div>
                </div>
                
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate('blog-post', post.id)}
                      className="gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate('blog-post', post.id)}
                      className="gap-2"
                    >
                      <Eye size={16} />
                      View
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    {post.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updatePostStatus(post.id, 'published')}
                        className="gap-2"
                      >
                        Publish
                      </Button>
                    )}
                    
                    {post.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePostStatus(post.id, 'draft')}
                        className="gap-2"
                      >
                        <Calendar size={16} />
                        Unschedule
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePost(post.id)}
                      className="gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}