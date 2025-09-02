import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Link, Copy, QrCode, Calendar, Gear, CheckCircle } from '@phosphor-icons/react'
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

export default function URLShortener() {
  const [links, setLinks] = useKV<ShortenedLink[]>('shortened-links', [])
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [password, setPassword] = useState('')
  const [hasExpiry, setHasExpiry] = useState(false)
  const [expiryDate, setExpiryDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastShortened, setLastShortened] = useState<ShortenedLink | null>(null)
  
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const generateShortCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const generateQRCode = (text: string): string => {
    const canvas = qrCanvasRef.current
    if (!canvas) return ''
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    canvas.width = 200
    canvas.height = 200
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 200, 200)
    
    ctx.fillStyle = '#000000'
    const gridSize = 25
    const cellSize = 200 / gridSize
    
    const textHash = text.split('').reduce((hash, char) => {
      return char.charCodeAt(0) + ((hash << 5) - hash)
    }, 0)
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const cellHash = (textHash + i * gridSize + j) % 2
        if (cellHash === 0) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
        }
      }
    }
    
    return canvas.toDataURL()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url) {
      toast.error('Please enter a URL')
      return
    }
    
    if (!isValidUrl(url)) {
      toast.error('Please enter a valid URL')
      return
    }

    if (customAlias && links.some(link => link.customAlias === customAlias || link.shortCode === customAlias)) {
      toast.error('This alias is already taken')
      return
    }

    setIsLoading(true)

    try {
      const shortCode = customAlias || generateShortCode()
      const shortUrl = `linkcraft.app/${shortCode}`
      const qrCode = generateQRCode(shortUrl)
      
      const newLink: ShortenedLink = {
        id: Date.now().toString(),
        originalUrl: url,
        shortCode,
        title: title || undefined,
        description: description || undefined,
        customAlias: customAlias || undefined,
        password: password || undefined,
        clicks: 0,
        createdAt: new Date().toISOString(),
        expiresAt: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : undefined,
        qrCode
      }

      setLinks(currentLinks => [...currentLinks, newLink])
      setLastShortened(newLink)
      
      setUrl('')
      setCustomAlias('')
      setTitle('')
      setDescription('')
      setPassword('')
      setHasExpiry(false)
      setExpiryDate('')
      
      toast.success('URL shortened successfully!')
    } catch (error) {
      toast.error('Failed to shorten URL')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const downloadQR = (qrCode: string, filename: string) => {
    const link = document.createElement('a')
    link.download = `${filename}-qr.png`
    link.href = qrCode
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR code downloaded!')
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">URL Shortener</h1>
          <p className="text-muted-foreground">
            Create short, memorable links with advanced features and tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link size={20} />
                Shorten URL
              </CardTitle>
              <CardDescription>
                Transform long URLs into short, trackable links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url">Long URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/very-long-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-alias">Custom Alias (optional)</Label>
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex items-center px-3 bg-muted border border-b-0 sm:border-b sm:border-r-0 rounded-t-md sm:rounded-l-md sm:rounded-t-none">
                      <span className="text-sm text-muted-foreground">linkcraft.app/</span>
                    </div>
                    <Input
                      id="custom-alias"
                      placeholder="my-link"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                      className="rounded-b-md sm:rounded-l-none sm:rounded-b-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      placeholder="My Important Link"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a description for this link..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="expiry"
                    checked={hasExpiry}
                    onCheckedChange={setHasExpiry}
                  />
                  <Label htmlFor="expiry">Set expiration date</Label>
                </div>

                {hasExpiry && (
                  <div className="space-y-2">
                    <Label htmlFor="expiry-date">Expiry Date</Label>
                    <Input
                      id="expiry-date"
                      type="datetime-local"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Gear size={18} className="mr-2 animate-spin" />
                      Shortening...
                    </>
                  ) : (
                    <>
                      <Link size={18} className="mr-2" />
                      Shorten URL
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {lastShortened && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-success" />
                  Link Created Successfully!
                </CardTitle>
                <CardDescription>
                  Your shortened link is ready to share
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">SHORT URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={`linkcraft.app/${lastShortened.shortCode}`}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`linkcraft.app/${lastShortened.shortCode}`)}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">ORIGINAL URL</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm text-muted-foreground truncate">
                      {lastShortened.originalUrl}
                    </div>
                  </div>
                </div>

                {lastShortened.qrCode && (
                  <div className="text-center">
                    <Label className="text-xs font-medium text-muted-foreground">QR CODE</Label>
                    <div className="mt-2">
                      <img
                        src={lastShortened.qrCode}
                        alt="QR Code"
                        className="mx-auto border rounded"
                        width={150}
                        height={150}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => downloadQR(lastShortened.qrCode!, lastShortened.shortCode)}
                      >
                        <QrCode size={16} className="mr-2" />
                        Download QR
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-foreground">0</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">
                      {new Date(lastShortened.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Created</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">
                      {lastShortened.expiresAt ? new Date(lastShortened.expiresAt).toLocaleDateString() : '∞'}
                    </div>
                    <div className="text-xs text-muted-foreground">Expires</div>
                  </div>
                </div>

                {lastShortened.password && (
                  <Badge variant="secondary" className="w-full justify-center">
                    Password Protected
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <canvas ref={qrCanvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}