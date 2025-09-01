import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Tag, BookOpen, ArrowLeft, MagnifyingGlass, User, Globe } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import type { Page } from '@/App'

interface BlogPost {
  id: string
  title: string
  content: string
  excerpt?: string
  status: 'draft' | 'published'
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
  readTime: number
}

interface PublicBlogProps {
  onNavigate: (page: Page, postId?: string) => void
}

export default function PublicBlog({ onNavigate }: PublicBlogProps) {
  const [posts] = useKV<BlogPost[]>('blog-posts', [])
  const [profile] = useKV<any>('user-profile', null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

  const publishedPosts = posts.filter(post => post.status === 'published')
  
  const filteredPosts = publishedPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || post.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const allTags = Array.from(new Set(publishedPosts.flatMap(post => post.tags)))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => (
      <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
        {paragraph}
      </p>
    ))
  }

  if (selectedPost) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPost(null)}
              className="mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Blog
            </Button>
            
            <article className="space-y-6">
              <header className="space-y-4">
                <h1 className="text-4xl font-bold text-foreground leading-tight">
                  {selectedPost.title}
                </h1>
                
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{formatDate(selectedPost.publishedAt || selectedPost.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>{selectedPost.readTime} min read</span>
                  </div>
                  {profile?.name && (
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>By {profile.name}</span>
                    </div>
                  )}
                </div>

                {selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </header>

              <Separator />

              <div className="prose prose-gray max-w-none">
                {selectedPost.excerpt && (
                  <div className="text-lg text-muted-foreground italic mb-8 p-4 bg-muted rounded-lg">
                    {selectedPost.excerpt}
                  </div>
                )}
                
                <div className="text-foreground">
                  {formatContent(selectedPost.content)}
                </div>
              </div>

              <Separator />

              <footer className="pt-8">
                <div className="bg-muted rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">About the Author</h3>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                      <User size={32} className="text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {profile?.name || 'Anonymous Author'}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile?.bio || 'Content creator and link shortening enthusiast. Sharing insights about digital marketing and web technologies.'}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span>{publishedPosts.length} posts published</span>
                        <span>•</span>
                        <span>Member since {new Date(posts[0]?.createdAt || Date.now()).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            </article>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Globe size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {profile?.name ? `${profile.name}'s Blog` : 'LinkCraft Blog'}
                </h1>
                <p className="text-muted-foreground">
                  {profile?.bio || 'Insights, tips, and stories about link management and digital marketing'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => onNavigate('blog')}>
              Manage Blog
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All Posts
              </Button>
              {allTags.slice(0, 5).map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPost(post)}
              >
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt || post.content.substring(0, 150) + '...'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        <span>{post.readTime} min read</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {publishedPosts.length === 0 ? 'No published posts yet' : 'No posts found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {publishedPosts.length === 0 
                ? 'Posts will appear here once they are published'
                : 'Try adjusting your search criteria or browse all posts'
              }
            </p>
            {publishedPosts.length === 0 && (
              <Button onClick={() => onNavigate('blog')}>
                Create First Post
              </Button>
            )}
          </div>
        )}

        {publishedPosts.length > 0 && (
          <div className="mt-12 bg-muted rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Stay Updated</h3>
              <p className="text-muted-foreground mb-4">
                Follow this blog for the latest insights on link management and digital marketing.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen size={16} />
                  <span>{publishedPosts.length} posts published</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Tag size={16} />
                  <span>{allTags.length} topics covered</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}