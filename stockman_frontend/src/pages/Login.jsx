import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'

export default function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/login', { login, password })
      localStorage.setItem('token', res.data.token)
      setToken(res.data.token)
      setUser(res.data.user)
      navigate('/emplacements')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/stock_logo.png" alt="Stock" className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-center text-[#002f5e]">Stock</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant</label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 min-h-[44px] bg-[#f86126] text-white rounded-lg hover:bg-[#d94d1a] disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
