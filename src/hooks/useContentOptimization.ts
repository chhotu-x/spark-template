import { useMemo, useCallback, useRef } from 'react'
import { useLLM } from '@github/spark/hooks'

interface ContentAnalysis {
  readabilityScore: number
  wordCount: number
  readingTime: number
  keywordDensity: Record<string, number>
  sentenceComplexity: 'simple' | 'moderate' | 'complex'
  suggestions: string[]
  seoScore: number
}

interface SEOMetrics {
  titleLength: number
  metaDescriptionLength: number
  headingStructure: { level: number; text: string }[]
  imageAltTags: number
  internalLinks: number
  externalLinks: number
}

/**
 * Advanced content optimization and SEO analysis hook
 */
export function useContentOptimization() {
  const { llm } = useLLM()
  const keywordCacheRef = useRef<Map<string, Record<string, number>>>(new Map())
  
  // Calculate reading time based on average reading speed (200 wpm)
  const calculateReadingTime = useCallback((content: string): number => {
    const words = content.trim().split(/\s+/).length
    return Math.ceil(words / 200)
  }, [])

  // Analyze text readability using simplified Flesch Reading Ease
  const calculateReadability = useCallback((content: string): number => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.trim().split(/\s+/)
    const syllables = words.reduce((count, word) => {
      return count + countSyllables(word)
    }, 0)

    if (sentences.length === 0 || words.length === 0) return 0

    const avgSentenceLength = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length

    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    return Math.max(0, Math.min(100, score))
  }, [])

  // Count syllables in a word (simplified approach)
  const countSyllables = (word: string): number => {
    word = word.toLowerCase()
    if (word.length <= 3) return 1
    
    const vowels = 'aeiouy'
    let count = 0
    let previousWasVowel = false
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !previousWasVowel) {
        count++
      }
      previousWasVowel = isVowel
    }
    
    // Adjust for silent 'e'
    if (word.endsWith('e')) count--
    
    return Math.max(1, count)
  }

  // Optimized keyword density calculation with caching
  const calculateKeywordDensity = useCallback((content: string): Record<string, number> => {
    // Check cache first
    const cacheKey = content.substring(0, 100) // Use first 100 chars as cache key
    if (keywordCacheRef.current.has(cacheKey)) {
      return keywordCacheRef.current.get(cacheKey)!
    }

    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3) // Filter out short words

    const wordCount: Record<string, number> = {}
    const totalWords = words.length

    // Use a more efficient counting method
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1
    }

    const density: Record<string, number> = {}
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
    
    for (const [word, count] of sortedWords) {
      density[word] = Math.round((count / totalWords) * 1000) / 10 // Round to 1 decimal
    }

    // Cache the result
    keywordCacheRef.current.set(cacheKey, density)
    if (keywordCacheRef.current.size > 50) {
      // Remove oldest entry
      const firstKey = keywordCacheRef.current.keys().next().value
      keywordCacheRef.current.delete(firstKey)
    }

    return density
  }, [])

  // Analyze sentence complexity
  const analyzeSentenceComplexity = useCallback((content: string): 'simple' | 'moderate' | 'complex' => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgLength = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).length
    }, 0) / sentences.length

    if (avgLength < 15) return 'simple'
    if (avgLength < 25) return 'moderate'
    return 'complex'
  }, [])

  // Generate content suggestions
  const generateSuggestions = useCallback((
    content: string,
    title: string,
    tags: string[]
  ): string[] => {
    const suggestions: string[] = []
    const wordCount = content.trim().split(/\s+/).length
    const readability = calculateReadability(content)
    const complexity = analyzeSentenceComplexity(content)

    // Word count suggestions
    if (wordCount < 300) {
      suggestions.push('Consider expanding your content. Posts with 300+ words tend to perform better.')
    } else if (wordCount > 2000) {
      suggestions.push('Your content is quite long. Consider breaking it into multiple posts or sections.')
    }

    // Readability suggestions
    if (readability < 30) {
      suggestions.push('Your content may be difficult to read. Try using shorter sentences and simpler words.')
    } else if (readability > 90) {
      suggestions.push('Your content might be too simple. Consider adding more detailed explanations.')
    }

    // Complexity suggestions
    if (complexity === 'complex') {
      suggestions.push('Try breaking down complex sentences for better readability.')
    }

    // Title suggestions
    if (title.length < 30) {
      suggestions.push('Consider a longer, more descriptive title (30-60 characters).')
    } else if (title.length > 60) {
      suggestions.push('Your title might be too long for search engines. Aim for 30-60 characters.')
    }

    // Tag suggestions
    if (tags.length < 3) {
      suggestions.push('Add more tags to improve discoverability (3-5 tags recommended).')
    } else if (tags.length > 5) {
      suggestions.push('Too many tags can dilute your content focus. Stick to 3-5 relevant tags.')
    }

    // Structure suggestions
    const headings = content.match(/#{1,6}\s+.+/g) || []
    if (headings.length === 0) {
      suggestions.push('Add headings to improve content structure and readability.')
    }

    return suggestions
  }, [calculateReadability, analyzeSentenceComplexity])

  // Calculate SEO score
  const calculateSEOScore = useCallback((
    title: string,
    content: string,
    tags: string[],
    metaDescription?: string
  ): number => {
    let score = 0
    const maxScore = 100

    // Title score (20 points)
    if (title.length >= 30 && title.length <= 60) score += 20
    else if (title.length >= 20 && title.length <= 70) score += 15
    else score += 5

    // Content length score (20 points)
    const wordCount = content.trim().split(/\s+/).length
    if (wordCount >= 300 && wordCount <= 2000) score += 20
    else if (wordCount >= 200) score += 15
    else score += 5

    // Headings score (15 points)
    const headings = content.match(/#{1,6}\s+.+/g) || []
    if (headings.length >= 2) score += 15
    else if (headings.length >= 1) score += 10
    else score += 0

    // Tags score (15 points)
    if (tags.length >= 3 && tags.length <= 5) score += 15
    else if (tags.length >= 2) score += 10
    else score += 5

    // Meta description score (15 points)
    if (metaDescription) {
      if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 15
      else if (metaDescription.length >= 100) score += 10
      else score += 5
    }

    // Readability score (15 points)
    const readability = calculateReadability(content)
    if (readability >= 60 && readability <= 70) score += 15
    else if (readability >= 50 && readability <= 80) score += 10
    else score += 5

    return Math.round((score / maxScore) * 100)
  }, [calculateReadability])

  // Main analysis function
  const analyzeContent = useCallback((
    content: string,
    title: string,
    tags: string[],
    metaDescription?: string
  ): ContentAnalysis => {
    const wordCount = content.trim().split(/\s+/).length
    const readingTime = calculateReadingTime(content)
    const readabilityScore = calculateReadability(content)
    const keywordDensity = calculateKeywordDensity(content)
    const sentenceComplexity = analyzeSentenceComplexity(content)
    const suggestions = generateSuggestions(content, title, tags)
    const seoScore = calculateSEOScore(title, content, tags, metaDescription)

    return {
      readabilityScore,
      wordCount,
      readingTime,
      keywordDensity,
      sentenceComplexity,
      suggestions,
      seoScore
    }
  }, [
    calculateReadingTime,
    calculateReadability,
    calculateKeywordDensity,
    analyzeSentenceComplexity,
    generateSuggestions,
    calculateSEOScore
  ])

  // Fixed AI enhancement generation with proper API usage
  const generateAIEnhancements = useCallback(async (content: string, focus?: string) => {
    try {
      const prompt = `
        Analyze this blog content and provide specific suggestions for improvement:
        
        Content: ${content.substring(0, 1000)}... 
        ${focus ? `Focus area: ${focus}` : ''}
        
        Please provide:
        1. 3 specific writing improvements
        2. 2 SEO optimization suggestions  
        3. 1 structural enhancement
        
        Format as JSON with arrays for each category.
      `
      
      const response = await llm(prompt, { 
        model: 'gpt-4o-mini',
        json: true 
      })
      
      // Parse response with validation
      try {
        const parsed = typeof response === 'string' ? JSON.parse(response) : response
        return {
          writing: parsed.writing || ['Consider varying sentence length for better flow'],
          seo: parsed.seo || ['Add more descriptive subheadings'],
          structure: parsed.structure || ['Include a clear conclusion section']
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        return {
          writing: ['Consider varying sentence length for better flow'],
          seo: ['Add more descriptive subheadings'],
          structure: ['Include a clear conclusion section']
        }
      }
    } catch (error) {
      console.error('Failed to generate AI enhancements:', error)
      return {
        writing: ['Consider varying sentence length for better flow'],
        seo: ['Add more descriptive subheadings'],
        structure: ['Include a clear conclusion section']
      }
    }
  }, [llm])

  return {
    analyzeContent,
    calculateReadingTime,
    calculateReadability,
    calculateKeywordDensity,
    generateAIEnhancements,
    countSyllables
  }
}