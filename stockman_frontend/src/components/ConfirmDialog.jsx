import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()

    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {title && <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>}
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
        <div className="flex border-t">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-3 min-h-[44px] text-gray-600 hover:bg-gray-50 font-medium text-sm border-r"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 min-h-[44px] text-red-600 hover:bg-red-50 font-medium text-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
