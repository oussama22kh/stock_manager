import { useState, useEffect, useRef } from 'react'

export default function SearchBar({ onSearch, placeholder = 'Rechercher...', initialValue = '' }) {
  const [value, setValue] = useState(initialValue)
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onSearch(value)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [value])

  return (
    <input
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86126]"
    />
  )
}
