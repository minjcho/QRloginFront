import React, { useRef, useEffect, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import './OrinIdScanner.css'

interface OrinIdScannerProps {
  onScanSuccess: (orinId: string) => void
  onClose: () => void
}

const OrinIdScanner: React.FC<OrinIdScannerProps> = ({ onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    startScanning()

    return () => {
      stopScanning()
    }
  }, [])

  const parseOrinId = (text: string): string | null => {
    // Remove any whitespace
    const cleanText = text.trim()
    
    // Check if it's a numeric timestamp (13 digits)
    if (/^\d{13}$/.test(cleanText)) {
      // Return the numeric ID as is
      return cleanText
    }
    
    // Check if it already has orin prefix
    if (cleanText.toLowerCase().startsWith('orin')) {
      // Return without the 'orin' prefix
      const idPart = cleanText.substring(4)
      // Remove hyphen if it starts with one
      if (idPart.startsWith('-')) {
        return idPart.substring(1)
      } else {
        return idPart
      }
    }
    
    // Check if it's alphanumeric (valid OrinId format)
    if (/^[a-zA-Z0-9-_]+$/.test(cleanText)) {
      return cleanText
    }
    
    return null
  }

  const startScanning = async () => {
    let mounted = true

    try {
      console.log('Starting OrinId scanner...')
      setIsScanning(true)
      setError('')

      // Create code reader
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      // Get available devices
      const videoInputDevices = await codeReader.listVideoInputDevices()
      console.log('Available cameras:', videoInputDevices)

      if (videoInputDevices.length === 0) {
        throw new Error('No camera found')
      }

      // Use back camera if available, otherwise use first camera
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
              const text = result.getText()
              console.log('QR Code scanned:', text)
              
              const parsedOrinId = parseOrinId(text)
              if (parsedOrinId) {
                handleSuccessfulScan(parsedOrinId)
              } else {
                setError('QR 코드의 OrinId 형식이 잘못되었습니다')
                // Clear error after 3 seconds
                setTimeout(() => setError(''), 3000)
              }
            }
            
            if (err && !(err.message?.includes('NotFoundException'))) {
              console.error('Decode error:', err)
            }
          }
        )
      }
    } catch (err: any) {
      console.error('Failed to start scanning:', err)
      
      if (err.name === 'NotAllowedError') {
        setError('카메라 권한이 거부되었습니다. 카메라 접근을 허용해주세요.')
      } else if (err.message?.includes('No camera')) {
        setError('이 기기에서 카메라를 찾을 수 없습니다.')
      } else {
        setError('카메라 접근 실패. 다시 시도해주세요.')
      }
      setIsScanning(false)
    }

    return () => {
      mounted = false
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
      console.log('Stopping scanner...')
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }

    setIsScanning(false)
  }

  return (
    <div className="inline-scanner-container">
      <div className="scanner-viewport-inline">
        <video 
          ref={videoRef}
          className="scanner-video"
          playsInline
          muted
        />
        
        {isScanning && (
          <div className="scanner-overlay">
            <div className="scanner-frame">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
            </div>
            
            <div className="scanner-status">
              <div className="scanning-indicator">
                <span className="pulse-dot"></span>
                <span>QR 코드를 인식 중...</span>
              </div>
            </div>
          </div>
        )}
        
        {!isScanning && !error && (
          <div className="loading-overlay-scanner">
            <div className="spinner"></div>
            <p>카메라 시작 중...</p>
          </div>
        )}
        
        {error && (
          <div className="scanner-error-overlay">
            <p>📷 {error}</p>
          </div>
        )}
      </div>
      
      <div className="scanner-instructions-inline">
        <p>QR 코드를 프레임 안에 맞춰주세요</p>
        <p className="format-hint">
          OrinId 형식을 자동으로 인식합니다
        </p>
      </div>
    </div>
  )
}

export default OrinIdScanner