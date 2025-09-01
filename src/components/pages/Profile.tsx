import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Globe, FloppyDisk, Link, Article, BarChart3, Calendar } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface UserProfile {
  name: string
  email: string
  bio: string
  website: string
  customDomain: string
  brandColor: string
  avatar: string
}

export default function Profile() {
  const [profile, setProfile] = useKV<UserProfile>('user-profile', {
    name: '',
    email: '',
    bio: '',
    website: '',
    customDomain: '',
    brandColor: '#3b82f6',
    avatar: ''
  })
  const [links] = useKV<any[]>('shortened-links', [])
  const [posts] = useKV<any[]>('blog-posts', [])

  const [formData, setFormData] = useState(profile)

  const handleSave = () => {
    setProfile(formData)
    toast.success('Profile updated successfully!')
  }

  const handleReset = () => {
    setFormData(profile)
    toast.success('Changes reset!')
  }

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0)
  const publishedPosts = posts.filter(post => post.status === 'published').length

  const accountStats = [
    {
      label: 'Links Created',
      value: links.length,
      icon: Link,
      color: 'text-primary'
    },
    {
      label: 'Total Clicks',
      value: totalClicks,
      icon: BarChart3,
      color: 'text-accent'
    },
    {
      label: 'Blog Posts',
      value: publishedPosts,
      icon: Article,
      color: 'text-success'
    },
    {
      label: 'Member Since',
      value: '2024',
      icon: Calendar,
      color: 'text-muted-foreground'
    }
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and customize your brand presence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and public profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe size={20} />
                  Brand Customization
                </CardTitle>
                <CardDescription>
                  Customize your brand appearance and domains
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                      <span className="text-sm text-muted-foreground">https://</span>
                    </div>
                    <Input
                      id="custom-domain"
                      placeholder="links.yourdomain.com"
                      value={formData.customDomain}
                      onChange={(e) => setFormData({...formData, customDomain: e.target.value})}
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use your own domain for shortened links (Pro feature)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-color">Brand Color</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="brand-color"
                      type="color"
                      value={formData.brandColor}
                      onChange={(e) => setFormData({...formData, brandColor: e.target.value})}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.brandColor}
                      onChange={(e) => setFormData({...formData, brandColor: e.target.value})}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This color will be used for QR codes and branded elements
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Brand Preview</h4>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: formData.brandColor }}
                    >
                      <Link size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {formData.name || 'Your Name'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.customDomain || 'linkcraft.app'}/yourlink
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={handleSave} className="flex-1">
                <FloppyDisk size={16} className="mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
                <CardDescription>
                  Your current profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                    <User size={40} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {profile.name || 'Anonymous User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {profile.email || 'No email set'}
                    </p>
                  </div>
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground">
                      {profile.bio}
                    </p>
                  )}
                  {profile.website && (
                    <Badge variant="outline" className="text-xs">
                      <Globe size={12} className="mr-1" />
                      Website
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>
                  Your LinkCraft activity summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accountStats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <stat.icon size={16} className={stat.color} />
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                      <span className="font-medium text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common profile-related tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Globe size={14} className="mr-2" />
                    View Public Profile
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Link size={14} className="mr-2" />
                    Export Link Data
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Article size={14} className="mr-2" />
                    Download Blog Backup
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan & Usage</CardTitle>
                <CardDescription>
                  Your current subscription details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Plan</span>
                    <Badge>Free Plan</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Links Created</span>
                    <span className="text-sm">{links.length}/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Blog Posts</span>
                    <span className="text-sm">{posts.length}/10</span>
                  </div>
                  <Separator />
                  <Button variant="outline" size="sm" className="w-full">
                    Upgrade to Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}