export default function EmplacementCard({ emplacement, selected, onClick, productCount = 0 }) {
  return (
    <button
      onClick={() => onClick(emplacement)}
      className={`p-6 rounded-xl border-2 text-left transition-all ${
        selected?.id === emplacement.id
          ? 'border-[#002f5e] bg-[#e6eef7] shadow-md'
          : 'border-gray-200 bg-white hover:border-[#f86126] hover:shadow-sm'
      }`}
    >
      <h3 className="font-semibold text-lg text-gray-800">{emplacement.name}</h3>
      <p className="text-sm text-gray-500 mt-1">
        {productCount === 0
          ? 'Aucun produit'
          : productCount === 1
            ? '1 produit'
            : `${productCount} produits`}
      </p>
    </button>
  )
}
