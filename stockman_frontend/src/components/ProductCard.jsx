export default function ProductCard({ product, onClick }) {
  return (
    <div
      onClick={() => onClick(product)}
      className="p-4 border rounded-lg bg-white hover:border-[#f86126] hover:shadow-sm cursor-pointer transition-all"
    >
      <h3 className="font-semibold text-gray-800">{product.nom_produit}</h3>
      <p className="text-sm text-gray-500 mt-1">Code: {product.code_produit}</p>
      <p className="text-sm text-gray-500">
        Emplacement: {product.emplacement_nom || <span className="text-gray-400">Non assigné</span>}
      </p>
    </div>
  )
}
