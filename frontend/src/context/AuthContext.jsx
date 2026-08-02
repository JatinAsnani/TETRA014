import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('friday_token')
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('friday_token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [])


  const login = async (email, password) => {
    const res = await api.post('/auth/login/json', { email, password })
    localStorage.setItem('friday_token', res.data.access_token)
    setUser(res.data.user)
    return res.data
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    localStorage.setItem('friday_token', res.data.access_token)
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('friday_token')
    setUser(null)
  }

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data)
    setUser(res.data)
    return res.data
  }

  const googleLogin = async (tokenOrData) => {
    const payload = typeof tokenOrData === 'string' ? { token: tokenOrData } : tokenOrData
    const res = await api.post('/auth/google', payload)
    localStorage.setItem('friday_token', res.data.access_token)
    setUser(res.data.user)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, googleLogin }}>
      {children}
    </AuthContext.Provider>
  )

}

export function useAuth() {
  return useContext(AuthContext)
}
