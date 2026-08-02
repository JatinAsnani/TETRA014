import axios from 'axios'

const defaultBackendUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://friday-4ev5.onrender.com'

const api = axios.create({
  baseURL: defaultBackendUrl,
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
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('friday_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
