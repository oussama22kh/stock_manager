import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'
import EmplacementCard from '../components/EmplacementCard'

export default function Emplacements() {
  const [emplacements, setEmplacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { selectedEmplacement, setSelectedEmplacement } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/emplacements')
      .then(res => setEmplacements(res.data))
      .catch(() => setError('Erreur lors du chargement des emplacements'))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (emplacement) => {
    setSelectedEmplacement(emplacement)
    navigate('/produits')
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {emplacements.map(emp => (
          <EmplacementCard
            key={emp.id}
            emplacement={emp}
            selected={selectedEmplacement}
            onClick={handleSelect}
          />
        ))}
      </div>
    </div>
  )
}
