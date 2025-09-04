import React, { useCallback, useRef } from 'react'

/**
 * Custom hook for optimizing component re-renders
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>(callback)
  const depsRef = useRef<React.DependencyList>(deps)

  // Check if dependencies have changed
  const depsChanged = !depsRef.current || 
    deps.length !== depsRef.current.length ||
    deps.some((dep, index) => dep !== depsRef.current![index])

  if (depsChanged) {
    callbackRef.current = callback
    depsRef.current = deps
  }

  return useCallback(callbackRef.current, deps)
}

/**
 * Custom hook for debouncing values to prevent excessive re-renders
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for stable object references to prevent unnecessary re-renders
 */
export function useStableObject<T extends Record<string, any>>(obj: T): T {
  const ref = useRef<T>(obj)
  
  // Only update if the object contents have actually changed
  const hasChanged = Object.keys(obj).some(key => obj[key] !== ref.current[key]) ||
                     Object.keys(ref.current).some(key => !(key in obj))
  
  if (hasChanged) {
    ref.current = obj
  }
  
  return ref.current
}