import { Pattern } from '../types/pattern'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { BarChart3, PieChart, TrendingUp, Package } from 'lucide-react'

interface PatternStatsProps {
  patterns: Pattern[]
}

export function PatternStats({ patterns }: PatternStatsProps) {
  // Calculate statistics
  const totalPatterns = patterns.length
  const companiesCount = new Set(patterns.map(p => p.patternCompany).filter(Boolean)).size
  const avgPatternsPerCompany = companiesCount > 0 ? Math.round(totalPatterns / companiesCount) : 0

  // Company distribution
  const companyStats = patterns.reduce((acc, pattern) => {
    const company = pattern.patternCompany || 'Unknown'
    acc[company] = (acc[company] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCompanies = Object.entries(companyStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  // Difficulty distribution
  const difficultyStats = patterns.reduce((acc, pattern) => {
    const difficulty = pattern.difficulty || 'Unknown'
    acc[difficulty] = (acc[difficulty] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Fabric type distribution
  const fabricStats = patterns.reduce((acc, pattern) => {
    if (pattern.fabricType) {
      const fabrics = pattern.fabricType.split(',').map(f => f.trim())
      fabrics.forEach(fabric => {
        acc[fabric] = (acc[fabric] || 0) + 1
      })
    }
    return acc
  }, {} as Record<string, number>)

  const topFabrics = Object.entries(fabricStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  // Photo completion rate
  const patternsWithBothPhotos = patterns.filter(p => p.frontPhotoUrl && p.backPhotoUrl).length
  const patternsWithOnePhoto = patterns.filter(p => (p.frontPhotoUrl || p.backPhotoUrl) && !(p.frontPhotoUrl && p.backPhotoUrl)).length
  const photoCompletionRate = totalPatterns > 0 ? Math.round((patternsWithBothPhotos / totalPatterns) * 100) : 0

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Advanced': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Expert': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (totalPatterns === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Overview Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{totalPatterns}</div>
          <p className="text-xs text-muted-foreground">
            From {companiesCount} {companiesCount === 1 ? 'company' : 'companies'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Photo Completion</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{photoCompletionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {patternsWithBothPhotos} with both photos
          </p>
        </CardContent>
      </Card>

      {/* Top Companies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Companies</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCompanies.slice(0, 3).map(([company, count]) => (
              <div key={company} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{company}</span>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Distribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Difficulty Levels</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(difficultyStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([difficulty, count]) => (
                <div key={difficulty} className="flex items-center justify-between">
                  <Badge className={`text-xs ${getDifficultyColor(difficulty)}`}>
                    {difficulty}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Fabric Types - Full Width */}
      {topFabrics.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Popular Fabric Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topFabrics.map(([fabric, count]) => (
                <Badge key={fabric} variant="outline" className="text-xs">
                  {fabric} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}