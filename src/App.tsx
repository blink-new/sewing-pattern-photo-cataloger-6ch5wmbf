import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { Pattern } from './types/pattern'
import { PatternGallery } from './components/PatternGallery'
import { AddPatternDialog } from './components/AddPatternDialog'
import { PatternDetailDialog } from './components/PatternDetailDialog'
import { SearchAndFilter } from './components/SearchAndFilter'
import { PatternStats } from './components/PatternStats'
import { QuickActions } from './components/QuickActions'
import { Button } from './components/ui/button'
import { Plus, Scissors } from 'lucide-react'
import { Toaster } from './components/ui/toaster'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [filteredPatterns, setFilteredPatterns] = useState<Pattern[]>([])
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const loadPatterns = useCallback(async () => {
    if (!user?.id) return
    try {
      const data = await blink.db.patterns.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setPatterns(data)
      setFilteredPatterns(data)
    } catch (error) {
      console.error('Failed to load patterns:', error)
    }
  }, [user?.id])

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load patterns when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadPatterns()
    }
  }, [user?.id, loadPatterns])

  const handlePatternAdded = (newPattern: Pattern) => {
    setPatterns(prev => [newPattern, ...prev])
    setFilteredPatterns(prev => [newPattern, ...prev])
    setShowAddDialog(false)
  }

  const handlePatternUpdated = (updatedPattern: Pattern) => {
    setPatterns(prev => prev.map(p => p.id === updatedPattern.id ? updatedPattern : p))
    setFilteredPatterns(prev => prev.map(p => p.id === updatedPattern.id ? updatedPattern : p))
    setSelectedPattern(updatedPattern)
  }

  const handlePatternDeleted = (patternId: string) => {
    setPatterns(prev => prev.filter(p => p.id !== patternId))
    setFilteredPatterns(prev => prev.filter(p => p.id !== patternId))
    setShowDetailDialog(false)
    setSelectedPattern(null)
  }

  const handlePatternClick = (pattern: Pattern) => {
    setSelectedPattern(pattern)
    setShowDetailDialog(true)
  }

  const handleSearch = (searchTerm: string, filters: any) => {
    let filtered = patterns

    // Search by pattern name, company, or number
    if (searchTerm) {
      filtered = filtered.filter(pattern =>
        pattern.patternName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pattern.patternCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pattern.patternNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply filters
    if (filters.company) {
      filtered = filtered.filter(pattern => pattern.patternCompany === filters.company)
    }
    if (filters.difficulty) {
      filtered = filtered.filter(pattern => pattern.difficulty === filters.difficulty)
    }
    if (filters.fabricType) {
      filtered = filtered.filter(pattern => pattern.fabricType === filters.fabricType)
    }

    setFilteredPatterns(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your pattern collection...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Scissors className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Sewing Pattern Cataloger</h1>
          <p className="text-muted-foreground mb-6">
            Organize your sewing patterns with photos and automatic text recognition
          </p>
          <Button onClick={() => blink.auth.login()} size="lg">
            Sign In to Get Started
          </Button>
        </div>
      </div>
    )
  }

  // Get unique companies for organization
  const companies = Array.from(new Set(patterns.map(p => p.patternCompany).filter(Boolean)))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Scissors className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Pattern Cataloger</h1>
                <p className="text-sm text-muted-foreground">
                  {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} collected
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowAddDialog(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Pattern</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => blink.auth.logout()}
                className="text-sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pattern Statistics */}
        <PatternStats patterns={patterns} />

        {/* Quick Actions */}
        <QuickActions patterns={patterns} />

        {/* Search and Filter */}
        <div className="mb-8">
          <SearchAndFilter 
            patterns={patterns}
            onSearch={handleSearch}
          />
        </div>

        {/* Pattern Gallery */}
        <PatternGallery 
          patterns={filteredPatterns}
          companies={companies}
          onPatternClick={handlePatternClick}
        />

        {/* Empty State */}
        {patterns.length === 0 && (
          <div className="text-center py-16">
            <Scissors className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No patterns yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start building your collection by adding your first sewing pattern with photos
            </p>
            <Button onClick={() => setShowAddDialog(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Pattern
            </Button>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddPatternDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onPatternAdded={handlePatternAdded}
      />

      {selectedPattern && (
        <PatternDetailDialog 
          pattern={selectedPattern}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          onPatternUpdated={handlePatternUpdated}
          onPatternDeleted={handlePatternDeleted}
        />
      )}

      <Toaster />
    </div>
  )
}

export default App