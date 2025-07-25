import { useState, useEffect } from 'react'
import { Pattern } from '../types/pattern'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Search, X } from 'lucide-react'

interface SearchAndFilterProps {
  patterns: Pattern[]
  onSearch: (searchTerm: string, filters: FilterState) => void
}

interface FilterState {
  company: string
  difficulty: string
  fabricType: string
}

export function SearchAndFilter({ patterns, onSearch }: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    company: '',
    difficulty: '',
    fabricType: ''
  })

  // Get unique values for filter options
  const companies = Array.from(new Set(patterns.map(p => p.patternCompany).filter(Boolean))).sort()
  const difficulties = Array.from(new Set(patterns.map(p => p.difficulty).filter(Boolean))).sort()
  const fabricTypes = Array.from(new Set(patterns.map(p => p.fabricType).filter(Boolean))).sort()

  // Trigger search when search term or filters change
  useEffect(() => {
    onSearch(searchTerm, filters)
  }, [searchTerm, filters, onSearch])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setFilters({
      company: '',
      difficulty: '',
      fabricType: ''
    })
  }

  const hasActiveFilters = searchTerm || filters.company || filters.difficulty || filters.fabricType

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patterns by name, company, or number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 h-12 text-base"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">Filter by:</span>
        </div>

        {/* Company Filter */}
        {companies.length > 0 && (
          <Select value={filters.company} onValueChange={(value) => handleFilterChange('company', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Difficulty Filter */}
        {difficulties.length > 0 && (
          <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange('difficulty', value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              {difficulties.map(difficulty => (
                <SelectItem key={difficulty} value={difficulty}>
                  {difficulty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Fabric Type Filter */}
        {fabricTypes.length > 0 && (
          <Select value={filters.fabricType} onValueChange={(value) => handleFilterChange('fabricType', value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Fabric Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Fabrics</SelectItem>
              {fabricTypes.map(fabricType => (
                <SelectItem key={fabricType} value={fabricType}>
                  {fabricType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <span>Active filters:</span>
          {searchTerm && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
              Search: "{searchTerm}"
            </span>
          )}
          {filters.company && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
              Company: {filters.company}
            </span>
          )}
          {filters.difficulty && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
              Difficulty: {filters.difficulty}
            </span>
          )}
          {filters.fabricType && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
              Fabric: {filters.fabricType}
            </span>
          )}
        </div>
      )}
    </div>
  )
}