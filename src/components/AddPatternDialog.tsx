import { useState } from 'react'
import { blink } from '../blink/client'
import { Pattern, PatternFormData } from '../types/pattern'
import { processOCR, OCRResult } from '../utils/ocrProcessor'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent } from './ui/card'
import { Upload, Image as ImageIcon, Loader2, Eye, Sparkles } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface AddPatternDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatternAdded: (pattern: Pattern) => void
}

export function AddPatternDialog({ open, onOpenChange, onPatternAdded }: AddPatternDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState({ front: false, back: false })
  const [formData, setFormData] = useState<PatternFormData>({
    patternName: '',
    patternCompany: '',
    patternNumber: '',
    sizeRange: '',
    difficulty: 'Beginner',
    fabricType: '',
    notes: '',
    frontPhoto: undefined,
    backPhoto: undefined
  })
  const [photoPreview, setPhotoPreview] = useState<{
    front?: string
    back?: string
  }>({})
  const [ocrResults, setOcrResults] = useState<{
    front?: OCRResult
    back?: OCRResult
  }>({})

  const handleInputChange = (field: keyof PatternFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const processOCRForPhoto = async (type: 'front' | 'back', file: File) => {
    setOcrProcessing(prev => ({ ...prev, [type]: true }))
    
    try {
      // Process OCR using enhanced processor
      const ocrResult = await processOCR(file)
      
      // Store OCR results
      setOcrResults(prev => ({
        ...prev,
        [type]: ocrResult
      }))

      // Auto-fill form fields from OCR if they're empty
      const { extractedData } = ocrResult
      
      if (extractedData.company && !formData.patternCompany) {
        handleInputChange('patternCompany', extractedData.company)
      }
      
      if (extractedData.patternNumber && !formData.patternNumber) {
        handleInputChange('patternNumber', extractedData.patternNumber)
      }
      
      if (extractedData.patternName && !formData.patternName) {
        handleInputChange('patternName', extractedData.patternName)
      }
      
      if (extractedData.sizeRange && !formData.sizeRange) {
        handleInputChange('sizeRange', extractedData.sizeRange)
      }
      
      if (extractedData.fabricType && !formData.fabricType) {
        handleInputChange('fabricType', extractedData.fabricType)
      }
      
      if (extractedData.difficulty && !formData.difficulty) {
        handleInputChange('difficulty', extractedData.difficulty)
      }

      toast({
        title: `${type === 'front' ? 'Front' : 'Back'} photo processed`,
        description: `Text extracted with ${Math.round(ocrResult.confidence * 100)}% confidence`
      })

    } catch (error) {
      console.error('OCR processing failed:', error)
      toast({
        title: 'OCR processing failed',
        description: 'You can still add pattern details manually',
        variant: 'destructive'
      })
    } finally {
      setOcrProcessing(prev => ({ ...prev, [type]: false }))
    }
  }

  const handlePhotoUpload = async (type: 'front' | 'back', file: File) => {
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotoPreview(prev => ({
        ...prev,
        [type]: e.target?.result as string
      }))
    }
    reader.readAsDataURL(file)

    // Update form data
    setFormData(prev => ({
      ...prev,
      [`${type}Photo`]: file
    }))

    // Process OCR
    await processOCRForPhoto(type, file)
  }

  const resetForm = () => {
    setFormData({
      patternName: '',
      patternCompany: '',
      patternNumber: '',
      sizeRange: '',
      difficulty: 'Beginner',
      fabricType: '',
      notes: '',
      frontPhoto: undefined,
      backPhoto: undefined
    })
    setPhotoPreview({})
    setOcrResults({})
    setOcrProcessing({ front: false, back: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.frontPhoto && !formData.backPhoto) {
      toast({
        title: 'Photos required',
        description: 'Please upload at least one photo (front or back)',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      // Upload photos to storage
      let frontPhotoUrl = ''
      let backPhotoUrl = ''

      if (formData.frontPhoto) {
        const frontResult = await blink.storage.upload(
          formData.frontPhoto,
          `patterns/${user.id}/front-${Date.now()}.${formData.frontPhoto.name.split('.').pop()}`,
          { upsert: true }
        )
        frontPhotoUrl = frontResult.publicUrl
      }

      if (formData.backPhoto) {
        const backResult = await blink.storage.upload(
          formData.backPhoto,
          `patterns/${user.id}/back-${Date.now()}.${formData.backPhoto.name.split('.').pop()}`,
          { upsert: true }
        )
        backPhotoUrl = backResult.publicUrl
      }

      // Create pattern record
      const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newPattern = await blink.db.patterns.create({
        id: patternId,
        userId: user.id,
        patternName: formData.patternName || null,
        patternCompany: formData.patternCompany || null,
        patternNumber: formData.patternNumber || null,
        sizeRange: formData.sizeRange || null,
        difficulty: formData.difficulty,
        fabricType: formData.fabricType || null,
        notes: formData.notes || null,
        frontPhotoUrl: frontPhotoUrl || null,
        backPhotoUrl: backPhotoUrl || null,
        frontOcrText: ocrResults.front?.text || null,
        backOcrText: ocrResults.back?.text || null,
        frontOcrConfidence: ocrResults.front?.confidence || null,
        backOcrConfidence: ocrResults.back?.confidence || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      onPatternAdded(newPattern)
      resetForm()
      toast({
        title: 'Pattern added successfully!',
        description: 'Your pattern has been added to your collection'
      })

    } catch (error) {
      console.error('Failed to add pattern:', error)
      toast({
        title: 'Failed to add pattern',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const PhotoUploadCard = ({ type, title }: { type: 'front' | 'back'; title: string }) => {
    const photo = type === 'front' ? formData.frontPhoto : formData.backPhoto
    const preview = photoPreview[type]
    const processing = ocrProcessing[type]
    const ocrResult = ocrResults[type]

    return (
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <h3 className="font-semibold text-foreground">{title}</h3>
              {processing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {ocrResult && <Sparkles className="h-4 w-4 text-primary" />}
            </div>

            {preview ? (
              <div className="space-y-3">
                <div className="relative">
                  <img 
                    src={preview} 
                    alt={`${title} preview`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {processing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-white text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Processing OCR...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {ocrResult && (
                  <div className="text-left bg-muted p-3 rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground">
                      OCR Results (confidence: {Math.round(ocrResult.confidence * 100)}%):
                    </p>
                    
                    {/* Show extracted structured data */}
                    {Object.keys(ocrResult.extractedData).length > 0 && (
                      <div className="space-y-1">
                        {ocrResult.extractedData.company && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-primary">Company:</span>
                            <span className="text-xs text-foreground">{ocrResult.extractedData.company}</span>
                          </div>
                        )}
                        {ocrResult.extractedData.patternNumber && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-primary">Number:</span>
                            <span className="text-xs text-foreground">{ocrResult.extractedData.patternNumber}</span>
                          </div>
                        )}
                        {ocrResult.extractedData.patternName && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-primary">Name:</span>
                            <span className="text-xs text-foreground line-clamp-1">{ocrResult.extractedData.patternName}</span>
                          </div>
                        )}
                        {ocrResult.extractedData.sizeRange && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-primary">Size:</span>
                            <span className="text-xs text-foreground">{ocrResult.extractedData.sizeRange}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show raw text in smaller font */}
                    <details className="text-xs">
                      <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                        Raw extracted text
                      </summary>
                      <p className="font-mono text-muted-foreground mt-1 line-clamp-3">
                        {ocrResult.text}
                      </p>
                    </details>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handlePhotoUpload(type, file)
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              </div>
            ) : (
              <div 
                className="cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handlePhotoUpload(type, file)
                  }
                  input.click()
                }}
              >
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload {title.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG up to 10MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Add New Pattern</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PhotoUploadCard type="front" title="Front Envelope" />
            <PhotoUploadCard type="back" title="Back Envelope" />
          </div>

          {/* Pattern Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patternName">Pattern Name</Label>
              <Input
                id="patternName"
                value={formData.patternName}
                onChange={(e) => handleInputChange('patternName', e.target.value)}
                placeholder="e.g., Wrap Dress"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patternCompany">Company</Label>
              <Input
                id="patternCompany"
                value={formData.patternCompany}
                onChange={(e) => handleInputChange('patternCompany', e.target.value)}
                placeholder="e.g., Simplicity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patternNumber">Pattern Number</Label>
              <Input
                id="patternNumber"
                value={formData.patternNumber}
                onChange={(e) => handleInputChange('patternNumber', e.target.value)}
                placeholder="e.g., 8234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sizeRange">Size Range</Label>
              <Input
                id="sizeRange"
                value={formData.sizeRange}
                onChange={(e) => handleInputChange('sizeRange', e.target.value)}
                placeholder="e.g., 6-14"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabricType">Fabric Type</Label>
              <Input
                id="fabricType"
                value={formData.fabricType}
                onChange={(e) => handleInputChange('fabricType', e.target.value)}
                placeholder="e.g., Cotton, Knit, Woven"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about this pattern..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Pattern...
                </>
              ) : (
                'Add Pattern'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}