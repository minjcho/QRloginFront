import React, { useRef, useEffect, useState } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import './OrinIdScanner.css'

interface OrinIdScannerProps {
  onScanSuccess: (orinId: string) => void
  onClose: () => void
}

const OrinIdScanner: React.FC<OrinIdScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (hasPermission === true) {
      startScanning()
    }

    return () => {
      stopScanning()
    }
  }, [hasPermission])

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      streamRef.current = stream
      setHasPermission(true)
    } catch (err) {
      console.error('Camera permission denied:', err)
      setError('Camera permission denied. Please allow camera access.')
      setHasPermission(false)
    }
  }

  const parseOrinId = (text: string): string | null => {
    // Remove any whitespace
    const cleanText = text.trim()
    
    // Check if it's a numeric timestamp (13 digits)
    if (/^\d{13}$/.test(cleanText)) {
      // Convert timestamp to OrinId format
      return `orin-${cleanText}`
    }
    
    // Check if it already has orin prefix
    if (cleanText.toLowerCase().startsWith('orin')) {
      // Normalize the format (ensure it has hyphen)
      const idPart = cleanText.substring(4)
      if (idPart.startsWith('-')) {
        return cleanText.toLowerCase()
      } else {
        return `orin-${idPart}`.toLowerCase()
      }
    }
    
    // Check if it's alphanumeric (valid OrinId format)
    if (/^[a-zA-Z0-9-_]+$/.test(cleanText)) {
      return cleanText
    }
    
    return null
  }

  const startScanning = async () => {
    if (!videoRef.current || !streamRef.current) return

    try {
      setIsScanning(true)
      setError('')

      // Set up video element
      videoRef.current.srcObject = streamRef.current
      await videoRef.current.play()

      // Initialize code reader with QR and other 2D barcode formats
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.AZTEC,
        BarcodeFormat.PDF_417
      ])
      
      const codeReader = new BrowserMultiFormatReader(hints)
      codeReaderRef.current = codeReader

      // Start continuous scanning
      const scanningLoop = () => {
        if (!isScanning || !videoRef.current) return
        
        codeReader.decodeFromVideoElement(videoRef.current)
          .then((result) => {
            if (result) {
              const text = result.getText()
              console.log('QR Code scanned:', text)
              
              const parsedOrinId = parseOrinId(text)
              if (parsedOrinId) {
                handleSuccessfulScan(parsedOrinId)
              } else {
                setError('Invalid OrinId format in QR code')
                // Continue scanning after showing error
                setTimeout(() => {
                  setError('')
                  requestAnimationFrame(scanningLoop)
                }, 3000)
              }
            }
          })
          .catch((err) => {
            if (err?.message !== 'NotFoundException') {
              console.error('Scanning error:', err)
            }
            // Continue scanning
            if (isScanning) {
              requestAnimationFrame(scanningLoop)
            }
          })
      }
      
      scanningLoop()
    } catch (err) {
      console.error('Failed to start scanning:', err)
      setError('Failed to start camera. Please try again.')
      setIsScanning(false)
    }
  }

  const handleSuccessfulScan = (orinId: string) => {
    // Stop scanning
    stopScanning()
    
    // Notify parent component
    onScanSuccess(orinId)
  }

  const stopScanning = () => {
    // Stop the code reader
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  const handleManualInput = () => {
    const input = prompt('Enter OrinId manually:')
    if (input) {
      const parsedOrinId = parseOrinId(input)
      if (parsedOrinId) {
        handleSuccessfulScan(parsedOrinId)
      } else {
        setError('Invalid OrinId format')
      }
    }
  }

  if (hasPermission === null) {
    return (
      <div className="orin-scanner-modal">
        <div className="orin-scanner-container">
          <div className="scanner-header">
            <h3>Scan OrinId QR Code</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="permission-prompt">
            <div className="camera-icon">📷</div>
            <h4>Camera Permission Required</h4>
            <p>We need access to your camera to scan QR codes</p>
            <p className="format-info">
              Supported formats: 
              <br />• Numeric (e.g., 1420524217000)
              <br />• OrinId (e.g., orin12345)
            </p>
            <button 
              className="permission-btn"
              onClick={requestCameraPermission}
            >
              Allow Camera Access
            </button>
            <button 
              className="manual-input-btn"
              onClick={handleManualInput}
            >
              Enter Manually
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className="orin-scanner-modal">
        <div className="orin-scanner-container">
          <div className="scanner-header">
            <h3>Scan OrinId QR Code</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="permission-denied">
            <div className="error-icon">⚠️</div>
            <h4>Camera Access Denied</h4>
            <p>Please enable camera permissions in your browser settings</p>
            <button 
              className="manual-input-btn"
              onClick={handleManualInput}
            >
              Enter OrinId Manually
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orin-scanner-modal">
      <div className="orin-scanner-container">
        <div className="scanner-header">
          <h3>Scan OrinId QR Code</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="scanner-viewport">
          <video 
            ref={videoRef}
            className="scanner-video"
            playsInline
            muted
          />
          
          <div className="scanner-overlay">
            <div className="scanner-frame">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
            </div>
          </div>
          
          {isScanning && (
            <div className="scanner-status">
              <div className="scanning-indicator">
                <span className="pulse-dot"></span>
                <span>Scanning...</span>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="scanner-error">
            <p>{error}</p>
          </div>
        )}
        
        <div className="scanner-instructions">
          <p>Point your camera at the QR code</p>
          <p className="format-hint">
            Accepts: Numeric IDs (13 digits) or OrinId format
          </p>
        </div>
        
        <div className="scanner-actions">
          <button 
            className="manual-input-btn secondary"
            onClick={handleManualInput}
          >
            Enter Manually
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrinIdScanner