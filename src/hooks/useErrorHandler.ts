import { useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Custom error handling hook for consistent error reporting
 */
export function useErrorHandler() {
  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)
    
    const message = error.message || 'An unexpected error occurred'
    const userFriendlyMessage = getUserFriendlyError(message)
    
    toast.error(userFriendlyMessage)
    
    // In production, you might want to send errors to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // sendToMonitoringService(error, context)
    }
  }, [])

  const handleAsyncError = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await asyncOperation()
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), context)
      return null
    }
  }, [handleError])

  const wrapSync = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    context?: string
  ): T => {
    return ((...args: any[]) => {
      try {
        return fn(...args)
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), context)
        return null
      }
    }) as T
  }, [handleError])

  return {
    handleError,
    handleAsyncError,
    wrapSync
  }
}

function getUserFriendlyError(message: string): string {
  // Map technical errors to user-friendly messages
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection.'
  }
  
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'You don\'t have permission to perform this action.'
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return 'The requested item could not be found.'
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Please check your input and try again.'
  }
  
  // For other errors, return a generic message but keep it helpful
  return message.length > 100 
    ? 'Something went wrong. Please try again.' 
    : message
}