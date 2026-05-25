import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
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
  const [selectedEmplacement, setSelectedEmplacement] = useState(null)
  const [selectedProduit, setSelectedProduit] = useState(null)

  const productsCache = useRef(new Map())

  const [emplacements, setEmplacements] = useState([])
  const [emplacementsLoading, setEmplacementsLoading] = useState(false)
  const emplacementsLoaded = useRef(false)

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

  const loadEmplacements = useCallback(async () => {
    if (emplacementsLoaded.current) return
    setEmplacementsLoading(true)
    try {
      const res = await api.get('/emplacements')
      setEmplacements(res.data)
      emplacementsLoaded.current = true
    } catch {
      // silently fail, component will handle
    } finally {
      setEmplacementsLoading(false)
    }
  }, [])

  const refreshEmplacements = useCallback(async () => {
    emplacementsLoaded.current = false
    await loadEmplacements()
  }, [loadEmplacements])

  return (
    <AppContext.Provider value={{
      user, setUser,
      token, setToken,
      selectedEmplacement, setSelectedEmplacement,
      selectedProduit, setSelectedProduit,
      cacheProduct, cacheProducts, findCached,
      emplacements, emplacementsLoading, loadEmplacements, refreshEmplacements,
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
