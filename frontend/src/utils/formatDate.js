import { format, parseISO } from 'date-fns'

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr.split('T')[0]) : dateStr
    return format(d, 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}
