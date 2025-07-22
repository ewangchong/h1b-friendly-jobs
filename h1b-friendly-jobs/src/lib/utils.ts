import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalary(min?: number, max?: number, currency = 'USD') {
  if (!min && !max) return 'Salary not specified'
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }
  
  if (min && max) {
    return `${formatNumber(min)} - ${formatNumber(max)}`
  } else if (min) {
    return `${formatNumber(min)}+`
  } else if (max) {
    return `Up to ${formatNumber(max)}`
  }
  
  return 'Salary not specified'
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateString))
}

export function getRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function getH1BSponsorshipBadge(available?: boolean, confidence?: number) {
  if (!available) {
    return { text: 'No H1B Sponsorship', color: 'bg-red-100 text-red-800' }
  }
  
  if (confidence && confidence >= 0.9) {
    return { text: 'H1B Sponsorship Available', color: 'bg-green-100 text-green-800' }
  } else if (confidence && confidence >= 0.7) {
    return { text: 'Likely H1B Sponsorship', color: 'bg-yellow-100 text-yellow-800' }
  } else {
    return { text: 'Possible H1B Sponsorship', color: 'bg-blue-100 text-blue-800' }
  }
}

export function getExperienceLevelColor(level?: string) {
  switch (level?.toLowerCase()) {
    case 'entry':
      return 'bg-green-100 text-green-800'
    case 'mid':
      return 'bg-blue-100 text-blue-800'
    case 'senior':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}