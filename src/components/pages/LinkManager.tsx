import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Link, Copy, BarChart3, DotsThree, Trash, Eye, MagnifyingGlass, Calendar, LockKey } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface ShortenedLink {
  id: string
  originalUrl: string
  shortCode: string
  title?: string
  description?: string
  clicks: number
  createdAt: string
  expiresAt?: string
  customAlias?: string
  password?: string
  qrCode?: string
}

export default function LinkManager() {
  const [links, setLinks] = useKV<ShortenedLink[]>('shortened-links', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null)

  const filteredLinks = links.filter(link => 
    link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`linkcraft.app/${text}`)
    toast.success('Link copied to clipboard!')
  }

  const deleteLink = (linkId: string) => {
    setLinks(currentLinks => currentLinks.filter(link => link.id !== linkId))
    toast.success('Link deleted successfully')
    setDeleteDialogOpen(false)
    setLinkToDelete(null)
  }

  const simulateClick = (linkId: string) => {
    setLinks(currentLinks => 
      currentLinks.map(link => 
        link.id === linkId 
          ? { ...link, clicks: link.clicks + 1 }
          : link
      )
    )
    toast.success('Click recorded!')
  }

  const getTotalClicks = () => {
    return links.reduce((sum, link) => sum + link.clicks, 0)
  }

  const getActiveLinks = () => {
    const now = new Date()
    return links.filter(link => !link.expiresAt || new Date(link.expiresAt) > now).length
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Link Manager</h1>
          <p className="text-muted-foreground">
            Manage and track all your shortened URLs in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
              <Link size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{links.length}</div>
              <p className="text-xs text-muted-foreground">
                {getActiveLinks()} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <BarChart3 size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalClicks()}</div>
              <p className="text-xs text-muted-foreground">
                Across all links
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {links.filter(link => 
                  new Date(link.createdAt).getMonth() === new Date().getMonth()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Links created
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Links</CardTitle>
            <CardDescription>
              Search, filter, and manage your shortened URLs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search links by title, URL, or short code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {filteredLinks.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="rounded-md border min-w-[800px]">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link</TableHead>
                      <TableHead>Original URL</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                linkcraft.app/{link.shortCode}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(link.shortCode)}
                              >
                                <Copy size={14} />
                              </Button>
                            </div>
                            {link.title && (
                              <p className="text-sm font-medium text-foreground">{link.title}</p>
                            )}
                            {link.description && (
                              <p className="text-xs text-muted-foreground">{link.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              {link.password && (
                                <Badge variant="secondary" className="text-xs">
                                  <LockKey size={12} className="mr-1" />
                                  Protected
                                </Badge>
                              )}
                              {link.customAlias && (
                                <Badge variant="outline" className="text-xs">
                                  Custom
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate" title={link.originalUrl}>
                              {link.originalUrl}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{link.clicks}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => simulateClick(link.id)}
                              title="Simulate click"
                            >
                              <Eye size={14} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{formatDate(link.createdAt)}</p>
                            {link.expiresAt && (
                              <p className="text-xs text-muted-foreground">
                                Expires: {formatDate(link.expiresAt)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isExpired(link.expiresAt) ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
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
                                onClick={() => copyToClipboard(link.shortCode)}
                              >
                                <Copy size={14} className="mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => simulateClick(link.id)}
                              >
                                <BarChart3 size={14} className="mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setLinkToDelete(link.id)
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
                <Link size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {links.length === 0 ? 'No links created yet' : 'No links found'}
                </h3>
                <p className="text-muted-foreground">
                  {links.length === 0 
                    ? 'Create your first shortened URL to get started'
                    : 'Try adjusting your search criteria'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Link</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this link? This action cannot be undone.
                All analytics data for this link will be permanently lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => linkToDelete && deleteLink(linkToDelete)}
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