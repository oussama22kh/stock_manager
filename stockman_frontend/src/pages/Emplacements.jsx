import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'
import EmplacementCard from '../components/EmplacementCard'

export default function Emplacements() {
  const [emplacements, setEmplacements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { selectedEmplacement, setSelectedEmplacement } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/emplacements'),
      api.get('/produits'),
    ])
      .then(([emplRes, prodRes]) => {
        setEmplacements(emplRes.data)
        setProducts(prodRes.data)
      })
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (emplacement) => {
    setSelectedEmplacement(emplacement)
    navigate('/produits')
  }

  const unassignedCount = products.filter(p => p.emplacement_id === null).length

  const getEmplacementProductCount = (emplacementId) => {
    return products.filter(p => p.emplacement_id === emplacementId).length
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Chargement...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sélectionnez un emplacement</h1>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {unassignedCount > 0 && (
        <div className="mb-6 p-4 bg-[#fef5e0] border border-[#fbb945] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fbb945] rounded-full flex items-center justify-center text-white font-bold text-lg">
              {unassignedCount}
            </div>
            <div>
              <p className="font-medium text-[#1a2332]">
                {unassignedCount === 1 ? 'Produit sans emplacement' : 'Produits sans emplacement'}
              </p>
              <p className="text-sm text-[#5a6575]">
                Sélectionnez un emplacement pour les assigner
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {emplacements.map(emp => (
          <EmplacementCard
            key={emp.id}
            emplacement={emp}
            selected={selectedEmplacement}
            onClick={handleSelect}
            productCount={getEmplacementProductCount(emp.id)}
          />
        ))}
      </div>
    </div>
  )
}
