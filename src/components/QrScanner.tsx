import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import './QrScanner.css'

interface QrScannerProps {
  onScanSuccess: (data: any) => void
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')
  
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    let mounted = true

    const setupCamera = async () => {
      try {
        console.log('Setting up camera...')
        
        // Create code reader
        const codeReader = new BrowserMultiFormatReader()
        codeReaderRef.current = codeReader
        
        // Get available devices
        const videoInputDevices = await codeReader.listVideoInputDevices()
        console.log('Available cameras:', videoInputDevices)
        
        if (videoInputDevices.length === 0) {
          throw new Error('No camera found')
        }
        
        // Use first available camera (or back camera if available)
        const selectedDeviceId = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        )?.deviceId || videoInputDevices[0].deviceId
        
        console.log('Using camera:', selectedDeviceId)
        
        // Start decoding from video device
        if (mounted && videoRef.current) {
          await codeReader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                console.log('QR Code found:', result.getText())
                
                try {
                  const qrData = JSON.parse(result.getText())
                  
                  if (qrData.challengeId && qrData.nonce) {
                    // Valid QR code found
                    console.log('Valid QR data:', qrData)
                    codeReader.reset()
                    onScanSuccess(qrData)
                  }
                } catch (e) {
                  console.log('Not a valid QR code format')
                }
              }
              
              if (err && !(err.message?.includes('NotFoundException'))) {
                console.error('Decode error:', err)
              }
            }
          )
          
          setIsReady(true)
          setError('')
        }
      } catch (err: any) {
        console.error('Camera setup error:', err)
        
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access.')
        } else if (err.message?.includes('No camera')) {
          setError('No camera found on this device.')
        } else {
          setError('Failed to access camera. Please check permissions.')
        }
      }
    }

    setupCamera()

    // Cleanup
    return () => {
      mounted = false
      if (codeReaderRef.current) {
        console.log('Cleaning up camera...')
        codeReaderRef.current.reset()
      }
    }
  }, [onScanSuccess])

  return (
    <div className="qr-scanner-component">
      <div className="video-wrapper">
        <video 
          ref={videoRef}
          className="scanner-video"
          playsInline
          muted
        />
        
        {isReady && (
          <div className="scan-overlay">
            <div className="scan-frame">
              <div className="corner tl"></div>
              <div className="corner tr"></div>
              <div className="corner bl"></div>
              <div className="corner br"></div>
            </div>
            <p className="scan-text">Align QR code within frame</p>
          </div>
        )}
        
        {!isReady && !error && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Starting camera...</p>
          </div>
        )}
        
        {error && (
          <div className="error-overlay">
            <p>📷 {error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QrScanner