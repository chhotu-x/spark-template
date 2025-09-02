import { useEffect, useCallback, useState } from 'react'
import { useKV } from '@github/spark/hooks'

interface PerformanceMetrics {
  pageLoadTime: number
  renderTime: number
  interactionLatency: number
  memoryUsage?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Enhanced performance monitoring and caching hook
 */
export function usePerformance() {
  const [metrics, setMetrics] = useKV<PerformanceMetrics>('performance-metrics', {
    pageLoadTime: 0,
    renderTime: 0,
    interactionLatency: 0
  })

  // Cache for expensive operations
  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map())

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now()
    
    // Measure page load time
    if (document.readyState === 'complete') {
      const loadTime = performance.now()
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }))
    } else {
      window.addEventListener('load', () => {
        const loadTime = performance.now()
        setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }))
      })
    }

    // Measure render time
    const renderTime = performance.now() - startTime
    setMetrics(prev => ({ ...prev, renderTime }))

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory
      setMetrics(prev => ({ 
        ...prev, 
        memoryUsage: memoryInfo.usedJSHeapSize 
      }))
    }
  }, [setMetrics])

  // Memoized cache operations
  const memoize = useCallback(<T,>(
    key: string,
    fn: () => T | Promise<T>,
    ttlMs: number = 300000 // 5 minutes default
  ): T | Promise<T> => {
    const cached = cache.get(key)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data
    }

    const result = fn()
    
    if (result instanceof Promise) {
      return result.then(data => {
        setCache(prev => new Map(prev.set(key, {
          data,
          timestamp: now,
          ttl: ttlMs
        })))
        return data
      })
    } else {
      setCache(prev => new Map(prev.set(key, {
        data: result,
        timestamp: now,
        ttl: ttlMs
      })))
      return result
    }
  }, [cache])

  // Clear expired cache entries
  const clearExpiredCache = useCallback(() => {
    const now = Date.now()
    setCache(prev => {
      const newCache = new Map()
      prev.forEach((entry, key) => {
        if ((now - entry.timestamp) < entry.ttl) {
          newCache.set(key, entry)
        }
      })
      return newCache
    })
  }, [])

  // Debounced function creator
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }) as T
  }, [])

  // Throttled function creator
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }, [])

  return {
    metrics,
    memoize,
    clearExpiredCache,
    debounce,
    throttle,
    cacheSize: cache.size
  }
}