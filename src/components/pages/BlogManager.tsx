import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PenTool, Plus, DotsThree, Trash, Eye, MagnifyingGlass, Calendar, Article, Clock, CheckSquare } from '@phosphor-icons/react'
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

interface BlogManagerProps {
  onNavigate: (page: Page, postId?: string) => void
}

export default function BlogManager({ onNavigate }: BlogManagerProps) {
  const [posts, setPosts] = useKV<BlogPost[]>('blog-posts', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  const createNewPost = () => {
    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: 'Untitled Post',
      content: '',
      status: 'draft',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readTime: 1
    }

    setPosts(currentPosts => [newPost, ...currentPosts])
    onNavigate('blog-post', newPost.id)
    toast.success('New post created!')
  }

  const deletePost = (postId: string) => {
    setPosts(currentPosts => currentPosts.filter(post => post.id !== postId))
    toast.success('Post deleted successfully')
    setDeleteDialogOpen(false)
    setPostToDelete(null)
  }

  const togglePostStatus = (postId: string) => {
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          const newStatus = post.status === 'draft' ? 'published' : 'draft'
          return {
            ...post,
            status: newStatus,
            publishedAt: newStatus === 'published' ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          }
        }
        return post
      })
    )
    toast.success('Post status updated!')
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesTab = activeTab === 'all' || post.status === activeTab
    
    return matchesSearch && matchesTab
  })

  const getPostStats = () => {
    const published = posts.filter(post => post.status === 'published').length
    const drafts = posts.filter(post => post.status === 'draft').length
    const scheduled = posts.filter(post => post.status === 'scheduled').length
    const totalWords = posts.reduce((sum, post) => sum + post.content.split(' ').length, 0)
    
    return { published, drafts, scheduled, totalWords, total: posts.length }
  }

  const stats = getPostStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const togglePostSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const selectAllPosts = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedPosts(new Set(filteredPosts.map(post => post.id)))
      setShowBulkActions(true)
    }
  }

  const bulkPublish = () => {
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (selectedPosts.has(post.id) && post.status === 'draft') {
          return {
            ...post,
            status: 'published' as const,
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
        return post
      })
    )
    toast.success(`Published ${selectedPosts.size} posts`)
    setSelectedPosts(new Set())
    setShowBulkActions(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default'
      case 'scheduled':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Blog Manager</h1>
            <p className="text-muted-foreground">
              Create, edit, and manage your blog content.
            </p>
          </div>
          <Button onClick={createNewPost} className="gap-2 self-start sm:self-auto">
            <Plus size={16} />
            New Post
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <Article size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Eye size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.published}</div>
              <p className="text-xs text-muted-foreground">
                Live articles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.scheduled}</div>
              <p className="text-xs text-muted-foreground">
                To be published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <PenTool size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.drafts}</div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Words</CardTitle>
              <Calendar size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Content created
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Posts</CardTitle>
            <CardDescription>
              Manage your blog content and publishing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="published">Published</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {showBulkActions && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button size="sm" variant="outline" onClick={bulkPublish}>
                      <Eye size={14} className="mr-1" />
                      Publish
                    </Button>
                    <Button size="sm" variant="outline" onClick={bulkUnpublish}>
                      <PenTool size={14} className="mr-1" />
                      Unpublish
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setSelectedPosts(new Set())
                        setShowBulkActions(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {filteredPosts.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="rounded-md border min-w-[700px]">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                            onCheckedChange={selectAllPosts}
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Read Time</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedPosts.has(post.id)}
                              onCheckedChange={() => togglePostSelection(post.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <button
                                onClick={() => onNavigate('blog-post', post.id)}
                                className="text-left hover:text-primary transition-colors"
                              >
                                <p className="font-medium text-foreground hover:underline">
                                  {post.title}
                                </p>
                              </button>
                              {post.excerpt && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {post.excerpt}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {post.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {post.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {post.readTime} min read
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{formatDate(post.updatedAt)}</p>
                              {post.publishedAt && post.status === 'published' && (
                                <p className="text-xs text-muted-foreground">
                                  Published: {formatDate(post.publishedAt)}
                                </p>
                              )}
                              {post.scheduledAt && post.status === 'scheduled' && (
                                <p className="text-xs text-accent">
                                  Scheduled: {formatDate(post.scheduledAt)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <DotsThree size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => onNavigate('blog-post', post.id)}
                                >
                                  <PenTool size={14} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => togglePostStatus(post.id)}
                                >
                                  <Eye size={14} className="mr-2" />
                                  {post.status === 'draft' ? 'Publish' : 'Unpublish'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onNavigate('public-blog', post.id)}
                                >
                                  <Article size={14} className="mr-2" />
                                  View Public
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPostToDelete(post.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <PenTool size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {posts.length === 0 ? 'No blog posts yet' : 'No posts found'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {posts.length === 0 
                      ? 'Create your first blog post to get started'
                      : 'Try adjusting your search or filter criteria'
                    }
                  </p>
                  {posts.length === 0 && (
                    <Button onClick={createNewPost}>
                      <Plus size={16} className="mr-2" />
                      Create First Post
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this blog post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => postToDelete && deletePost(postToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}