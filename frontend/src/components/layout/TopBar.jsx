import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function TopBar({ title, onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-1 text-gray-500 hover:text-gray-900 text-2xl font-bold"
          aria-label="Open menu"
        >
          ☰
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 max-w-[120px] md:max-w-none truncate">{user?.business_name || user?.name}</span>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="text-sm text-gray-500 hover:text-red-600 shrink-0 font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
