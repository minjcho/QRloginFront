import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface QrScannerProps {
  onScanSuccess: (data: any) => void
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef<boolean>(false)
  
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('Cleaning up camera resources...')
    
    // Stop scanning
    scanningRef.current = false
    
    // Reset reader
    if (readerRef.current) {
      try {
        readerRef.current.reset()
      } catch (e) {
        console.error('Error resetting reader:', e)
      }
      readerRef.current = null
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log(`Stopped track: ${track.kind}`)
      })
      streamRef.current = null
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraState('requesting')
      setErrorMessage('')
      
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported. Please use HTTPS.')
      }
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current!.play()
                .then(() => {
                  console.log('Video playing')
                  setCameraState('active')
                  resolve()
                })
                .catch(err => {
                  console.error('Error playing video:', err)
                  setErrorMessage('Failed to start video preview')
                  setCameraState('error')
                })
            }
          }
        })
        
        // Start scanning after video is ready
        startScanning()
      }
    } catch (error: any) {
      console.error('Camera error:', error)
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Camera permission denied. Please allow camera access.')
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('No camera found on this device.')
      } else if (error.name === 'NotReadableError') {
        setErrorMessage('Camera is being used by another application.')
      } else {
        setErrorMessage(error.message || 'Failed to access camera')
      }
      
      setCameraState('error')
      cleanup()
    }
  }, [cleanup])

  // Start scanning
  const startScanning = useCallback(() => {
    if (!videoRef.current || scanningRef.current) return
    
    console.log('Starting QR code scanning...')
    scanningRef.current = true
    
    // Initialize reader
    readerRef.current = new BrowserMultiFormatReader()
    
    const scan = async () => {
      if (!scanningRef.current || !videoRef.current || !readerRef.current) {
        return
      }
      
      try {
        const result = await readerRef.current.decodeFromVideoElement(videoRef.current)
        
        if (result) {
          console.log('QR Code detected:', result.getText())
          
          // Stop scanning
          scanningRef.current = false
          
          // Parse and validate QR data
          try {
            const qrData = JSON.parse(result.getText())
            
            if (qrData.challengeId && qrData.nonce) {
              onScanSuccess(qrData)
              cleanup()
            } else {
              console.error('Invalid QR format')
              setErrorMessage('Invalid QR code format')
              
              // Resume scanning after delay
              setTimeout(() => {
                if (cameraState === 'active') {
                  scanningRef.current = true
                  scan()
                }
              }, 2000)
            }
          } catch (e) {
            console.error('Failed to parse QR data:', e)
            setErrorMessage('Invalid QR code')
            
            // Resume scanning after delay
            setTimeout(() => {
              if (cameraState === 'active') {
                scanningRef.current = true
                scan()
              }
            }, 2000)
          }
        }
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          console.error('Scanning error:', error)
        }
      }
      
      // Continue scanning
      if (scanningRef.current) {
        requestAnimationFrame(scan)
      }
    }
    
    // Start scanning loop
    scan()
  }, [cameraState, onScanSuccess, cleanup])

  // Initialize on mount
  useEffect(() => {
    startCamera()
    
    return () => {
      cleanup()
    }
  }, [])

  // Retry function
  const handleRetry = () => {
    cleanup()
    startCamera()
  }

  return (
    <div className="scanner-container">
      {cameraState === 'idle' && (
        <div className="scanner-idle">
          <button onClick={startCamera} className="start-camera-btn">
            📷 Start Camera
          </button>
        </div>
      )}
      
      {cameraState === 'requesting' && (
        <div className="scanner-requesting">
          <div className="spinner"></div>
          <p>Requesting camera permission...</p>
        </div>
      )}
      
      {cameraState === 'active' && (
        <div className="scanner-active">
          <div className="scanner-viewport">
            <video
              ref={videoRef}
              className="scanner-video"
              playsInline
              muted
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            <div className="scanner-overlay">
              <div className="scanner-frame">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
              
              <div className="scanner-hint">
                Align QR code within the frame
              </div>
            </div>
          </div>
          
          <button onClick={cleanup} className="stop-scanner-btn">
            Stop Scanner
          </button>
        </div>
      )}
      
      {cameraState === 'error' && (
        <div className="scanner-error">
          <div className="error-icon">📵</div>
          <p className="error-message">{errorMessage}</p>
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
        </div>
      )}
      
      {errorMessage && cameraState === 'active' && (
        <div className="scanner-warning">
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  )
}

export default QrScanner