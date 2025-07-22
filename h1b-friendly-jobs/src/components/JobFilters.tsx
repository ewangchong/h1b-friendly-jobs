import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './ui/button'

interface SearchFilters {
  query: string
  location: string
  h1bSponsorship: boolean
  experienceLevel: string[]
  industry: string[]
  jobType: string[]
  remoteWork: boolean
  salaryMin: string
  salaryMax: string
}

interface JobFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}

const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior']
const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Media & Entertainment',
  'Automotive',
  'Consulting',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate'
]
const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship']

export default function JobFilters({ filters, onFiltersChange }: JobFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['h1b', 'experience']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleCheckboxChange = (field: keyof SearchFilters, value: string | boolean) => {
    if (Array.isArray(filters[field])) {
      const currentArray = filters[field] as string[]
      const newArray = currentArray.includes(value as string)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value as string]
      
      onFiltersChange({
        ...filters,
        [field]: newArray
      })
    } else {
      onFiltersChange({
        ...filters,
        [field]: value
      })
    }
  }

  const handleSalaryChange = (field: 'salaryMin' | 'salaryMax', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    })
  }

  const FilterSection = ({ 
    title, 
    id, 
    children 
  }: { 
    title: string
    id: string
    children: React.ReactNode 
  }) => {
    const isExpanded = expandedSections.has(id)
    
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <span className="font-medium text-gray-900">{title}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="pb-4">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* H1B Sponsorship */}
      <FilterSection title="H1B Sponsorship" id="h1b">
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.h1bSponsorship}
              onChange={(e) => handleCheckboxChange('h1bSponsorship', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">H1B Sponsorship Available</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.remoteWork}
              onChange={(e) => handleCheckboxChange('remoteWork', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Remote Work</span>
          </label>
        </div>
      </FilterSection>

      {/* Experience Level */}
      <FilterSection title="Experience Level" id="experience">
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <label key={level} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.experienceLevel.includes(level)}
                onChange={(e) => handleCheckboxChange('experienceLevel', level)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{level}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Industry */}
      <FilterSection title="Industry" id="industry">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {INDUSTRIES.map((industry) => (
            <label key={industry} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.industry.includes(industry)}
                onChange={(e) => handleCheckboxChange('industry', industry)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{industry}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Job Type */}
      <FilterSection title="Job Type" id="jobType">
        <div className="space-y-2">
          {JOB_TYPES.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.jobType.includes(type)}
                onChange={(e) => handleCheckboxChange('jobType', type)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">{type.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Salary Range */}
      <FilterSection title="Salary Range" id="salary">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Minimum Salary
            </label>
            <select
              value={filters.salaryMin}
              onChange={(e) => handleSalaryChange('salaryMin', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any</option>
              <option value="50000">$50,000+</option>
              <option value="75000">$75,000+</option>
              <option value="100000">$100,000+</option>
              <option value="125000">$125,000+</option>
              <option value="150000">$150,000+</option>
              <option value="200000">$200,000+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Maximum Salary
            </label>
            <select
              value={filters.salaryMax}
              onChange={(e) => handleSalaryChange('salaryMax', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any</option>
              <option value="100000">$100,000</option>
              <option value="150000">$150,000</option>
              <option value="200000">$200,000</option>
              <option value="250000">$250,000</option>
              <option value="300000">$300,000</option>
              <option value="500000">$500,000+</option>
            </select>
          </div>
        </div>
      </FilterSection>
    </div>
  )
}