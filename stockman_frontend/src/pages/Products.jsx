import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'
import SearchBar from '../components/SearchBar'
import ProductCard from '../components/ProductCard'
import BarcodeScanner from '../components/BarcodeScanner'

export default function Products() {
  const [produits, setProduits] = useState([])
  const [filteredProduits, setFilteredProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const { selectedEmplacement, setSelectedProduit } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedEmplacement) {
      navigate('/emplacements')
      return
    }
    api.get('/produits')
      .then(res => {
        setProduits(res.data)
        setFilteredProduits(res.data)
      })
      .catch(() => setError('Erreur lors du chargement des produits'))
      .finally(() => setLoading(false))
  }, [selectedEmplacement, navigate])

  useEffect(() => {
    if (tab === 'list') {
      setFilteredProduits(produits)
      setSearchQuery('')
      setError('')
    }
  }, [tab, produits])

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredProduits(produits)
      setSearching(false)
      return
    }
    setSearching(true)
    setError('')
    try {
      const res = await api.get(`/produits?search=${encodeURIComponent(query)}`)
      setFilteredProduits(res.data)
    } catch {
      setError('Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }, [produits])

  const handleProductClick = (product) => {
    setSelectedProduit(product)
    navigate('/confirmation')
  }

  const handleScan = async (code) => {
    setError('')
    try {
      const res = await api.get(`/produits/code/${code}`)
      setSelectedProduit(res.data)
      navigate('/confirmation')
    } catch {
      setError('Produit non trouvé')
    }
  }

  if (!selectedEmplacement) return null

  const tabs = [
    { key: 'list', label: 'Liste' },
    { key: 'search', label: 'Recherche' },
    { key: 'scan', label: 'Scanner' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
        <p className="text-sm text-indigo-600 font-medium">
          Emplacement: {selectedEmplacement.name}
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-indigo-600'
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

      {tab === 'scan' && (
        <BarcodeScanner onScan={handleScan} />
      )}

      {tab === 'search' && (
        <div className="mb-4">
          <SearchBar
            key={tab}
            initialValue={searchQuery}
            onSearch={handleSearch}
            placeholder="Rechercher par nom ou code..."
          />
        </div>
      )}

      {(tab === 'list' || tab === 'search') && (
        <>
          {loading || searching ? (
            <div className="text-center py-12 text-gray-500">
              {loading ? 'Chargement...' : 'Recherche...'}
            </div>
          ) : filteredProduits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucun produit trouvé</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProduits.map(p => (
                <ProductCard key={p.id} product={p} onClick={handleProductClick} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
