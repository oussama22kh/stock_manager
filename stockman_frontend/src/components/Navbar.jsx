import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'

export default function Navbar() {
  const { setToken, setUser } = useApp()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } catch {
    }
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/emplacements" className="font-bold text-lg text-indigo-600">Stockman</Link>
          <Link to="/emplacements" className="text-sm text-gray-600 hover:text-indigo-600">Emplacements</Link>
          <Link to="/produits" className="text-sm text-gray-600 hover:text-indigo-600">Produits</Link>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Déconnexion</button>
      </div>
    </nav>
  )
}
