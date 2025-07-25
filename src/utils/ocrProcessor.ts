import { blink } from '../blink/client'

export interface OCRResult {
  text: string
  confidence: number
  extractedData: {
    company?: string
    patternNumber?: string
    patternName?: string
    sizeRange?: string
    fabricType?: string
    difficulty?: string
  }
}

// Common sewing pattern companies
const PATTERN_COMPANIES = [
  'Simplicity', 'McCall\'s', 'Butterick', 'Vogue', 'Burda', 'New Look',
  'Kwik Sew', 'Patterns for Pirates', 'Closet Core', 'Cashmerette',
  'True Bias', 'Grainline Studio', 'Deer & Doe', 'Named Clothing',
  'Papercut Patterns', 'Sew House Seven', 'Helen\'s Closet', 'Mood Fabrics'
]

// Common fabric types
const FABRIC_TYPES = [
  'Cotton', 'Linen', 'Silk', 'Wool', 'Polyester', 'Rayon', 'Viscose',
  'Jersey', 'Knit', 'Woven', 'Stretch', 'Denim', 'Chiffon', 'Satin',
  'Velvet', 'Fleece', 'Canvas', 'Twill', 'Crepe', 'Georgette'
]

// Size patterns
const SIZE_PATTERNS = [
  /\b(?:XS|S|M|L|XL|XXL)\b/gi,
  /\b\d{1,2}[-–]\d{1,2}\b/g, // 6-14, 8-16
  /\b\d{1,2}\s*[-–]\s*\d{1,2}\b/g, // 6 - 14
  /\bSize[s]?\s*:?\s*([XS|S|M|L|XL|XXL|\d\-\s]+)/gi
]

// Difficulty patterns
const DIFFICULTY_PATTERNS = [
  /\b(?:Beginner|Easy|Intermediate|Advanced|Expert)\b/gi,
  /\b(?:Level\s*[1-4])\b/gi,
  /\b(?:Skill\s*Level)\s*:?\s*(\w+)/gi
]

export async function processOCR(file: File): Promise<OCRResult> {
  try {
    // Extract text using Blink AI
    const extractedText = await blink.data.extractFromBlob(file)
    
    // Clean up the text
    const cleanText = extractedText.replace(/\s+/g, ' ').trim()
    
    // Extract structured data
    const extractedData = extractStructuredData(cleanText)
    
    // Calculate confidence based on how much data we extracted
    const confidence = calculateConfidence(extractedData, cleanText)
    
    return {
      text: cleanText,
      confidence,
      extractedData
    }
  } catch (error) {
    console.error('OCR processing failed:', error)
    throw new Error('Failed to process image text')
  }
}

function extractStructuredData(text: string) {
  const data: OCRResult['extractedData'] = {}
  
  // Extract company name
  const company = extractCompany(text)
  if (company) data.company = company
  
  // Extract pattern number
  const patternNumber = extractPatternNumber(text)
  if (patternNumber) data.patternNumber = patternNumber
  
  // Extract pattern name
  const patternName = extractPatternName(text, company)
  if (patternName) data.patternName = patternName
  
  // Extract size range
  const sizeRange = extractSizeRange(text)
  if (sizeRange) data.sizeRange = sizeRange
  
  // Extract fabric type
  const fabricType = extractFabricType(text)
  if (fabricType) data.fabricType = fabricType
  
  // Extract difficulty
  const difficulty = extractDifficulty(text)
  if (difficulty) data.difficulty = difficulty
  
  return data
}

function extractCompany(text: string): string | undefined {
  // Look for exact company matches
  for (const company of PATTERN_COMPANIES) {
    const regex = new RegExp(`\\b${company.replace(/'/g, '\\\'').replace(/\s+/g, '\\s+')}\\b`, 'gi')
    if (regex.test(text)) {
      return company
    }
  }
  
  // Look for partial matches
  const words = text.toLowerCase().split(/\s+/)
  for (const company of PATTERN_COMPANIES) {
    const companyWords = company.toLowerCase().split(/\s+/)
    if (companyWords.some(word => words.includes(word))) {
      return company
    }
  }
  
  return undefined
}

