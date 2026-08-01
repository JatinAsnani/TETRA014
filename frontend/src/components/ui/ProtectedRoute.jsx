import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSkeleton from './LoadingSkeleton'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSkeleton rows={6} />
  if (!user) return <Navigate to="/login" replace />
  return children
}
