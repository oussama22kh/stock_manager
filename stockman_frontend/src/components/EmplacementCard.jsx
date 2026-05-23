export default function EmplacementCard({ emplacement, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(emplacement)}
      className={`p-6 rounded-xl border-2 text-left transition-all ${
        selected?.id === emplacement.id
          ? 'border-indigo-500 bg-indigo-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
      }`}
    >
      <h3 className="font-semibold text-lg text-gray-800">{emplacement.name}</h3>
    </button>
  )
}
