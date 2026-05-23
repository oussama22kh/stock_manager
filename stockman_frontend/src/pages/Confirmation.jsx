import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../services/api'

export default function Confirmation() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { selectedEmplacement, selectedProduit, setSelectedProduit } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedProduit || !selectedEmplacement) {
      navigate('/produits')
    }
  }, [selectedProduit, selectedEmplacement, navigate])

  if (!selectedProduit || !selectedEmplacement) {
    return null
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.patch(`/produits/${selectedProduit.id}/emplacement`, {
        emplacement_id: selectedEmplacement.id,
      })
      setSelectedProduit(res.data)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'assignation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Confirmation</h1>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div>
          <label className="text-sm text-gray-500">Produit</label>
          <p className="font-semibold text-gray-800">{selectedProduit.nom_produit}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Code</label>
          <p className="font-mono text-gray-800">{selectedProduit.code_produit}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Nouvel emplacement</label>
          <p className="font-semibold text-indigo-600">{selectedEmplacement.name}</p>
        </div>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
            Produit assigné avec succès !
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/produits')}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Assignation...' : 'Confirmer'}
              </button>
            </div>
          </>
        )}

        {success && (
          <button
            onClick={() => navigate('/produits')}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retour aux produits
          </button>
        )}
      </div>
    </div>
  )
}