function extractPatternNumber(text: string): string | undefined {
  // Look for pattern numbers (typically 3-5 digits)
  const patterns = [
    /\b[A-Z]?\d{4,5}\b/g, // B6789, 1234, 12345
    /\b\d{3,4}[A-Z]?\b/g, // 123A, 1234
    /Pattern\s*#?\s*:?\s*([A-Z]?\d{3,5}[A-Z]?)/gi,
    /No\.?\s*:?\s*([A-Z]?\d{3,5}[A-Z]?)/gi
  ]
  
  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) {
      // Return the first reasonable match
      const match = matches[0].replace(/Pattern\s*#?\s*:?\s*/gi, '').replace(/No\.?\s*:?\s*/gi, '')
      if (match.length >= 3 && match.length <= 6) {
        return match.toUpperCase()
      }
    }
  }
  
  return undefined
}

function extractPatternName(text: string, company?: string): string | undefined {
  // Common pattern name indicators
  const namePatterns = [
    /(?:Pattern|Design)\s*:?\s*([A-Z][^\\n\\r]{10,50})/gi,
    /^([A-Z][^\\n\\r]{10,50})/gm // First line that starts with capital
  ]
  
  for (const pattern of namePatterns) {
    const matches = text.match(pattern)
    if (matches) {
      let name = matches[0].replace(/(?:Pattern|Design)\s*:?\s*/gi, '').trim()
      
      // Clean up the name
      name = name.replace(/\b(?:Misses|Women|Men|Children|Kids|Girls|Boys)\b/gi, '').trim()
      if (company) {
        name = name.replace(new RegExp(`\\b${company}\\b`, 'gi'), '').trim()
      }
      
      if (name.length >= 5 && name.length <= 50) {
        return name
      }
    }
  }
  
  return undefined
}

function extractSizeRange(text: string): string | undefined {
  for (const pattern of SIZE_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      const size = matches[0].replace(/Size[s]?\s*:?\s*/gi, '').trim()
      if (size.length >= 1 && size.length <= 20) {
        return size
      }
    }
  }
  
  return undefined
}

function extractFabricType(text: string): string | undefined {
  const foundFabrics: string[] = []
  
  for (const fabric of FABRIC_TYPES) {
    const regex = new RegExp(`\\b${fabric}\\b`, 'gi')
    if (regex.test(text)) {
      foundFabrics.push(fabric)
    }
  }
  
  // Look for fabric-related keywords
  const fabricKeywords = [
    /Fabric[s]?\s*:?\s*([^\\n\\r]{5,30})/gi,
    /Suggested\s*Fabric[s]?\s*:?\s*([^\\n\\r]{5,30})/gi,
    /Recommended\s*Fabric[s]?\s*:?\s*([^\\n\\r]{5,30})/gi
  ]
  
  for (const pattern of fabricKeywords) {
    const matches = text.match(pattern)
    if (matches) {
      const fabricText = matches[0].replace(/.*?:\s*/gi, '').trim()
      foundFabrics.push(fabricText)
    }
  }
  
  return foundFabrics.length > 0 ? foundFabrics.slice(0, 3).join(', ') : undefined
}

function extractDifficulty(text: string): string | undefined {
  for (const pattern of DIFFICULTY_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      const difficulty = matches[0].replace(/.*?:\s*/gi, '').trim()
      
      // Normalize difficulty levels
      const normalized = normalizeDifficulty(difficulty)
      if (normalized) return normalized
    }
  }
  
  return undefined
}

function normalizeDifficulty(difficulty: string): string | undefined {
  const lower = difficulty.toLowerCase()
  
  if (lower.includes('beginner') || lower.includes('easy') || lower.includes('level 1')) {
    return 'Beginner'
  }
  if (lower.includes('intermediate') || lower.includes('level 2')) {
    return 'Intermediate'
  }
  if (lower.includes('advanced') || lower.includes('level 3')) {
    return 'Advanced'
  }
  if (lower.includes('expert') || lower.includes('level 4')) {
    return 'Expert'
  }
  
  return undefined
}

function calculateConfidence(extractedData: OCRResult['extractedData'], text: string): number {
  let score = 0.3 // Base score for successful text extraction
  
  // Add points for each successfully extracted field
  if (extractedData.company) score += 0.2
  if (extractedData.patternNumber) score += 0.2
  if (extractedData.patternName) score += 0.15
  if (extractedData.sizeRange) score += 0.1
  if (extractedData.fabricType) score += 0.05
  if (extractedData.difficulty) score += 0.05
  
  // Bonus for text quality
  if (text.length > 50) score += 0.05
  if (text.length > 100) score += 0.05
  
  return Math.min(score, 1.0) // Cap at 100%
}