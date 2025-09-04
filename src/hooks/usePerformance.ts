import { useEffect, useCallback, useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'

interface PerformanceMetrics {
  pageLoadTime: number
  renderTime: number
  interactionLatency: number
  memoryUsage?: number
  componentRenderCount?: number
  lastInteraction?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
}

/**
 * Enhanced performance monitoring and caching hook
 */
export function usePerformance() {
  const [metrics, setMetrics] = useKV<PerformanceMetrics>('performance-metrics', {
    pageLoadTime: 0,
    renderTime: 0,
    interactionLatency: 0,
    componentRenderCount: 0
  })

  // Cache for expensive operations with LRU eviction
  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map())
  const cacheHitsRef = useRef<number>(0)
  const cacheMissesRef = useRef<number>(0)
  const renderCountRef = useRef<number>(0)

  // Track component renders
  useEffect(() => {
    renderCountRef.current++
    setMetrics(prev => ({ ...prev, componentRenderCount: renderCountRef.current }))
  })

  // Performance monitoring with cleanup
  useEffect(() => {
    const startTime = performance.now()
    let loadHandler: (() => void) | null = null
    
    // Measure page load time
    if (document.readyState === 'complete') {
      const loadTime = performance.now()
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }))
    } else {
      loadHandler = () => {
        const loadTime = performance.now()
        setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }))
      }
      window.addEventListener('load', loadHandler)
    }

    // Measure render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime
      setMetrics(prev => ({ ...prev, renderTime }))
    })

    // Memory usage monitoring with fallback
    const updateMemory = () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory
        setMetrics(prev => ({ 
          ...prev, 
          memoryUsage: memoryInfo.usedJSHeapSize 
        }))
      }
    }
    updateMemory()
    const memoryInterval = setInterval(updateMemory, 10000) // Update every 10 seconds

    // Interaction latency tracking
    const trackInteraction = () => {
      setMetrics(prev => ({ ...prev, lastInteraction: performance.now() }))
    }
    document.addEventListener('click', trackInteraction)
    document.addEventListener('keydown', trackInteraction)

    return () => {
      if (loadHandler) {
        window.removeEventListener('load', loadHandler)
      }
      clearInterval(memoryInterval)
      document.removeEventListener('click', trackInteraction)
      document.removeEventListener('keydown', trackInteraction)
    }
  }, [setMetrics])

  // Enhanced memoization with LRU cache
  const memoize = useCallback(<T,>(
    key: string,
    fn: () => T | Promise<T>,
    ttlMs: number = 300000, // 5 minutes default
    maxCacheSize: number = 100
  ): T | Promise<T> => {
    const cached = cache.get(key)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < cached.ttl) {
      cacheHitsRef.current++
      // Update hit count and move to end (LRU)
      cached.hits++
      cache.delete(key)
      cache.set(key, cached)
      return cached.data
    }

    cacheMissesRef.current++
    
    // Evict oldest entries if cache is too large
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }

    const result = fn()
    
    if (result instanceof Promise) {
      return result.then(data => {
        setCache(prev => {
          const newCache = new Map(prev)
          newCache.set(key, {
            data,
            timestamp: now,
            ttl: ttlMs,
            hits: 1
          })
          return newCache
        })
        return data
      }).catch(error => {
        // Don't cache errors
        throw error
      })
    } else {
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.set(key, {
          data: result,
          timestamp: now,
          ttl: ttlMs,
          hits: 1
        })
        return newCache
      })
      return result
    }
  }, [cache])

  // Clear expired cache entries with batch processing
  const clearExpiredCache = useCallback(() => {
    const now = Date.now()
    setCache(prev => {
      const newCache = new Map()
      const entries = Array.from(prev.entries())
      
      // Process in batches to avoid blocking
      for (let i = 0; i < entries.length; i++) {
        const [key, entry] = entries[i]
        if ((now - entry.timestamp) < entry.ttl) {
          newCache.set(key, entry)
        }
      }
      return newCache
    })
  }, [])

  // Improved debounce with cancel support
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T & { cancel: () => void } => {
    let timeout: NodeJS.Timeout | null = null
    
    const debounced = ((...args: any[]) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        func.apply(null, args)
        timeout = null
      }, wait)
    }) as T & { cancel: () => void }
    
    debounced.cancel = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
    }
    
    return debounced
  }, [])

  // Improved throttle with trailing call support
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
    options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
  ): T & { cancel: () => void } => {
    let waiting = false
    let lastArgs: any[] | null = null
    let timeout: NodeJS.Timeout | null = null
    
    const throttled = ((...args: any[]) => {
      if (!waiting) {
        if (options.leading) {
          func.apply(null, args)
        }
        waiting = true
        
        timeout = setTimeout(() => {
          if (options.trailing && lastArgs) {
            func.apply(null, lastArgs)
          }
          waiting = false
          lastArgs = null
        }, limit)
      } else {
        lastArgs = args
      }
    }) as T & { cancel: () => void }
    
    throttled.cancel = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      waiting = false
      lastArgs = null
    }
    
    return throttled
  }, [])

  // Get cache statistics
  const getCacheStats = useCallback(() => ({
    size: cache.size,
    hits: cacheHitsRef.current,
    misses: cacheMissesRef.current,
    hitRate: cacheHitsRef.current / (cacheHitsRef.current + cacheMissesRef.current) || 0,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl
    }))
  }), [cache])

  return {
    metrics,
    memoize,
    clearExpiredCache,
    debounce,
    throttle,
    cacheSize: cache.size,
    getCacheStats
  }
}