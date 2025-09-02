import { useState, useMemo, useCallback } from 'react'
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
  
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    searchTerm: '',
    tags: [],
    status: [],
    dateRange: {},
    sortBy: 'date',
    sortOrder: 'desc'
  })

  // Debounced search term update
  const debouncedSetSearchTerm = debounce((term: string) => {
    setSearchOptions(prev => ({ ...prev, searchTerm: term }))
  }, 300)

  // Advanced text search with fuzzy matching
  const fuzzyMatch = useCallback((text: string, searchTerm: string): number => {
    const term = searchTerm.toLowerCase()
    const content = text.toLowerCase()
    
    // Exact match gets highest score
    if (content.includes(term)) {
      return content.indexOf(term) === 0 ? 100 : 80
    }
    
    // Character-by-character fuzzy matching
    let score = 0
    let termIndex = 0
    
    for (let i = 0; i < content.length && termIndex < term.length; i++) {
      if (content[i] === term[termIndex]) {
        score += 1
        termIndex++
      }
    }
    
    return termIndex === term.length ? (score / term.length) * 60 : 0
  }, [])

  // Memoized filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    return memoize(
      `search-${JSON.stringify(searchOptions)}-${items.length}`,
      () => {
        let filtered = [...items]

        // Text search
        if (searchOptions.searchTerm) {
          filtered = filtered
            .map(item => ({
              item,
              score: Math.max(
                fuzzyMatch(item.title, searchOptions.searchTerm),
                fuzzyMatch(item.content, searchOptions.searchTerm),
                item.tags.reduce((max, tag) => 
                  Math.max(max, fuzzyMatch(tag, searchOptions.searchTerm)), 0
                )
              )
            }))
            .filter(({ score }) => score > 20)
            .sort((a, b) => b.score - a.score)
            .map(({ item }) => item)
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
    )
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
    )
  }
}