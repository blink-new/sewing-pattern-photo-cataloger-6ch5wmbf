import { useState } from 'react'
import { Pattern } from '../types/pattern'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Eye, EyeOff, Image as ImageIcon } from 'lucide-react'

interface PatternGalleryProps {
  patterns: Pattern[]
  companies: string[]
  onPatternClick: (pattern: Pattern) => void
}

export function PatternGallery({ patterns, companies, onPatternClick }: PatternGalleryProps) {
  const [showBackPhotos, setShowBackPhotos] = useState(false)

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Advanced': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Expert': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const PatternCard = ({ pattern }: { pattern: Pattern }) => {
    const currentPhotoUrl = showBackPhotos ? pattern.backPhotoUrl : pattern.frontPhotoUrl
    const hasPhoto = Boolean(currentPhotoUrl)

    return (
      <Card 
        className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-card border-border"
        onClick={() => onPatternClick(pattern)}
      >
        <CardContent className="p-0">
          {/* Photo Section */}
          <div className="aspect-[3/4] bg-muted rounded-t-lg overflow-hidden relative">
            {hasPhoto ? (
              <img 
                src={currentPhotoUrl} 
                alt={`${pattern.patternName} - ${showBackPhotos ? 'Back' : 'Front'}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Photo Type Indicator */}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                {showBackPhotos ? 'Back' : 'Front'}
              </Badge>
            </div>

            {/* Dual Photo Indicator */}
            {pattern.frontPhotoUrl && pattern.backPhotoUrl && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs bg-primary/80 text-primary-foreground border-0">
                  2 Photos
                </Badge>
              </div>
            )}
          </div>

          {/* Pattern Info */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">
                {pattern.patternName || 'Untitled Pattern'}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground">
                  {pattern.patternCompany || 'Unknown Company'}
                </p>
                {pattern.patternNumber && (
                  <Badge variant="outline" className="text-xs">
                    #{pattern.patternNumber}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {pattern.difficulty && (
                <Badge className={`text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                  {pattern.difficulty}
                </Badge>
              )}
              {pattern.sizeRange && (
                <span className="text-xs text-muted-foreground">
                  Size {pattern.sizeRange}
                </span>
              )}
            </div>

            {pattern.fabricType && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {pattern.fabricType}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (patterns.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No patterns match your search criteria</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Photo Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Your Pattern Collection
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBackPhotos(!showBackPhotos)}
          className="flex items-center space-x-2"
        >
          {showBackPhotos ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>Show {showBackPhotos ? 'Front' : 'Back'} Photos</span>
        </Button>
      </div>

      {companies.length > 1 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-auto">
            <TabsTrigger value="all">All ({patterns.length})</TabsTrigger>
            {companies.map(company => {
              const count = patterns.filter(p => p.patternCompany === company).length
              return (
                <TabsTrigger key={company} value={company}>
                  {company} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {patterns.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </TabsContent>

          {companies.map(company => (
            <TabsContent key={company} value={company} className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {patterns
                  .filter(p => p.patternCompany === company)
                  .map(pattern => (
                    <PatternCard key={pattern.id} pattern={pattern} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {patterns.map(pattern => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  )
}