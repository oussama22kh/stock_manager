import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'
import SearchBar from '../components/SearchBar'
import ProductCard from '../components/ProductCard'
import BarcodeScanner from '../components/BarcodeScanner'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-4 border animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

export default function Products() {
  const [filteredProduits, setFilteredProduits] = useState([])
  const [tab, setTab] = useState('scan')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const {
    selectedEmplacement, setSelectedProduit,
    cacheProduct, cacheProducts, findCached,
  } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedEmplacement) {
      navigate('/emplacements')
    }
  }, [selectedEmplacement, navigate])

  useEffect(() => {
    if (tab === 'search') {
      setSearchQuery('')
      setFilteredProduits([])
      setHasSearched(false)
      setError('')
    }
  }, [tab])

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredProduits([])
      setHasSearched(false)
      setSearching(false)
      return
    }
    setSearching(true)
    setError('')
    try {
      const res = await api.get(`/produits?search=${encodeURIComponent(query)}`)
      const results = res.data.filter(p => p.emplacement_id !== selectedEmplacement.id)
      cacheProducts(results)
      setFilteredProduits(results)
      setHasSearched(true)
    } catch {
      setError('Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }, [selectedEmplacement, cacheProducts])

  const handleProductClick = (product) => {
    setSelectedProduit(product)
    navigate('/confirmation')
  }

  const handleScan = async (code) => {
    setScanError('')
    setScanning(true)

    const cached = findCached(code)
    if (cached) {
      setScanning(false)
      if (cached.emplacement_id === selectedEmplacement.id) {
        setScanError('Ce produit est déjà dans cet emplacement')
        return
      }
      setSelectedProduit(cached)
      navigate('/confirmation')
      return
    }

    try {
      const res = await api.get(`/produits/code/${code}`)
      cacheProduct(res.data)
      if (res.data.emplacement_id === selectedEmplacement.id) {
        setScanError('Ce produit est déjà dans cet emplacement')
        setScanning(false)
        return
      }
      setSelectedProduit(res.data)
      navigate('/confirmation')
    } catch {
      setScanError('Produit non trouvé pour ce code-barres')
    } finally {
      setScanning(false)
    }
  }

  if (!selectedEmplacement) return null

  const tabs = [
    { key: 'scan', label: 'Scanner' },
    { key: 'search', label: 'Recherche' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
        <p className="text-sm text-[#002f5e] font-medium">
          Emplacement: {selectedEmplacement.name}
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === t.key ? 'bg-white text-[#f86126] shadow-sm' : 'text-gray-600 hover:text-[#f86126]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {scanError && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
          <span>{scanError}</span>
          <button onClick={() => setScanError('')} className="font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {scanning && (
        <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Recherche du produit...</span>
        </div>
      )}

      {tab === 'scan' && (
        <BarcodeScanner onScan={handleScan} />
      )}

      {tab === 'search' && (
        <>
          <div className="mb-4">
            <SearchBar
              key="search"
              initialValue=""
              onSearch={handleSearch}
              placeholder="Rechercher par nom ou code..."
            />
          </div>

          {searching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : hasSearched && filteredProduits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucun produit trouvé pour cette recherche
            </div>
          ) : filteredProduits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProduits.map(p => (
                <ProductCard key={p.id} product={p} onClick={handleProductClick} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
