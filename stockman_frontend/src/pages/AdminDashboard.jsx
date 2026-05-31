import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import api from '../services/api'
import SearchBar from '../components/SearchBar'
import ConfirmDialog from '../components/ConfirmDialog'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectAllMatching, setSelectAllMatching] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} })
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkEditFormData, setBulkEditFormData] = useState({})
  const [bulkEditLoading, setBulkEditLoading] = useState(false)
  const [userWarehouseIds, setUserWarehouseIds] = useState([])
  const [allWarehouses, setAllWarehouses] = useState([])

  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({})
  const [warehouses, setWarehouses] = useState([])

  const tabConfig = {
    users: {
      label: 'Utilisateurs',
      endpoint: '/admin/users',
      fields: [
        { key: 'username', label: 'Nom d\'utilisateur', type: 'text', required: true },
        { key: 'password', label: 'Mot de passe', type: 'password', required: (item) => !item },
        { key: 'role', label: 'Rôle', type: 'select', options: [{ value: 'agent', label: 'Agent' }, { value: 'admin', label: 'Admin' }], required: true },
      ],
      columns: [
        { key: 'username', label: 'Utilisateur' },
        { key: 'role', label: 'Rôle' },
      ],
      importExport: true,
      importEndpoint: '/admin/users/import',
      exportEndpoint: '/admin/users/export',
      templateHeaders: 'username,password,role',
      templateExample: 'agent1,password123,agent',
      bulkFields: [
        { key: 'role', label: 'Rôle', type: 'select', options: [{ value: '', label: '— Inchangé —' }, { value: 'agent', label: 'Agent' }, { value: 'admin', label: 'Admin' }] },
      ],
    },
    products: {
      label: 'Produits',
      endpoint: '/admin/products',
      fields: [
        { key: 'name', label: 'Nom', type: 'text', required: true },
        { key: 'barcode', label: 'Code-barres', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: false },
      ],
      columns: [
        { key: 'name', label: 'Nom' },
        { key: 'barcode', label: 'Code-barres' },
        { key: 'description', label: 'Description' },
      ],
      importExport: true,
      importEndpoint: '/admin/products/import',
      exportEndpoint: '/admin/products/export',
      templateHeaders: 'name,barcode,description',
      templateExample: 'Produit A,123456,Description du produit',
      bulkFields: [
        { key: 'description', label: 'Description', type: 'textarea' },
      ],
    },
    warehouses: {
      label: 'Entrepôts',
      endpoint: '/admin/warehouses',
      fields: [
        { key: 'name', label: 'Nom', type: 'text', required: true },
        { key: 'location', label: 'Localisation', type: 'text', required: false },
      ],
      columns: [
        { key: 'name', label: 'Nom' },
        { key: 'location', label: 'Localisation' },
        { key: 'emplacements_count', label: 'Emplacements' },
      ],
      importExport: true,
      importEndpoint: '/admin/warehouses/import',
      exportEndpoint: '/admin/warehouses/export',
      templateHeaders: 'name,location',
      templateExample: 'Entrepôt A,Bâtiment principal',
      bulkFields: [
        { key: 'location', label: 'Localisation', type: 'text' },
      ],
    },
    emplacements: {
      label: 'Emplacements',
      endpoint: '/admin/emplacements',
      fields: [
        { key: 'warehouse_id', label: 'Entrepôt', type: 'dynamicSelect', required: true },
        { key: 'name', label: 'Nom', type: 'text', required: true },
        { key: 'location', label: 'Localisation', type: 'text', required: false },
      ],
      columns: [
        { key: 'warehouse_name', label: 'Entrepôt' },
        { key: 'name', label: 'Nom' },
        { key: 'location', label: 'Localisation' },
        { key: 'products_count', label: 'Produits' },
      ],
      importExport: true,
      importEndpoint: '/admin/emplacements/import',
      exportEndpoint: '/admin/emplacements/export',
      templateHeaders: 'warehouse_name,name,location',
      templateExample: 'Entrepôt A,Allée 1 - Étagère A,Bâtiment principal',
      bulkFields: [
        { key: 'warehouse_id', label: 'Entrepôt', type: 'dynamicSelect' },
        { key: 'location', label: 'Localisation', type: 'text' },
      ],
    },
  }

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page })
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }
      const res = await api.get(`${tabConfig[activeTab].endpoint}?${params}`)
      const { data, current_page, last_page, total } = res.data
      if (activeTab === 'emplacements') {
        setItems(data.map(e => ({
          ...e,
          products_count: e.products?.length || 0,
          warehouse_name: e.warehouse?.name || '—',
        })))
      } else if (activeTab === 'warehouses') {
        setItems(data.map(w => ({
          ...w,
          emplacements_count: w.emplacements?.length || 0,
        })))
      } else {
        setItems(data)
      }
      setPagination({ currentPage: current_page, lastPage: last_page, total })
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery])

  useEffect(() => {
    fetchItems(1)
  }, [fetchItems])

  useEffect(() => {
    if (activeTab === 'emplacements' || activeTab === 'users') {
      api.get('/admin/warehouses?per_page=100')
        .then(res => {
          const list = res.data.data || res.data
          setAllWarehouses(list)
          if (activeTab === 'emplacements') setWarehouses(list)
        })
        .catch(() => { setAllWarehouses([]); setWarehouses([]) })
    }
  }, [activeTab])

  const fetchUserWarehouses = useCallback(async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}/warehouses`)
      setUserWarehouseIds(res.data || [])
    } catch {
      setUserWarehouseIds([])
    }
  }, [])

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const resetForm = () => {
    const defaults = {}
    tabConfig[activeTab].fields.forEach(f => {
      if (f.type === 'dynamicSelect') {
        defaults[f.key] = ''
      } else {
        defaults[f.key] = f.type === 'select' ? (f.options[0]?.value || '') : ''
      }
    })
    setFormData(defaults)
    setEditingItem(null)
    setError('')
  }

  const openAddModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    const data = {}
    tabConfig[activeTab].fields.forEach(f => {
      data[f.key] = item[f.key] || ''
    })
    setFormData(data)
    setEditingItem(item)
    setModalOpen(true)
    setError('')
    setUserWarehouseIds([])
    if (activeTab === 'users') {
      fetchUserWarehouses(item.id)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const config = tabConfig[activeTab]
    const payload = { ...formData }

    // Remove empty password on edit
    if (editingItem && activeTab === 'users' && !payload.password) {
      delete payload.password
    }

    try {
      let userId
      if (editingItem) {
        await api.put(`${config.endpoint}/${editingItem.id}`, payload)
        userId = editingItem.id
        setSuccess(`${config.label} mis à jour avec succès`)
      } else {
        const res = await api.post(config.endpoint, payload)
        userId = res.data.id
        setSuccess(`${config.label} créé avec succès`)
      }

      if (activeTab === 'users' && userId) {
        await api.put(`/admin/users/${userId}/warehouses`, { warehouse_ids: userWarehouseIds })
      }

      setModalOpen(false)
      fetchItems()
    } catch (err) {
      const msg = err.response?.data?.message
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat().join(', ')
        setError(errors)
      } else {
        setError(msg || 'Une erreur est survenue')
      }
    }
  }

  const handleExport = async () => {
    setError('')
    try {
      const config = tabConfig[activeTab]
      const res = await api.get(config.exportEndpoint, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${activeTab}_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setSuccess('Export téléchargé avec succès')
    } catch (err) {
      setError('Erreur lors de l\'export')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setError('')
    setSuccess('')

    const config = tabConfig[activeTab]
    const formDataFile = new FormData()
    formDataFile.append('file', file)

    try {
      const res = await api.post(config.importEndpoint, formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess(res.data.message)
      if (res.data.errors?.length > 0) {
        setError(`Erreurs: ${res.data.errors.join('; ')}`)
      }
      fetchItems()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'import')
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectAllMatching(false)
  }, [])

  const allPageSelected = useMemo(() => {
    if (items.length === 0) return false
    return items.every(item => selectedIds.has(item.id))
  }, [items, selectedIds])

  const toggleSelectAllPage = useCallback(() => {
    if (allPageSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(item => item.id)))
    }
    setSelectAllMatching(false)
  }, [allPageSelected, items])

  const toggleSelectOne = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setSelectAllMatching(false)
  }, [])

  const toggleSelectAllMatching = useCallback(() => {
    setSelectAllMatching(true)
    setSelectedIds(new Set())
  }, [])

  const selectionCount = selectAllMatching ? pagination.total : selectedIds.size

  const handleBulkDelete = useCallback(() => {
    const config = tabConfig[activeTab]
    const label = config.label.toLowerCase()
    const payload = selectAllMatching
      ? { all_matching: true, search: searchQuery.trim() }
      : { ids: Array.from(selectedIds) }

    setConfirmDialog({
      open: true,
      title: 'Suppression multiple',
      message: `Supprimer ${selectionCount} ${label} ? Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }))
        setBulkLoading(true)
        setError('')
        setSuccess('')
        try {
          const res = await api.delete(`${config.endpoint}/bulk`, { data: payload })
          setSuccess(`${res.data.deleted} ${label} supprimé(s)`)
          clearSelection()
          fetchItems()
        } catch (err) {
          setError(err.response?.data?.message || 'Erreur lors de la suppression')
        } finally {
          setBulkLoading(false)
        }
      },
    })
  }, [activeTab, selectAllMatching, selectedIds, searchQuery, selectionCount, clearSelection, fetchItems])

  const handleSingleDelete = useCallback((item) => {
    const config = tabConfig[activeTab]
    const label = config.label.toLowerCase()
    const name = item.name || item.username || item.barcode || `#${item.id}`

    setConfirmDialog({
      open: true,
      title: 'Confirmer la suppression',
      message: `Supprimer « ${name} » ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }))
        setError('')
        setSuccess('')
        try {
          await api.delete(`${config.endpoint}/${item.id}`)
          setSuccess('Supprimé avec succès')
          clearSelection()
          fetchItems()
        } catch (err) {
          setError(err.response?.data?.message || 'Erreur de suppression')
        }
      },
    })
  }, [activeTab, clearSelection, fetchItems])

  const openBulkEditModal = useCallback(() => {
    const defaults = {}
    const config = tabConfig[activeTab]
    if (config.bulkFields) {
      config.bulkFields.forEach(f => {
        defaults[f.key] = ''
      })
    }
    setBulkEditFormData(defaults)
    setBulkEditOpen(true)
    setError('')
  }, [activeTab])

  const handleBulkEditSubmit = useCallback(async (e) => {
    if (e) e.preventDefault()
    setBulkEditLoading(true)
    setError('')
    setSuccess('')

    const config = tabConfig[activeTab]
    const fields = {}
    Object.entries(bulkEditFormData).forEach(([k, v]) => {
      if (v !== '' && v !== undefined) fields[k] = v
    })

    const payload = selectAllMatching
      ? { all_matching: true, search: searchQuery.trim(), fields }
      : { ids: Array.from(selectedIds), fields }

    try {
      const res = await api.patch(`${config.endpoint}/bulk`, payload)
      setBulkEditOpen(false)
      setSuccess(`${res.data.updated} ${config.label.toLowerCase()} mis à jour`)
      clearSelection()
      fetchItems()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification')
    } finally {
      setBulkEditLoading(false)
    }
  }, [activeTab, bulkEditFormData, selectAllMatching, selectedIds, searchQuery, clearSelection, fetchItems])

  const downloadTemplate = () => {
    const config = tabConfig[activeTab]
    const csvContent = `${config.templateHeaders}\n${config.templateExample}\n`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${activeTab}_template.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const currentConfig = tabConfig[activeTab]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {currentConfig.importExport && (
            <>
              <button
                onClick={downloadTemplate}
                className="px-3 py-2 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                title="Télécharger le modèle CSV"
              >
                Modèle CSV
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="px-3 py-2 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
              >
                {importLoading ? 'Import...' : 'Importer CSV'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={handleExport}
                className="px-3 py-2 min-h-[44px] bg-[#f86126] text-white rounded-lg hover:bg-[#d94d1a] text-sm font-medium"
              >
                Exporter CSV
              </button>
            </>
          )}
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#f86126] text-white rounded-lg hover:bg-[#d94d1a] text-sm font-medium"
          >
            + Ajouter
          </button>
        </div>
      </div>
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
        {Object.entries(tabConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSearchQuery(''); setError(''); setSuccess(''); clearSelection() }}
            className={`px-4 py-2 min-h-[44px] text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === key
                ? 'bg-[#e6eef7] text-[#002f5e] border-b-2 border-[#f86126]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          placeholder={`Rechercher dans ${tabConfig[activeTab].label.toLowerCase()}...`}
          initialValue=""
          key={activeTab}
        />
      </div>

      {!loading && selectionCount > 0 && (
        <div className="mb-4 p-3 bg-[#e6eef7] border border-[#002f5e] rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm text-[#002f5e] font-medium">
            {selectAllMatching
              ? `${pagination.total} résultat(s) correspondant(s) sélectionné(s)`
              : `${selectedIds.size} sélectionné(s) sur cette page`
            }
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {!selectAllMatching && (
              <button
                onClick={toggleSelectAllMatching}
                className="text-sm text-[#f86126] hover:underline font-medium"
              >
                Sélectionner les {pagination.total} résultats correspondants
              </button>
            )}
            <button onClick={clearSelection} className="text-sm text-gray-500 hover:underline">
              Effacer la sélection
            </button>
            <button
              onClick={openBulkEditModal}
              className="px-3 py-1.5 bg-[#002f5e] text-white rounded-lg hover:bg-[#001a33] text-sm font-medium"
            >
              Modifier la sélection ({selectionCount})
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
            >
              {bulkLoading ? 'Suppression...' : `Supprimer la sélection (${selectionCount})`}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun élément</div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAllPage}
                        checked={allPageSelected}
                        className="w-4 h-4 rounded border-gray-300 text-[#f86126] focus:ring-[#f86126]"
                      />
                    </th>
                    {currentConfig.columns.map(col => (
                      <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-700">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          onChange={() => toggleSelectOne(item.id)}
                          checked={selectAllMatching || selectedIds.has(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#f86126] focus:ring-[#f86126]"
                        />
                      </td>
                      {currentConfig.columns.map(col => (
                        <td key={col.key} className="px-4 py-3 text-gray-700">
                          {item[col.key] || '—'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-[#f86126] hover:text-[#d94d1a] font-medium mr-3 py-2 inline-block"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleSingleDelete(item)}
                          className="text-red-500 hover:text-red-700 font-medium py-2 inline-block"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.lastPage > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <span className="text-sm text-gray-600">
                  {pagination.total} résultat(s)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => fetchItems(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="px-3 py-1 min-h-[44px] text-sm border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {pagination.currentPage} / {pagination.lastPage}
                  </span>
                  <button
                    onClick={() => fetchItems(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.lastPage}
                    className="px-3 py-1 min-h-[44px] text-sm border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="md:hidden space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl border p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    onChange={() => toggleSelectOne(item.id)}
                    checked={selectAllMatching || selectedIds.has(item.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#f86126] focus:ring-[#f86126]"
                  />
                  <span className="text-xs text-gray-400">#{item.id}</span>
                </div>
                {currentConfig.columns.map(col => (
                  <div key={col.key} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase">{col.label}</span>
                    <span className="text-sm text-gray-800 font-medium">{item[col.key] || '—'}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 py-2 min-h-[44px] text-sm text-[#f86126] border border-[#f86126] rounded-lg font-medium"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleSingleDelete(item)}
                    className="flex-1 py-2 min-h-[44px] text-sm text-red-500 border border-red-300 rounded-lg font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {pagination.lastPage > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl border px-4 py-3">
                <span className="text-sm text-gray-600">
                  {pagination.total} résultat(s)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => fetchItems(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="px-3 py-1 min-h-[44px] text-sm border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {pagination.currentPage} / {pagination.lastPage}
                  </span>
                  <button
                    onClick={() => fetchItems(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.lastPage}
                    className="px-3 py-1 min-h-[44px] text-sm border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editingItem ? `Modifier ${currentConfig.label}` : `Ajouter ${currentConfig.label}`}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {currentConfig.fields.map(field => {
                  const isRequired = typeof field.required === 'function'
                    ? field.required(editingItem)
                    : field.required

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {isRequired && <span className="text-[#dc2626]"> *</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126] min-h-[80px]"
                          required={isRequired}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
                          required={isRequired}
                        >
                          {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : field.type === 'dynamicSelect' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
                          required={isRequired}
                        >
                          <option value="">-- Sélectionner --</option>
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
                          required={isRequired}
                        />
                      )}
                    </div>
                  )
                })}

                {activeTab === 'users' && ((!editingItem && formData.role === 'agent') || (editingItem && (formData.role || editingItem.role) === 'agent')) && allWarehouses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entrepôts assignés
                    </label>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                      {allWarehouses.map(w => (
                        <label key={w.id} className="flex items-center gap-2 py-1 px-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userWarehouseIds.includes(w.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUserWarehouseIds(prev => [...prev, w.id])
                              } else {
                                setUserWarehouseIds(prev => prev.filter(id => id !== w.id))
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-[#f86126] focus:ring-[#f86126]"
                          />
                          <span className="text-sm text-gray-700">{w.name}</span>
                          {w.location && <span className="text-xs text-gray-400">— {w.location}</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                      className="flex-1 py-2 min-h-[44px] border rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                      className="flex-1 py-2 min-h-[44px] bg-[#f86126] text-white rounded-lg hover:bg-[#d94d1a]"
                  >
                    {editingItem ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {bulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Modifier {selectionCount} {currentConfig.label.toLowerCase()}
              </h2>

              <form onSubmit={handleBulkEditSubmit} className="space-y-4">
                {currentConfig.bulkFields && currentConfig.bulkFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={bulkEditFormData[field.key] || ''}
                        onChange={e => setBulkEditFormData({ ...bulkEditFormData, [field.key]: e.target.value })}
                        placeholder="Laisser vide pour ne pas modifier"
                        className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126] min-h-[80px]"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={bulkEditFormData[field.key] || ''}
                        onChange={e => setBulkEditFormData({ ...bulkEditFormData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
                      >
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.type === 'dynamicSelect' ? (
                      <select
                        value={bulkEditFormData[field.key] || ''}
                        onChange={e => setBulkEditFormData({ ...bulkEditFormData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
                      >
                        <option value="">-- Inchangé --</option>
                        {allWarehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={bulkEditFormData[field.key] || ''}
                        onChange={e => setBulkEditFormData({ ...bulkEditFormData, [field.key]: e.target.value })}
                        placeholder="Laisser vide pour ne pas modifier"
                        className="w-full px-3 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
                      />
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-400">Seuls les champs remplis seront modifiés.</p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBulkEditOpen(false)}
                    className="flex-1 py-2 min-h-[44px] border rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={bulkEditLoading}
                    className="flex-1 py-2 min-h-[44px] bg-[#002f5e] text-white rounded-lg hover:bg-[#001a33] disabled:opacity-50"
                  >
                    {bulkEditLoading ? 'Modification...' : 'Appliquer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  )
}
