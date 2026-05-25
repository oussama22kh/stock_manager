import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import EmplacementCard from '../components/EmplacementCard'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 border animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  )
}

export default function Emplacements() {
  const {
    selectedEmplacement, setSelectedEmplacement,
    emplacements, emplacementsLoading, loadEmplacements,
  } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    loadEmplacements()
  }, [loadEmplacements])

  const handleSelect = (emplacement) => {
    setSelectedEmplacement(emplacement)
    navigate('/produits')
  }

  if (emplacementsLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sélectionnez un emplacement</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  const unassignedCount = emplacements.reduce((sum, e) => sum + (e.products_count || 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sélectionnez un emplacement</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {emplacements.map(emp => (
          <EmplacementCard
            key={emp.id}
            emplacement={emp}
            selected={selectedEmplacement}
            onClick={handleSelect}
            productCount={emp.products_count || 0}
          />
        ))}
      </div>
    </div>
  )
}
