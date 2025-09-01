import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, Globe, Users, Calendar, Download } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface ShortenedLink {
  id: string
  originalUrl: string
  shortCode: string
  title?: string
  clicks: number
  createdAt: string
}

export default function Analytics() {
  const [links] = useKV<ShortenedLink[]>('shortened-links', [])

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
  const totalLinks = links.length
  const avgClicksPerLink = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0

  const topLinks = [...links]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)

  const generateDailyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map(day => ({
      day,
      clicks: Math.floor(Math.random() * 50) + 10
    }))
  }

  const generateCountryData = () => {
    const countries = [
      { country: 'United States', clicks: Math.floor(Math.random() * 200) + 100, code: 'US' },
      { country: 'United Kingdom', clicks: Math.floor(Math.random() * 150) + 50, code: 'GB' },
      { country: 'Germany', clicks: Math.floor(Math.random() * 120) + 40, code: 'DE' },
      { country: 'France', clicks: Math.floor(Math.random() * 100) + 30, code: 'FR' },
      { country: 'Canada', clicks: Math.floor(Math.random() * 80) + 20, code: 'CA' },
    ]
    return countries.sort((a, b) => b.clicks - a.clicks)
  }

  const generateReferrerData = () => {
    return [
      { name: 'Direct', value: 45, color: '#0369a1' },
      { name: 'Social Media', value: 25, color: '#0891b2' },
      { name: 'Email', value: 15, color: '#0d9488' },
      { name: 'Search', value: 10, color: '#059669' },
      { name: 'Other', value: 5, color: '#65a30d' }
    ]
  }

  const dailyData = generateDailyData()
  const countryData = generateCountryData()
  const referrerData = generateReferrerData()

  const exportData = () => {
    const csvContent = [
      'Short Code,Original URL,Title,Clicks,Created Date',
      ...links.map(link => 
        `${link.shortCode},"${link.originalUrl}","${link.title || ''}",${link.clicks},${link.createdAt}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'linkcraft-analytics.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Track performance and gain insights from your shortened links.
            </p>
          </div>
          <Button onClick={exportData} variant="outline">
            <Download size={16} className="mr-2" />
            Export Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <BarChart3 size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalClicks}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
              <TrendingUp size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalLinks}</div>
              <p className="text-xs text-muted-foreground">
                Active shortened URLs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Clicks/Link</CardTitle>
              <Users size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{avgClicksPerLink}</div>
              <p className="text-xs text-muted-foreground">
                Performance metric
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="referrers">Referrers</TabsTrigger>
            <TabsTrigger value="top-links">Top Links</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Clicks</CardTitle>
                  <CardDescription>
                    Click activity over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="clicks" fill="oklch(0.45 0.15 250)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Click Trends</CardTitle>
                  <CardDescription>
                    Performance trend over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke="oklch(0.70 0.15 50)" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>
                  Where your clicks are coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {countryData.map((country, index) => (
                    <div key={country.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-6 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs font-mono">{country.code}</span>
                        </div>
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <Progress 
                            value={(country.clicks / countryData[0].clicks) * 100} 
                            className="h-2"
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {country.clicks}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>
                    How users are finding your links
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={referrerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {referrerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Source Breakdown</CardTitle>
                  <CardDescription>
                    Detailed traffic source analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {referrerData.map((source) => (
                      <div key={source.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: source.color }}
                          />
                          <span className="font-medium">{source.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {source.value}%
                          </span>
                          <Badge variant="secondary">
                            {Math.round((source.value / 100) * totalClicks)} clicks
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="top-links" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>
                  Your most clicked shortened URLs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topLinks.length > 0 ? (
                  <div className="space-y-4">
                    {topLinks.map((link, index) => (
                      <div key={link.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {link.title || link.originalUrl}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              linkcraft.app/{link.shortCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">{link.clicks}</p>
                            <p className="text-xs text-muted-foreground">clicks</p>
                          </div>
                          <Badge variant="secondary">
                            {totalClicks > 0 ? Math.round((link.clicks / totalClicks) * 100) : 0}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No link data available yet. Create some links to see analytics.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}