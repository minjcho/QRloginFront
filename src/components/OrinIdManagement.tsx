import React, { useState, useEffect } from 'react'
import orinIdService from '../services/orinIdService'
import OrinIdScanner from './OrinIdScanner'
import SuccessPopup from './SuccessPopup'
import Toast from './Toast'
import './OrinIdManagement.css'

const OrinIdManagement: React.FC = () => {
  const [currentOrinId, setCurrentOrinId] = useState<string>('')
  const [newOrinId, setNewOrinId] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [showScanner, setShowScanner] = useState<boolean>(false)
  const [showManualInput, setShowManualInput] = useState<boolean>(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchMyOrinId()
  }, [])

  const fetchMyOrinId = async () => {
    try {
      setIsLoading(true)
      const response = await orinIdService.getMyOrinId()
      setCurrentOrinId(response.orinId || '')
      
      // If no OrinId exists, show scanner by default
      if (!response.orinId) {
        setShowScanner(true)
      }
    } catch (error) {
      console.error('Failed to fetch OrinId:', error)
      setCurrentOrinId('')
      // Show scanner if fetch fails (no OrinId)
      setShowScanner(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!newOrinId) {
      setToast({ message: 'OrinId를 입력해주세요', type: 'error' })
      return
    }

    // Basic format validation
    const validation = orinIdService.validateOrinIdFormat(newOrinId)
    if (!validation.valid) {
      setToast({ message: validation.message || 'Invalid OrinId format', type: 'error' })
      return
    }

    try {
      setIsLoading(true)
      const response = await orinIdService.updateMyOrinId(newOrinId)
      setCurrentOrinId(response.orinId)
      setNewOrinId('')
      setIsEditing(false)
      setShowScanner(false)
      setShowManualInput(false)
      
      // Show success popup
      setSuccessMessage(`OrinId가 성공적으로 설정되었습니다: ${response.orinId}`)
      setShowSuccessPopup(true)
    } catch (error: any) {
      setToast({ message: error.message || 'OrinId 설정에 실패했습니다', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('정말로 OrinId를 삭제하시겠습니까?')) {
      return
    }

    try {
      setIsLoading(true)
      await orinIdService.deleteMyOrinId()
      setCurrentOrinId('')
      setShowScanner(true) // Show scanner after deletion
    } catch (error: any) {
      setToast({ message: error.message || 'OrinId 삭제에 실패했습니다', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setNewOrinId('')
    setShowManualInput(false)
    if (!currentOrinId) {
      setShowScanner(true)
    }
  }

  const handleScanSuccess = (scannedOrinId: string) => {
    setNewOrinId(scannedOrinId)
    setShowScanner(false)
    setShowManualInput(true)
    setIsEditing(true)
  }

  const handleManualInputClick = () => {
    setShowScanner(false)
    setShowManualInput(true)
    setIsEditing(true)
  }

  return (
    <div className="orin-id-container">
      <div className="orin-id-card">
        <h2 className="orin-id-title">
          <span className="orin-id-icon">🆔</span>
          OrinId 관리
        </h2>

        {/* My OrinId Section */}
        <div className="orin-section">
          <h3 className="section-title">내 OrinId</h3>
          
          {currentOrinId && !isEditing ? (
            <div className="current-orin-id">
              <div className="orin-id-display">
                <span className="orin-id-label">현재 OrinId:</span>
                <span className="orin-id-value">{currentOrinId}</span>
              </div>
              <div className="button-group">
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  변경
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Show scanner or manual input based on state */}
              {showScanner && !showManualInput && (
                <div className="scanner-section">
                  <OrinIdScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => {
                      if (currentOrinId) {
                        setShowScanner(false)
                        setIsEditing(false)
                      }
                    }}
                  />
                  <div className="scanner-alternative">
                    <button 
                      className="btn btn-secondary"
                      onClick={handleManualInputClick}
                    >
                      수동으로 입력
                    </button>
                    {currentOrinId && (
                      <button 
                        className="btn btn-outline"
                        onClick={() => {
                          setShowScanner(false)
                          setIsEditing(false)
                        }}
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Manual input form */}
              {(showManualInput || (isEditing && !showScanner)) && (
                <div className="edit-orin-id">
                  <div className="input-group">
                    <div className="input-with-scan">
                      <input
                        type="text"
                        className="orin-input"
                        placeholder="새 OrinId 입력"
                        value={newOrinId}
                        onChange={(e) => setNewOrinId(e.target.value)}
                        disabled={isLoading}
                      />
                      <button 
                        className="scan-qr-btn"
                        onClick={() => {
                          setShowScanner(true)
                          setShowManualInput(false)
                        }}
                        disabled={isLoading}
                        title="QR 코드 스캔"
                      >
                        📷
                      </button>
                    </div>
                  </div>
                  <div className="button-group">
                    <button 
                      className="btn btn-success"
                      onClick={handleUpdate}
                      disabled={isLoading || !newOrinId}
                    >
                      저장
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <SuccessPopup
          message={successMessage}
          onClose={() => setShowSuccessPopup(false)}
          duration={3000}
        />
      )}
    </div>
  )
}

export default OrinIdManagement