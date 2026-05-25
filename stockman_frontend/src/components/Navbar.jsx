import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'

export default function Navbar() {
  const { user, setToken, setUser } = useApp()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post('/logout')
    } catch {
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    navigate('/')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/emplacements" className="flex items-center gap-2 font-bold text-lg text-[#002f5e]">
            <img src="/stock_logo.png" alt="Stock" className="w-7 h-7" />
            Stock
          </Link>
          <Link to="/emplacements" className="text-sm text-gray-600 hover:text-[#f86126]">Emplacements</Link>
          <Link to="/produits" className="text-sm text-gray-600 hover:text-[#f86126]">Produits</Link>
          <Link to="/stats" className="text-sm text-gray-600 hover:text-[#f86126]">Stats</Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm text-gray-600 hover:text-[#f86126]">Admin</Link>
          )}
        </div>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Déconnexion</button>
      </div>
    </nav>
  )
}
