import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface QrScannerProps {
  onScanSuccess: (data: any) => void
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [hasPermission, setHasPermission] = useState(false)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    initializeScanner()
    return () => {
      stopScanner()
    }
  }, [])

  const initializeScanner = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Please use HTTPS or follow the browser setup guide.')
      }
      
      // Request camera permission
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Use back camera if available
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      setHasPermission(true)
      
      if (videoRef.current) {
        // Store stream reference for cleanup
        videoRef.current.srcObject = stream
        
        // Ensure video plays inline on mobile devices
        videoRef.current.setAttribute('playsinline', 'playsinline')
        videoRef.current.setAttribute('webkit-playsinline', 'webkit-playsinline')
        videoRef.current.setAttribute('autoplay', 'autoplay')
        videoRef.current.setAttribute('muted', 'muted')
        
        // For iOS Safari
        videoRef.current.disablePictureInPicture = true
        
        // Wait for video to be ready
        const playVideo = async () => {
          try {
            await videoRef.current!.play()
            console.log('Video playing successfully')
            
            // Initialize scanner after ensuring video is playing
            setTimeout(() => {
              if (videoRef.current && videoRef.current.readyState >= 2) {
                codeReader.current = new BrowserMultiFormatReader()
                startScanning()
              }
            }, 1000)
          } catch (err) {
            console.error('Error playing video:', err)
            // Try playing again on user interaction
            setError('Tap to start camera preview')
          }
        }
        
        // Handle different loading states
        if (videoRef.current.readyState >= 2) {
          await playVideo()
        } else {
          videoRef.current.onloadedmetadata = playVideo
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      setError(errorMessage)
      
      // Show specific help for HTTPS requirement
      if (!navigator.mediaDevices) {
        setError('Camera access requires HTTPS. Please use https:// or set up Chrome flags for your IP address.')
      }
    }
  }

  const startScanning = () => {
    if (!codeReader.current || !videoRef.current) return

    setIsScanning(true)
    setError('')

    // Start continuous scanning
    try {
      // Use decodeFromVideoElement for better mobile compatibility
      const scanContinuously = async () => {
        if (!codeReader.current || !videoRef.current) return
        
        try {
          const result = await codeReader.current.decodeFromVideoElement(videoRef.current)
          if (result) {
            handleScanResult(result.getText())
            return
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            console.error('Scan error:', error)
          }
        }
        
        // Continue scanning
        requestAnimationFrame(scanContinuously)
      }
      
      scanContinuously()
    } catch (error) {
      console.error('Scanning error:', error)
      setError('Failed to start scanner')
    }
  }

  const handleScanResult = (text: string) => {
    try {
      setIsScanning(false)
      
      // Parse QR code data
      const qrData = JSON.parse(text)
      
      if (qrData.challengeId && qrData.nonce) {
        onScanSuccess(qrData)
      } else {
        setError('Invalid QR code format. Please scan a valid login QR code.')
        setTimeout(() => {
          setIsScanning(true)
          startScanning()
        }, 2000)
      }
    } catch (error) {
      console.error('Error parsing QR data:', error)
      setError('Invalid QR code. Please scan a valid login QR code.')
      setTimeout(() => {
        setIsScanning(true)
        startScanning()
      }, 2000)
    }
  }

  const stopScanner = () => {
    setIsScanning(false)
    
    if (codeReader.current) {
      codeReader.current.reset()
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const retryScanning = () => {
    setError('')
    setIsScanning(true)
    startScanning()
  }

  if (!hasPermission) {
    return (
      <div className="scanner-container">
        <div className="permission-prompt">
          <h3>📷 Camera Access Required</h3>
          <p>Please grant camera permission to scan QR codes</p>
          <button onClick={initializeScanner} className="permission-btn">
            Grant Camera Access
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="scanner-container">
      <div className="scanner-viewport">
        <video
          ref={videoRef}
          id="qr-scanner-video"
          className="scanner-video"
          playsInline
          muted
          autoPlay
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
        />
        
        <div className="scanner-overlay">
          <div className="scanner-frame">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>
        </div>
        
        <div className="scanner-status">
          {isScanning ? (
            <div className="scanning-indicator">
              <div className="pulse-dot"></div>
              <span>Scanning for QR code...</span>
            </div>
          ) : (
            <div className="scan-paused">
              <span>Scan paused</span>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="scanner-error">
          <p>{error}</p>
          <button onClick={retryScanning} className="retry-scan-btn">
            Try Again
          </button>
        </div>
      )}
      
      <div className="scanner-instructions">
        <p>📱 Point your camera at the QR code displayed on the desktop</p>
        <p>The code will be automatically detected and processed</p>
      </div>
    </div>
  )
}

export default QrScanner