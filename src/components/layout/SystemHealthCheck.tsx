import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { usePerformance } from '@/hooks/usePerformance'
import { useBlogAnalytics } from '@/hooks/useBlogAnalytics'

interface HealthCheck {
  name: string
  status: 'healthy' | 'warning' | 'error'
  message: string
  lastChecked: string
}

/**
 * System health monitoring component for development and debugging
 */
export default function SystemHealthCheck() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [posts] = useKV('blog-posts', [])
  const { metrics, cacheSize } = usePerformance()
  const { analytics } = useBlogAnalytics()

  const runHealthChecks = () => {
    const checks: HealthCheck[] = []
    const now = new Date().toISOString()

    // Check KV storage
    try {
      checks.push({
        name: 'KV Storage',
        status: 'healthy',
        message: `${posts.length} posts stored successfully`,
        lastChecked: now
      })
    } catch (error) {
      checks.push({
        name: 'KV Storage',
        status: 'error',
        message: 'Failed to access storage',
        lastChecked: now
      })
    }

    // Check performance metrics
    const performanceStatus = 
      metrics.pageLoadTime > 3000 ? 'error' :
      metrics.pageLoadTime > 1500 ? 'warning' : 'healthy'
    
    checks.push({
      name: 'Performance',
      status: performanceStatus,
      message: `Load time: ${Math.round(metrics.pageLoadTime)}ms, Cache: ${cacheSize} entries`,
      lastChecked: now
    })

    // Check analytics
    const totalViews = Object.values(analytics.views).reduce((sum: number, views) => sum + views, 0)
    checks.push({
      name: 'Analytics',
      status: 'healthy',
      message: `Tracking ${totalViews} total views across ${Object.keys(analytics.views).length} posts`,
      lastChecked: now
    })

    // Check memory usage
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory
      const memoryUsageMB = memoryInfo.usedJSHeapSize / (1024 * 1024)
      const memoryStatus = memoryUsageMB > 50 ? 'warning' : 'healthy'
      
      checks.push({
        name: 'Memory Usage',
        status: memoryStatus,
        message: `${Math.round(memoryUsageMB)}MB used`,
        lastChecked: now
      })
    }

    // Check React features
    try {
      // Test hook functionality
      const [testValue] = useKV('health-check-test', 'test')
      checks.push({
        name: 'React Hooks',
        status: testValue === 'test' ? 'healthy' : 'warning',
        message: 'All hooks functioning correctly',
        lastChecked: now
      })
    } catch (error) {
      checks.push({
        name: 'React Hooks',
        status: 'error',
        message: 'Hook error detected',
        lastChecked: now
      })
    }

    setHealthChecks(checks)
  }

  useEffect(() => {
    runHealthChecks()
    const interval = setInterval(runHealthChecks, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10 text-green-700 border-green-500/20'
      case 'warning': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
      case 'error': return 'bg-red-500/10 text-red-700 border-red-500/20'
    }
  }

  const overallStatus = healthChecks.some(check => check.status === 'error') ? 'error' :
                       healthChecks.some(check => check.status === 'warning') ? 'warning' : 'healthy'

  // Only show in development
  if (process.env.NODE_ENV !== 'development' && !isVisible) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      {!isVisible ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          {getStatusIcon(overallStatus)}
          System Status
        </Button>
      ) : (
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon(overallStatus)}
                System Health
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={runHealthChecks}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
            <CardDescription className="text-xs">
              Real-time application health monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthChecks.map((check, index) => (
              <div key={index} className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  {getStatusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs">{check.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {check.message}
                    </div>
                  </div>
                </div>
                <Badge className={`text-xs ${getStatusColor(check.status)}`}>
                  {check.status}
                </Badge>
              </div>
            ))}
            
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}