import { useEffect, useRef, useState } from 'react'
import Quagga from '@ericblade/quagga2'

export default function BarcodeScanner({ onScan }) {
  const scannerRef = useRef(null)
  const [cameraError, setCameraError] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const stopScanning = () => {
    setIsScanning(false)
    try {
      Quagga.stop()
    } catch (e) {
    }
  }

  const startScanning = () => {
    setCameraError('')
    setIsScanning(true)

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          facingMode: 'environment',
          width: { min: 640 },
          height: { min: 480 },
        },
      },
      decoder: {
        readers: [
          'ean_reader',
          'ean_8_reader',
          'code_128_reader',
          'code_39_reader',
          'upc_reader',
          'upc_e_reader',
        ],
      },
      locate: true,
    }, (err) => {
      if (err) {
        stopScanning()
        setCameraError('Caméra non disponible. Utilisez la saisie manuelle.')
        return
      }
      Quagga.start()
    })

    Quagga.onDetected((result) => {
      if (result && result.codeResult && result.codeResult.code) {
        onScan(result.codeResult.code)
        stopScanning()
      }
    })
  }

  const handleManualEntry = () => {
    if (isScanning) stopScanning()
    const code = prompt('Entrez le code-barres manuellement:')
    if (code && code.trim()) {
      onScan(code.trim())
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {cameraError && (
        <div className="p-3 w-full max-w-md bg-[#fef5e0] border border-[#fbb945] rounded-lg text-sm text-[#78350f]">
          {cameraError}
        </div>
      )}
      <div
        ref={scannerRef}
        className="relative w-full max-w-md bg-black rounded-lg overflow-hidden"
        style={{ height: '256px' }}
      />
      <div className="flex gap-2">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-4 py-2 min-h-[44px] bg-[#f86126] text-white rounded-lg hover:bg-[#d94d1a]"
          >
            Démarrer le scan
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-4 py-2 min-h-[44px] bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Arrêter le scan
          </button>
        )}
        <button
          onClick={handleManualEntry}
          className="px-4 py-2 min-h-[44px] bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Saisie manuelle
        </button>
      </div>
      <p className="text-sm text-gray-500">
        {isScanning ? 'Scannez un code-barres avec la caméra' : 'Appuyez sur Démarrer pour scanner'}
      </p>
    </div>
  )
}