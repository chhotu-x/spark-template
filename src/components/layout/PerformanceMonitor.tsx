import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePerformance } from '@/hooks/usePerformance'
import { 
  Zap, 
  Clock, 
  Database, 
  Cpu, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from '@phosphor-icons/react'

/**
 * Performance monitoring widget for debugging and optimization
 */
export default function PerformanceMonitor() {
  const { metrics, cacheSize, clearExpiredCache } = usePerformance()
  const [isVisible, setIsVisible] = useState(false)
  const [memoryTrend, setMemoryTrend] = useState<number[]>([])

  // Track memory usage over time
  useEffect(() => {
    if (metrics.memoryUsage) {
      setMemoryTrend(prev => {
        const newTrend = [...prev, metrics.memoryUsage!]
        return newTrend.slice(-10) // Keep last 10 measurements
      })
    }
  }, [metrics.memoryUsage])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getPerformanceStatus = () => {
    const issues: string[] = []
    
    if (metrics.pageLoadTime > 3000) issues.push('Slow page load')
    if (metrics.renderTime > 100) issues.push('Slow render')
    if (cacheSize > 50) issues.push('High cache usage')
    if (metrics.memoryUsage && metrics.memoryUsage > 50 * 1024 * 1024) issues.push('High memory usage')
    
    return {
      status: issues.length === 0 ? 'good' : issues.length < 3 ? 'warning' : 'error',
      issues
    }
  }

  const performanceStatus = getPerformanceStatus()

  // Only show in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || isVisible

  if (!shouldShow) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <Activity className="h-4 w-4" />
          Performance
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              {performanceStatus.status === 'good' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {performanceStatus.status === 'warning' && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              {performanceStatus.status === 'error' && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
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
            Real-time application performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Performance Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>Page Load</span>
              </div>
              <span className="font-mono">{formatTime(metrics.pageLoadTime)}</span>
            </div>
            <Progress 
              value={Math.min((metrics.pageLoadTime / 3000) * 100, 100)} 
              className="h-1"
            />

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="h-3 w-3 text-muted-foreground" />
                <span>Render Time</span>
              </div>
              <span className="font-mono">{formatTime(metrics.renderTime)}</span>
            </div>
            <Progress 
              value={Math.min((metrics.renderTime / 100) * 100, 100)} 
              className="h-1"
            />

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-muted-foreground" />
                <span>Cache Entries</span>
              </div>
              <span className="font-mono">{cacheSize}</span>
            </div>
            <Progress 
              value={Math.min((cacheSize / 50) * 100, 100)} 
              className="h-1"
            />

            {metrics.memoryUsage && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span>Memory Usage</span>
                  </div>
                  <span className="font-mono">{formatBytes(metrics.memoryUsage)}</span>
                </div>
                <Progress 
                  value={Math.min((metrics.memoryUsage / (100 * 1024 * 1024)) * 100, 100)} 
                  className="h-1"
                />
              </>
            )}
          </div>

          {/* Performance Status */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium">Status</span>
              <Badge 
                variant={performanceStatus.status === 'good' ? 'default' : 
                        performanceStatus.status === 'warning' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {performanceStatus.status === 'good' ? 'Optimal' : 
                 performanceStatus.status === 'warning' ? 'Warning' : 'Issues'}
              </Badge>
            </div>
            
            {performanceStatus.issues.length > 0 && (
              <div className="space-y-1">
                {performanceStatus.issues.map((issue, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {issue}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={clearExpiredCache}
              className="w-full text-xs"
            >
              Clear Expired Cache
            </Button>
          </div>

          {/* Memory Trend (if available) */}
          {memoryTrend.length > 3 && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs font-medium mb-2">Memory Trend</div>
              <div className="flex items-end gap-1 h-8">
                {memoryTrend.map((value, index) => {
                  const height = Math.max((value / Math.max(...memoryTrend)) * 100, 5)
                  return (
                    <div
                      key={index}
                      className="bg-primary/20 rounded-sm flex-1"
                      style={{ height: `${height}%` }}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}