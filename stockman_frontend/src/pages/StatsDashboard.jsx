import { useState, useEffect } from 'react'
import api from '../services/api'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 border animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.products_count), 1)

  return (
    <div className="space-y-3">
      {data.slice(0, 10).map(item => (
        <div key={item.id} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-32 truncate text-right shrink-0" title={item.name}>
            {item.name}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full bg-[#f86126] rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${(item.products_count / max) * 100}%` }}
            >
              {item.products_count > max * 0.3 && (
                <span className="text-xs text-white font-medium">{item.products_count}</span>
              )}
            </div>
          </div>
          {item.products_count <= max * 0.3 && (
            <span className="text-xs text-gray-500 w-8">{item.products_count}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function StatsDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/stats')
      .then(res => setStats(res.data))
      .catch(() => setError('Erreur lors du chargement des statistiques'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="bg-white rounded-xl p-5 border animate-pulse mb-6">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-full" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600">{error}</div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Produits totaux</p>
          <p className="text-2xl font-bold text-[#002f5e]">{stats.total_products}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.assigned_products} assignés &middot; {stats.unassigned_products} libres
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Assignés</p>
          <p className="text-2xl font-bold text-green-600">{stats.assigned_products}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.total_products > 0
              ? Math.round((stats.assigned_products / stats.total_products) * 100)
              : 0}% du total
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Emplacements</p>
          <p className="text-2xl font-bold text-[#002f5e]">{stats.total_warehouses}</p>
          <p className="text-xs text-gray-400 mt-1">zones de stockage</p>
        </div>

        <div className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Utilisateurs</p>
          <p className="text-2xl font-bold text-[#002f5e]">{stats.total_users}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.admin_users} admins &middot; {stats.agent_users} agents
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Produits par emplacement
          </h2>
          {stats.products_per_warehouse.length > 0 ? (
            <BarChart data={stats.products_per_warehouse} />
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun emplacement</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Assignations récentes
          </h2>
          {stats.recent_assignments.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {stats.recent_assignments.map((a, i) => (
                <li key={i} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{a.product_name || '—'}</span>
                    <span className="text-gray-400 mx-1">&rarr;</span>
                    <span className="text-[#f86126]">{a.warehouse_name || '—'}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('fr-FR') : '—'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune assignation récente</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Derniers produits ajoutés
        </h2>
        {stats.recent_products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Nom</th>
                  <th className="pb-2 font-medium">Code-barres</th>
                  <th className="pb-2 font-medium text-right">Ajouté le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recent_products.map(p => (
                  <tr key={p.id}>
                    <td className="py-2.5 text-gray-800">{p.name}</td>
                    <td className="py-2.5 text-gray-500 font-mono text-xs">{p.barcode}</td>
                    <td className="py-2.5 text-gray-400 text-right text-xs">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-4 text-center">Aucun produit</p>
        )}
      </div>
    </div>
  )
}
