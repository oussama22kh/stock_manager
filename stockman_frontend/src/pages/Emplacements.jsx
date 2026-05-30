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

function WarehouseCard({ warehouse, selected, onClick }) {
  const count = warehouse.emplacements
    ? warehouse.emplacements.reduce((sum, e) => sum + (e.products_count || 0), 0)
    : 0

  return (
    <button
      onClick={() => onClick(warehouse)}
      className={`p-6 rounded-xl border-2 text-left transition-all ${
        selected?.id === warehouse.id
          ? 'border-[#002f5e] bg-[#e6eef7] shadow-md'
          : 'border-gray-200 bg-white hover:border-[#f86126] hover:shadow-sm'
      }`}
    >
      <h3 className="font-semibold text-lg text-gray-800">{warehouse.name}</h3>
      <p className="text-sm text-gray-500 mt-1">
        {count === 0
          ? 'Aucun produit'
          : count === 1
            ? '1 produit'
            : `${count} produits`}
        {' · '}
        {warehouse.emplacements?.length || 0} emplacement{(warehouse.emplacements?.length || 0) !== 1 ? 's' : ''}
      </p>
    </button>
  )
}

export default function Emplacements() {
  const {
    selectedWarehouse, setSelectedWarehouse,
    selectedEmplacement, setSelectedEmplacement,
    warehouses, warehousesLoading, warehousesError,
    loadWarehouses, refreshWarehouses,
    emplacements, emplacementsLoading,
    loadEmplacements,
  } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    loadWarehouses()
  }, [loadWarehouses])

  useEffect(() => {
    if (selectedWarehouse) {
      loadEmplacements(selectedWarehouse.id)
    }
  }, [selectedWarehouse, loadEmplacements])

  const handleWarehouseSelect = (warehouse) => {
    setSelectedWarehouse(warehouse)
  }

  const handleBackToWarehouses = () => {
    setSelectedWarehouse(null)
    setSelectedEmplacement(null)
  }

  const handleEmplacementSelect = (emplacement) => {
    setSelectedEmplacement(emplacement)
    navigate('/produits')
  }

  if (warehousesLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sélectionnez un entrepôt</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (warehousesError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{warehousesError}</p>
        <button
          onClick={refreshWarehouses}
          className="px-6 py-2 bg-[#f86126] text-white rounded-lg font-medium hover:bg-[#e05520] transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!selectedWarehouse) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sélectionnez un entrepôt</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(w => (
            <WarehouseCard
              key={w.id}
              warehouse={w}
              onClick={handleWarehouseSelect}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={handleBackToWarehouses}
          className="text-[#f86126] font-semibold hover:underline"
        >
          ← Entrepôts
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700 font-semibold">{selectedWarehouse.name}</span>
      </div>

      {emplacementsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sélectionnez un emplacement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {emplacements.map(emp => (
              <EmplacementCard
                key={emp.id}
                emplacement={emp}
                selected={selectedEmplacement}
                onClick={handleEmplacementSelect}
                productCount={emp.products_count || 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
