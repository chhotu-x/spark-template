import { useState, useMemo, useCallback, useRef } from 'react'
import { usePerformance } from './usePerformance'

interface SearchOptions {
  searchTerm: string
  tags: string[]
  status: string[]
  dateRange: {
    start?: string
    end?: string
  }
  sortBy: 'title' | 'date' | 'views' | 'likes' | 'readTime'
  sortOrder: 'asc' | 'desc'
  limit?: number
}

interface SearchableItem {
  id: string
  title: string
  content: string
  tags: string[]
  status: string
  createdAt: string
  updatedAt: string
  [key: string]: any
}

/**
 * Enhanced search and filtering hook with performance optimizations
 */
export function useAdvancedSearch<T extends SearchableItem>(items: T[]) {
  const { memoize, debounce } = usePerformance()
  const searchCacheRef = useRef<Map<string, number>>(new Map())
  
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    searchTerm: '',
    tags: [],
    status: [],
    dateRange: {},
    sortBy: 'date',
    sortOrder: 'desc'
  })

  // Debounced search term update with cancel support
  const debouncedSetSearchTerm = useMemo(
    () => debounce((term: string) => {
      setSearchOptions(prev => ({ ...prev, searchTerm: term }))
    }, 300),
    [debounce]
  )

  // Optimized fuzzy matching with caching
  const fuzzyMatch = useCallback((text: string, searchTerm: string): number => {
    const cacheKey = `${text.substring(0, 50)}_${searchTerm}`
    if (searchCacheRef.current.has(cacheKey)) {
      return searchCacheRef.current.get(cacheKey)!
    }

    const term = searchTerm.toLowerCase()
    const content = text.toLowerCase()
    
    // Exact match gets highest score
    if (content.includes(term)) {
      const score = content.indexOf(term) === 0 ? 100 : 80
      searchCacheRef.current.set(cacheKey, score)
      return score
    }
    
    // Optimized character-by-character fuzzy matching
    let score = 0
    let termIndex = 0
    let lastMatchIndex = -1
    
    for (let i = 0; i < content.length && termIndex < term.length; i++) {
      if (content[i] === term[termIndex]) {
        // Bonus for consecutive matches
        score += (i - lastMatchIndex === 1) ? 2 : 1
        lastMatchIndex = i
        termIndex++
      }
    }
    
    const finalScore = termIndex === term.length ? (score / term.length) * 60 : 0
    
    // Cache cleanup
    if (searchCacheRef.current.size > 1000) {
      searchCacheRef.current.clear()
    }
    searchCacheRef.current.set(cacheKey, finalScore)
    
    return finalScore
  }, [])

  // Optimized filtering and sorting with better memoization
  const filteredAndSortedItems = useMemo(() => {
    const cacheKey = `search-${JSON.stringify(searchOptions)}-${items.length}`
    
    return memoize(
      cacheKey,
      () => {
        let filtered = [...items]

        // Text search with early termination
        if (searchOptions.searchTerm) {
          const searchResults = filtered
            .map(item => {
              const titleScore = fuzzyMatch(item.title, searchOptions.searchTerm)
              if (titleScore === 100) return { item, score: titleScore } // Early return for exact matches
              
              const contentScore = fuzzyMatch(item.content.substring(0, 500), searchOptions.searchTerm) // Limit content search
              const tagScore = Math.max(...item.tags.map(tag => 
                fuzzyMatch(tag, searchOptions.searchTerm)
              ), 0)
              
              return {
                item,
                score: Math.max(titleScore, contentScore * 0.8, tagScore * 0.9)
              }
            })
            .filter(({ score }) => score > 20)
          
          // Sort by score only if we have results
          if (searchResults.length > 0) {
            searchResults.sort((a, b) => b.score - a.score)
            filtered = searchResults.map(({ item }) => item)
          } else {
            filtered = []
          }
        }

        // Tag filtering
        if (searchOptions.tags.length > 0) {
          filtered = filtered.filter(item =>
            searchOptions.tags.every(tag =>
              item.tags.some(itemTag =>
                itemTag.toLowerCase().includes(tag.toLowerCase())
              )
            )
          )
        }

        // Status filtering
        if (searchOptions.status.length > 0) {
          filtered = filtered.filter(item =>
            searchOptions.status.includes(item.status)
          )
        }

        // Date range filtering
        if (searchOptions.dateRange.start || searchOptions.dateRange.end) {
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.createdAt)
            const start = searchOptions.dateRange.start ? new Date(searchOptions.dateRange.start) : null
            const end = searchOptions.dateRange.end ? new Date(searchOptions.dateRange.end) : null
            
            return (!start || itemDate >= start) && (!end || itemDate <= end)
          })
        }

        // Sorting
        filtered.sort((a, b) => {
          let aValue: any
          let bValue: any

          switch (searchOptions.sortBy) {
            case 'title':
              aValue = a.title.toLowerCase()
              bValue = b.title.toLowerCase()
              break
            case 'date':
              aValue = new Date(a.createdAt).getTime()
              bValue = new Date(b.createdAt).getTime()
              break
            case 'views':
              aValue = a.views || 0
              bValue = b.views || 0
              break
            case 'likes':
              aValue = a.likes || 0
              bValue = b.likes || 0
              break
            case 'readTime':
              aValue = a.readTime || 0
              bValue = b.readTime || 0
              break
            default:
              aValue = a.createdAt
              bValue = b.createdAt
          }

          if (aValue < bValue) return searchOptions.sortOrder === 'asc' ? -1 : 1
          if (aValue > bValue) return searchOptions.sortOrder === 'asc' ? 1 : -1
          return 0
        })

        // Apply limit if specified
        if (searchOptions.limit) {
          filtered = filtered.slice(0, searchOptions.limit)
        }

        return filtered
      },
      60000 // Cache for 1 minute
    ) as T[]
  }, [items, searchOptions, memoize, fuzzyMatch])

  // Update search options
  const updateSearchOptions = useCallback((updates: Partial<SearchOptions>) => {
    setSearchOptions(prev => ({ ...prev, ...updates }))
  }, [])

  // Quick filter presets
  const applyPreset = useCallback((preset: 'recent' | 'popular' | 'drafts' | 'published') => {
    switch (preset) {
      case 'recent':
        updateSearchOptions({
          sortBy: 'date',
          sortOrder: 'desc',
          status: [],
          tags: []
        })
        break
      case 'popular':
        updateSearchOptions({
          sortBy: 'views',
          sortOrder: 'desc',
          status: ['published'],
          tags: []
        })
        break
      case 'drafts':
        updateSearchOptions({
          status: ['draft'],
          sortBy: 'date',
          sortOrder: 'desc'
        })
        break
      case 'published':
        updateSearchOptions({
          status: ['published'],
          sortBy: 'date',
          sortOrder: 'desc'
        })
        break
    }
  }, [updateSearchOptions])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchOptions({
      searchTerm: '',
      tags: [],
      status: [],
      dateRange: {},
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }, [])

  // Get available filter options from items
  const availableOptions = useMemo(() => {
    const allTags = new Set<string>()
    const allStatuses = new Set<string>()
    
    items.forEach(item => {
      item.tags.forEach(tag => allTags.add(tag))
      allStatuses.add(item.status)
    })

    return {
      tags: Array.from(allTags).sort(),
      statuses: Array.from(allStatuses).sort()
    }
  }, [items])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    debouncedSetSearchTerm.cancel()
    searchCacheRef.current.clear()
  }, [debouncedSetSearchTerm])

  return {
    searchOptions,
    filteredAndSortedItems,
    updateSearchOptions,
    debouncedSetSearchTerm,
    applyPreset,
    clearFilters,
    availableOptions,
    totalResults: filteredAndSortedItems.length,
    hasActiveFilters: Boolean(
      searchOptions.searchTerm ||
      searchOptions.tags.length > 0 ||
      searchOptions.status.length > 0 ||
      searchOptions.dateRange.start ||
      searchOptions.dateRange.end
    ),
    cleanup
  }
}