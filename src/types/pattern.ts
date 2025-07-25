export interface Pattern {
  id: string
  userId: string
  patternName?: string
  patternCompany?: string
  patternNumber?: string
  sizeRange?: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  fabricType?: string
  notes?: string
  frontPhotoUrl?: string
  backPhotoUrl?: string
  frontOcrText?: string
  backOcrText?: string
  frontOcrConfidence?: number
  backOcrConfidence?: number
  createdAt: string
  updatedAt: string
}

export interface PatternFormData {
  patternName: string
  patternCompany: string
  patternNumber: string
  sizeRange: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  fabricType: string
  notes: string
  frontPhoto?: File
  backPhoto?: File
}