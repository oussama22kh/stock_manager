import { createContext, useContext, useState, useRef, useCallback } from 'react'
import api from '../services/api'

const AppContext = createContext()

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AppProvider({ children }) {
  const [user, setUserState] = useState(getStoredUser)
  const [token, setTokenState] = useState(localStorage.getItem('token'))
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [selectedEmplacement, setSelectedEmplacement] = useState(null)
  const [selectedProduit, setSelectedProduit] = useState(null)

  const productsCache = useRef(new Map())

  const [warehouses, setWarehouses] = useState([])
  const [warehousesLoading, setWarehousesLoading] = useState(false)
  const [warehousesError, setWarehousesError] = useState(null)
  const warehousesLoaded = useRef(false)

  const [emplacements, setEmplacements] = useState([])
  const [emplacementsLoading, setEmplacementsLoading] = useState(false)

  const setToken = (value) => {
    setTokenState(value)
    if (value) {
      localStorage.setItem('token', value)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUser = (value) => {
    setUserState(value)
    if (value) {
      localStorage.setItem('user', JSON.stringify(value))
    } else {
      localStorage.removeItem('user')
    }
  }

  const cacheProduct = useCallback((product) => {
    if (product?.code_produit) {
      productsCache.current.set(product.code_produit, product)
    }
  }, [])

  const cacheProducts = useCallback((list) => {
    for (const p of list) {
      if (p?.code_produit) {
        productsCache.current.set(p.code_produit, p)
      }
    }
  }, [])

  const findCached = useCallback((barcode) => {
    return productsCache.current.get(barcode) || null
  }, [])

  const loadWarehouses = useCallback(async () => {
    if (warehousesLoaded.current) return
    setWarehousesLoading(true)
    setWarehousesError(null)
    try {
      const res = await api.get('/emplacements')
      setWarehouses(res.data)
      warehousesLoaded.current = true
    } catch (err) {
      setWarehousesError(err.response?.data?.message || err.message || 'Erreur lors du chargement')
    } finally {
      setWarehousesLoading(false)
    }
  }, [])

  const refreshWarehouses = useCallback(async () => {
    warehousesLoaded.current = false
    await loadWarehouses()
  }, [loadWarehouses])

  const loadEmplacements = useCallback(async (warehouseId) => {
    setEmplacementsLoading(true)
    setEmplacements([])
    try {
      const res = await api.get(`/warehouses/${warehouseId}/emplacements`)
      setEmplacements(res.data)
    } catch {
      setEmplacements([])
    } finally {
      setEmplacementsLoading(false)
    }
  }, [])

  return (
    <AppContext.Provider value={{
      user, setUser,
      token, setToken,
      selectedWarehouse, setSelectedWarehouse,
      selectedEmplacement, setSelectedEmplacement,
      selectedProduit, setSelectedProduit,
      cacheProduct, cacheProducts, findCached,
      warehouses, warehousesLoading, warehousesError, loadWarehouses, refreshWarehouses,
      emplacements, emplacementsLoading, loadEmplacements,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
