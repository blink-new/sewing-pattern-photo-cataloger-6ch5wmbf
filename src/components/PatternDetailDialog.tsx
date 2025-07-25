import { useState } from 'react'
import { blink } from '../blink/client'
import { Pattern } from '../types/pattern'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Edit, Trash2, Image as ImageIcon, Sparkles, Eye, Calendar } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface PatternDetailDialogProps {
  pattern: Pattern
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatternUpdated: (pattern: Pattern) => void
  onPatternDeleted: (patternId: string) => void
}

export function PatternDetailDialog({ 
  pattern, 
  open, 
  onOpenChange, 
  onPatternUpdated, 
  onPatternDeleted 
}: PatternDetailDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Advanced': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Expert': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      // Delete from database
      await blink.db.patterns.delete(pattern.id)

      // Delete photos from storage
      if (pattern.frontPhotoUrl) {
        const frontPath = pattern.frontPhotoUrl.split('/').pop()
        if (frontPath) {
          await blink.storage.remove(frontPath)
        }
      }
      if (pattern.backPhotoUrl) {
        const backPath = pattern.backPhotoUrl.split('/').pop()
        if (backPath) {
          await blink.storage.remove(backPath)
        }
      }

      onPatternDeleted(pattern.id)
      toast({
        title: 'Pattern deleted',
        description: 'The pattern has been removed from your collection'
      })

    } catch (error) {
      console.error('Failed to delete pattern:', error)
      toast({
        title: 'Failed to delete pattern',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const PhotoSection = ({ 
    title, 
    photoUrl, 
    ocrText, 
    ocrConfidence 
  }: { 
    title: string
    photoUrl?: string
    ocrText?: string
    ocrConfidence?: number
  }) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center space-x-2">
        <Eye className="h-4 w-4" />
        <span>{title}</span>
      </h3>
      
      {photoUrl ? (
        <div className="space-y-3">
          <img 
            src={photoUrl} 
            alt={title}
            className="w-full max-w-md mx-auto rounded-lg shadow-md"
          />
          
          {ocrText && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Extracted Text
                  </span>
                  {ocrConfidence && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(ocrConfidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-mono text-muted-foreground bg-background p-3 rounded border">
                  {ocrText}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No {title.toLowerCase()} photo</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {pattern.patternName || 'Untitled Pattern'}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Pattern</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this pattern? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={loading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pattern Info Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-semibold text-foreground">
                    {pattern.patternCompany || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pattern Number</p>
                  <p className="font-semibold text-foreground">
                    {pattern.patternNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size Range</p>
                  <p className="font-semibold text-foreground">
                    {pattern.sizeRange || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Difficulty</p>
                  {pattern.difficulty ? (
                    <Badge className={getDifficultyColor(pattern.difficulty)}>
                      {pattern.difficulty}
                    </Badge>
                  ) : (
                    <p className="font-semibold text-foreground">N/A</p>
                  )}
                </div>
              </div>

              {pattern.fabricType && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Fabric Type</p>
                  <p className="font-semibold text-foreground">{pattern.fabricType}</p>
                </div>
              )}

              {pattern.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-foreground mt-1">{pattern.notes}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Added on {formatDate(pattern.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Photos Section */}
          <Tabs defaultValue="front" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="front" className="flex items-center space-x-2">
                <span>Front Envelope</span>
                {pattern.frontPhotoUrl && <Badge variant="secondary" className="text-xs">✓</Badge>}
              </TabsTrigger>
              <TabsTrigger value="back" className="flex items-center space-x-2">
                <span>Back Envelope</span>
                {pattern.backPhotoUrl && <Badge variant="secondary" className="text-xs">✓</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="front" className="mt-6">
              <PhotoSection
                title="Front Envelope"
                photoUrl={pattern.frontPhotoUrl}
                ocrText={pattern.frontOcrText}
                ocrConfidence={pattern.frontOcrConfidence}
              />
            </TabsContent>

            <TabsContent value="back" className="mt-6">
              <PhotoSection
                title="Back Envelope"
                photoUrl={pattern.backPhotoUrl}
                ocrText={pattern.backOcrText}
                ocrConfidence={pattern.backOcrConfidence}
              />
            </TabsContent>
          </Tabs>

          {/* Both Photos Side by Side (Desktop) */}
          <div className="hidden lg:block">
            <h3 className="text-lg font-semibold text-foreground mb-4">Both Envelopes</h3>
            <div className="grid grid-cols-2 gap-6">
              <PhotoSection
                title="Front Envelope"
                photoUrl={pattern.frontPhotoUrl}
                ocrText={pattern.frontOcrText}
                ocrConfidence={pattern.frontOcrConfidence}
              />
              <PhotoSection
                title="Back Envelope"
                photoUrl={pattern.backPhotoUrl}
                ocrText={pattern.backOcrText}
                ocrConfidence={pattern.backOcrConfidence}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}