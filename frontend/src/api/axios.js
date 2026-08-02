import axios from 'axios'

const isBrowser = typeof window !== 'undefined'
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const defaultBackendUrl = isLocalhost ? 'http://localhost:8000' : 'https://friday-4ev5.onrender.com'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || defaultBackendUrl,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('friday_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const token = localStorage.getItem('friday_token')
    const isDemoToken = token && (token.startsWith('demo') || token.includes('jwt-token'))

    // Only redirect to login if it's a 401 on a real JWT session and not in demo/offline mode
    if (err.response?.status === 401 && !isDemoToken && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('friday_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
