import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onScan }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    let mounted = true
    const constraints = { video: { facingMode: 'environment' } }

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        if (mounted && videoRef.current) {
          streamRef.current = stream
          videoRef.current.srcObject = stream
          videoRef.current.play()
        } else {
          stream.getTracks().forEach(t => t.stop())
        }
      })
      .catch(err => {
        if (err.name === 'NotAllowedError') {
          setCameraError('Accès à la caméra refusé. Veuillez autoriser l\'accès à la caméra ou utiliser la saisie manuelle.')
        } else {
          setCameraError('Caméra non disponible. Utilisez la saisie manuelle.')
        }
      })

    return () => {
      mounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const handleScan = () => {
    const code = prompt('Entrez le code-barres manuellement:')
    if (code && code.trim()) {
      onScan(code.trim())
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {cameraError && (
        <div className="p-3 w-full max-w-md bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          {cameraError}
        </div>
      )}
      <div className="relative w-full max-w-md bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none" />
      </div>
      <button
        onClick={handleScan}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Saisir code-barres manuellement
      </button>
      <p className="text-sm text-gray-500">Scannez un code-barres avec la caméra ou saisissez-le manuellement</p>
    </div>
  )
}
