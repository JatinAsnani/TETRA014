/**
 * Safely extracts a human-readable string message from an API error object.
 * Handles FastAPI validation list details, custom error objects, and strings.
 */
export function getErrorMessage(err, fallback = 'An error occurred') {
  if (!err) return fallback

  const detail = err.response?.data?.detail
  if (detail) {
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail)) {
      return detail.map(e => e.msg || JSON.stringify(e)).join(', ')
    }
    if (typeof detail === 'object') {
      return detail.message || JSON.stringify(detail)
    }
  }

  return err.message || fallback
}
