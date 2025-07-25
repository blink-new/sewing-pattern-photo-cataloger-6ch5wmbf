import { useState } from 'react'
import { Pattern } from '../types/pattern'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  Download, 
  Upload, 
  Search, 
  Filter, 
  BarChart3,
  Camera,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface QuickActionsProps {
  patterns: Pattern[]
  onExport?: () => void
  onImport?: () => void
}

export function QuickActions({ patterns, onExport, onImport }: QuickActionsProps) {
  const [showInsights, setShowInsights] = useState(false)

  // Calculate quick insights
  const totalPatterns = patterns.length
  const patternsWithoutPhotos = patterns.filter(p => !p.frontPhotoUrl && !p.backPhotoUrl).length
  const patternsWithIncompleteInfo = patterns.filter(p => 
    !p.patternName || !p.patternCompany || !p.patternNumber
  ).length
  const patternsWithBothPhotos = patterns.filter(p => p.frontPhotoUrl && p.backPhotoUrl).length

  const quickStats = [
    {
      label: 'Complete Patterns',
      value: patternsWithBothPhotos,
      total: totalPatterns,
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      label: 'Missing Photos',
      value: patternsWithoutPhotos,
      total: totalPatterns,
      icon: Camera,
      color: 'text-orange-600'
    },
    {
      label: 'Incomplete Info',
      value: patternsWithIncompleteInfo,
      total: totalPatterns,
      icon: AlertCircle,
      color: 'text-red-600'
    }
  ]

  if (totalPatterns === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Quick Actions</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInsights(!showInsights)}
          >
            {showInsights ? 'Hide' : 'Show'} Insights
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Advanced Search</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Bulk Edit</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-2"
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
              <span>Export Collection</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-2"
              onClick={onImport}
            >
              <Upload className="h-4 w-4" />
              <span>Import Patterns</span>
            </Button>
          </div>

          {/* Quick Insights */}
          {showInsights && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              {quickStats.map((stat) => {
                const Icon = stat.icon
                const percentage = stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0
                
                return (
                  <div key={stat.label} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{stat.label}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-foreground">{stat.value}</span>
                        <Badge variant="secondary" className="text-xs">
                          {percentage}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recommendations */}
          {showInsights && (patternsWithoutPhotos > 0 || patternsWithIncompleteInfo > 0) && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-foreground mb-2">Recommendations:</h4>
              <div className="space-y-2">
                {patternsWithoutPhotos > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Camera className="h-4 w-4 text-orange-600" />
                    <span>Add photos to {patternsWithoutPhotos} pattern{patternsWithoutPhotos !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {patternsWithIncompleteInfo > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>Complete info for {patternsWithIncompleteInfo} pattern{patternsWithIncompleteInfo !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}