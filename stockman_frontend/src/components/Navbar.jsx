import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'

export default function Navbar() {
  const { user, setToken, setUser } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

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

  const links = [
    { to: '/emplacements', label: 'Emplacements' },
    { to: '/produits', label: 'Produits' },
    { to: '/stats', label: 'Stats' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/emplacements" className="flex items-center gap-2 font-bold text-lg text-[#002f5e] shrink-0">
          <img src="/stock_logo.png" alt="Stock" className="w-7 h-7" />
          Stock
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-gray-600 hover:text-[#f86126]">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">
            Déconnexion
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 min-h-[44px] text-sm text-gray-700 hover:bg-gray-50 hover:text-[#f86126] border-b border-gray-50"
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => { setMenuOpen(false); handleLogout() }}
            className="block w-full text-left px-4 py-3 min-h-[44px] text-sm text-red-500 hover:bg-red-50"
          >
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  )
}
