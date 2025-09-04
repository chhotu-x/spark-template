import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useContentOptimization } from '@/hooks/useContentOptimization'
import { usePerformance } from '@/hooks/usePerformance'
import { 
  BookOpen, 
  Target, 
  Lightbulb, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Clock
} from '@phosphor-icons/react'

interface ContentEditorInsightsProps {
  content: string
  title: string
  tags: string[]
  metaDescription?: string
  onChange?: (suggestions: any) => void
}

/**
 * Enhanced content editor with real-time optimization insights
 */
export default function ContentEditorInsights({ 
  content, 
  title, 
  tags, 
  metaDescription,
  onChange 
}: ContentEditorInsightsProps) {
  const { analyzeContent, generateAIEnhancements } = useContentOptimization()
  const { debounce } = usePerformance()
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const debouncedGenerateAIRef = useRef<any>(null)

  // Analyze content with debouncing for performance
  const analysis = useMemo(() => {
    if (!content.trim() || !title.trim()) {
      return {
        readabilityScore: 0,
        wordCount: 0,
        readingTime: 0,
        keywordDensity: {},
        sentenceComplexity: 'simple' as const,
        suggestions: [],
        seoScore: 0
      }
    }
    return analyzeContent(content, title, tags, metaDescription)
  }, [content, title, tags, metaDescription, analyzeContent])

  // Create debounced function once with useCallback
  const createDebouncedAI = useCallback(() => {
    if (debouncedGenerateAIRef.current?.cancel) {
      debouncedGenerateAIRef.current.cancel()
    }
    
    debouncedGenerateAIRef.current = debounce(async (contentToAnalyze: string) => {
      if (contentToAnalyze.trim().length < 100) return
      
      setIsGeneratingAI(true)
      try {
        const suggestions = await generateAIEnhancements(contentToAnalyze)
        setAiSuggestions(suggestions)
        onChange?.(suggestions)
      } catch (error) {
        console.error('Failed to generate AI suggestions:', error)
      } finally {
        setIsGeneratingAI(false)
      }
    }, 2000)
    
    return debouncedGenerateAIRef.current
  }, [debounce, generateAIEnhancements, onChange])

  // Initialize debounced function
  useEffect(() => {
    createDebouncedAI()
    
    return () => {
      if (debouncedGenerateAIRef.current?.cancel) {
        debouncedGenerateAIRef.current.cancel()
      }
    }
  }, [createDebouncedAI])

  // Generate AI suggestions when content changes
  useEffect(() => {
    if (content.length > 100 && debouncedGenerateAIRef.current) {
      debouncedGenerateAIRef.current(content)
    }
  }, [content])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'complex': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Memoize top keywords calculation
  const topKeywords = useMemo(() => 
    Object.entries(analysis.keywordDensity)
      .slice(0, 5)
      .map(([word, density]) => ({ word, density })),
    [analysis.keywordDensity]
  )

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Words</span>
          </div>
          <div className="text-2xl font-bold mt-1">{analysis.wordCount}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Read Time</span>
          </div>
          <div className="text-2xl font-bold mt-1">{analysis.readingTime}m</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">SEO Score</span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${getScoreColor(analysis.seoScore)}`}>
            {analysis.seoScore}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Readability</span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${getScoreColor(analysis.readabilityScore)}`}>
            {Math.round(analysis.readabilityScore)}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="ai" className="relative">
            AI Insights
            {isGeneratingAI && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Readability Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Readability Analysis</CardTitle>
                <CardDescription>
                  Based on sentence structure and word complexity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reading Ease</span>
                    <span className={`text-sm font-bold ${getScoreColor(analysis.readabilityScore)}`}>
                      {Math.round(analysis.readabilityScore)}/100
                    </span>
                  </div>
                  <Progress value={analysis.readabilityScore} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Complexity</span>
                    <Badge className={getComplexityColor(analysis.sentenceComplexity)}>
                      {analysis.sentenceComplexity}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SEO Optimization</CardTitle>
                <CardDescription>
                  Search engine optimization rating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(analysis.seoScore)}`}>
                      {analysis.seoScore}/100
                    </span>
                  </div>
                  <Progress value={analysis.seoScore} className="h-2" />
                  
                  <div className="text-xs text-muted-foreground">
                    {analysis.seoScore >= 80 && 'Excellent SEO optimization!'}
                    {analysis.seoScore >= 60 && analysis.seoScore < 80 && 'Good SEO, room for improvement'}
                    {analysis.seoScore < 60 && 'Needs SEO improvements'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keyword Density</CardTitle>
              <CardDescription>
                Most frequently used words in your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topKeywords.map(({ word, density }) => (
                  <div key={word} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{word}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(density * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {density.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {topKeywords.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Write more content to see keyword analysis
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Content Suggestions
              </CardTitle>
              <CardDescription>
                Automated recommendations for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {suggestion}
                    </AlertDescription>
                  </Alert>
                ))}
                {analysis.suggestions.length === 0 && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">No suggestions - your content looks great!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-Powered Insights
                {isGeneratingAI && (
                  <div className="ml-2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </CardTitle>
              <CardDescription>
                Advanced recommendations powered by artificial intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGeneratingAI ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Analyzing your content...</p>
                  </div>
                </div>
              ) : aiSuggestions ? (
                <div className="space-y-6">
                  {aiSuggestions.writing && aiSuggestions.writing.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Writing Improvements</h4>
                      <div className="space-y-2">
                        {aiSuggestions.writing.map((suggestion: string, index: number) => (
                          <Alert key={index} className="border-blue-200 bg-blue-50">
                            <AlertDescription className="text-sm text-blue-800">
                              {suggestion}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiSuggestions.seo && aiSuggestions.seo.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">SEO Optimizations</h4>
                      <div className="space-y-2">
                        {aiSuggestions.seo.map((suggestion: string, index: number) => (
                          <Alert key={index} className="border-green-200 bg-green-50">
                            <AlertDescription className="text-sm text-green-800">
                              {suggestion}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiSuggestions.structure && aiSuggestions.structure.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Structure Enhancements</h4>
                      <div className="space-y-2">
                        {aiSuggestions.structure.map((suggestion: string, index: number) => (
                          <Alert key={index} className="border-purple-200 bg-purple-50">
                            <AlertDescription className="text-sm text-purple-800">
                              {suggestion}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : content.length < 100 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Write at least 100 characters to get AI insights
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button
                    onClick={() => {
                      if (debouncedGenerateAIRef.current) {
                        debouncedGenerateAIRef.current(content)
                      }
                    }}
                    disabled={isGeneratingAI}
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate AI Insights
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}