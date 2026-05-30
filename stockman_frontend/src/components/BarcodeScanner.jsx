import { useState, useRef, useEffect } from 'react'

export default function BarcodeScanner({ onScan }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Veuillez entrer un code-barres')
      return
    }
    setError('')
    onScan(code.trim())
    setCode('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Code-barres</label>
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          placeholder="Entrez le code-barres"
          className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#f86126] focus:border-transparent"
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={!code.trim()}
          className="px-4 py-3 min-h-[44px] bg-[#f86126] text-white rounded-lg hover:bg-[#d94d1a] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Valider
        </button>
      </form>
    </div>
  )
}
