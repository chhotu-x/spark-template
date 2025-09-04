import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch'
import { 
  MagnifyingGlass, 
  Funnel, 
  X, 
  CalendarBlank, 
  SortAscending,
  SortDescending
} from '@phosphor-icons/react'

interface SearchFiltersProps {
  items: any[]
  onResultsChange: (results: any[]) => void
  className?: string
}

/**
 * Advanced search and filtering component with real-time results
 */
export default function AdvancedSearchFilters({ 
  items, 
  onResultsChange, 
  className = '' 
}: SearchFiltersProps) {
  const {
    searchOptions,
    filteredAndSortedItems,
    updateSearchOptions,
    debouncedSetSearchTerm,
    applyPreset,
    clearFilters,
    availableOptions,
    totalResults,
    hasActiveFilters
  } = useAdvancedSearch(items)

  const [dateRange, setDateRange] = useState<{start?: Date, end?: Date}>({})
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Update parent component with filtered results
  React.useEffect(() => {
    onResultsChange(filteredAndSortedItems)
  }, [filteredAndSortedItems, onResultsChange])

  const handleDateRangeChange = (range: {start?: Date, end?: Date}) => {
    setDateRange(range)
    updateSearchOptions({
      dateRange: {
        start: range.start?.toISOString(),
        end: range.end?.toISOString()
      }
    })
  }

  const toggleTag = (tag: string) => {
    const newTags = searchOptions.tags.includes(tag)
      ? searchOptions.tags.filter(t => t !== tag)
      : [...searchOptions.tags, tag]
    updateSearchOptions({ tags: newTags })
  }

  const toggleStatus = (status: string) => {
    const newStatus = searchOptions.status.includes(status)
      ? searchOptions.status.filter(s => s !== status)
      : [...searchOptions.status, status]
    updateSearchOptions({ status: newStatus })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts by title, content, or tags..."
            className="pl-10"
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
          />
        </div>
        
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Funnel className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Quick Presets */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Quick Filters</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['recent', 'popular', 'drafts', 'published'].map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset as any)}
                      className="h-6 px-2 text-xs capitalize"
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              {availableOptions.statuses.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <div className="space-y-2 mt-1">
                    {availableOptions.statuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={searchOptions.status.includes(status)}
                          onCheckedChange={() => toggleStatus(status)}
                        />
                        <label
                          htmlFor={`status-${status}`}
                          className="text-sm capitalize cursor-pointer"
                        >
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Filter */}
              {availableOptions.tags.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                    {availableOptions.tags.slice(0, 20).map((tag) => (
                      <Badge
                        key={tag}
                        variant={searchOptions.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                <div className="mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <CalendarBlank className="h-4 w-4" />
                        {dateRange.start && dateRange.end
                          ? `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
                          : dateRange.start
                          ? `From ${dateRange.start.toLocaleDateString()}`
                          : 'Select dates'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{
                          from: dateRange.start,
                          to: dateRange.end
                        }}
                        onSelect={(range) => {
                          if (range) {
                            handleDateRangeChange({
                              start: range.from,
                              end: range.to
                            })
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                  <Select
                    value={searchOptions.sortBy}
                    onValueChange={(value) => updateSearchOptions({ sortBy: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="views">Views</SelectItem>
                      <SelectItem value="likes">Likes</SelectItem>
                      <SelectItem value="readTime">Read Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Order</label>
                  <Select
                    value={searchOptions.sortOrder}
                    onValueChange={(value) => updateSearchOptions({ sortOrder: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc" className="gap-2">
                        <SortAscending className="h-4 w-4" />
                        Ascending
                      </SelectItem>
                      <SelectItem value="desc" className="gap-2">
                        <SortDescending className="h-4 w-4" />
                        Descending
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Funnel className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
              
              {searchOptions.searchTerm && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Search: "{searchOptions.searchTerm}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => debouncedSetSearchTerm('')}
                  />
                </Badge>
              )}
              
              {searchOptions.status.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1 text-xs">
                  Status: {status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => toggleStatus(status)}
                  />
                </Badge>
              ))}
              
              {searchOptions.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                  Tag: {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => toggleTag(tag)}
                  />
                </Badge>
              ))}
              
              {(searchOptions.dateRange.start || searchOptions.dateRange.end) && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Date range
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleDateRangeChange({})}
                  />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalResults} of {items.length} posts
          {hasActiveFilters && ` (filtered)`}
        </span>
        
        <div className="flex items-center gap-2">
          <span>Sorted by {searchOptions.sortBy}</span>
          {searchOptions.sortOrder === 'asc' ? (
            <SortAscending className="h-4 w-4" />
          ) : (
            <SortDescending className="h-4 w-4" />
          )}
        </div>
      </div>
    </div>
  )
}