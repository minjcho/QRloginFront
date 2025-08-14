import React, { useState, useEffect } from 'react'
import orinIdService from '../services/orinIdService'
import type { OrinIdResponse } from '../services/orinIdService'
import OrinIdScanner from './OrinIdScanner'
import Toast from './Toast'
import './OrinIdManagement.css'

const OrinIdManagement: React.FC = () => {
  const [currentOrinId, setCurrentOrinId] = useState<string>('')
  const [newOrinId, setNewOrinId] = useState<string>('')
  const [searchOrinId, setSearchOrinId] = useState<string>('')
  const [searchResult, setSearchResult] = useState<OrinIdResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [showScanner, setShowScanner] = useState<boolean>(false)
  const [showSearchScanner, setShowSearchScanner] = useState<boolean>(false)
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchMyOrinId()
  }, [])

  useEffect(() => {
    if (newOrinId.length > 0) {
      const validation = orinIdService.validateOrinIdFormat(newOrinId)
      if (!validation.valid) {
        setAvailabilityMessage(validation.message || '')
        setIsAvailable(false)
      } else {
        checkAvailability(newOrinId)
      }
    } else {
      setAvailabilityMessage('')
      setIsAvailable(null)
    }
  }, [newOrinId])

  const fetchMyOrinId = async () => {
    try {
      setIsLoading(true)
      const response = await orinIdService.getMyOrinId()
      setCurrentOrinId(response.orinId || '')
    } catch (error) {
      console.error('Failed to fetch OrinId:', error)
      setCurrentOrinId('')
    } finally {
      setIsLoading(false)
    }
  }

  const checkAvailability = async (orinId: string) => {
    try {
      const response = await orinIdService.checkOrinIdAvailability(orinId)
      setIsAvailable(response.available)
      setAvailabilityMessage(response.message || '')
    } catch (error) {
      console.error('Failed to check availability:', error)
      setIsAvailable(false)
      setAvailabilityMessage('확인 중 오류가 발생했습니다')
    }
  }

  const handleUpdate = async () => {
    if (!newOrinId || !isAvailable) {
      setToast({ message: '사용 가능한 OrinId를 입력해주세요', type: 'error' })
      return
    }

    try {
      setIsLoading(true)
      const response = await orinIdService.updateMyOrinId(newOrinId)
      setCurrentOrinId(response.orinId)
      setNewOrinId('')
      setIsEditing(false)
      setToast({ message: 'OrinId가 성공적으로 변경되었습니다', type: 'success' })
    } catch (error: any) {
      setToast({ message: error.message || 'OrinId 변경에 실패했습니다', type: 'error' })
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
      setToast({ message: 'OrinId가 삭제되었습니다', type: 'success' })
    } catch (error: any) {
      setToast({ message: error.message || 'OrinId 삭제에 실패했습니다', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }


  const handleCancelEdit = () => {
    setIsEditing(false)
    setNewOrinId('')
    setAvailabilityMessage('')
    setIsAvailable(null)
  }

  const handleScanSuccess = (scannedOrinId: string) => {
    setNewOrinId(scannedOrinId)
    setShowScanner(false)
    setToast({ message: 'QR 코드에서 OrinId를 읽었습니다', type: 'success' })
  }

  const handleSearchScanSuccess = (scannedOrinId: string) => {
    setSearchOrinId(scannedOrinId)
    setShowSearchScanner(false)
    handleSearch(scannedOrinId)
  }

  const handleSearch = async (orinId?: string) => {
    const searchId = orinId || searchOrinId
    if (!searchId) {
      setToast({ message: '검색할 OrinId를 입력해주세요', type: 'error' })
      return
    }

    try {
      setIsLoading(true)
      const response = await orinIdService.getUserByOrinId(searchId)
      setSearchResult(response)
    } catch (error: any) {
      setSearchResult(null)
      setToast({ message: error.message || '사용자를 찾을 수 없습니다', type: 'error' })
    } finally {
      setIsLoading(false)
    }
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
          
          {!isEditing ? (
            <div className="current-orin-id">
              {currentOrinId ? (
                <>
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
                </>
              ) : (
                <div className="no-orin-id">
                  <p className="no-orin-id-message">설정된 OrinId가 없습니다</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                  >
                    OrinId 설정
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="edit-orin-id">
              <div className="input-group">
                <div className="input-with-scan">
                  <input
                    type="text"
                    className={`orin-input ${isAvailable === true ? 'valid' : isAvailable === false ? 'invalid' : ''}`}
                    placeholder="새 OrinId 입력"
                    value={newOrinId}
                    onChange={(e) => setNewOrinId(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    className="scan-qr-btn"
                    onClick={() => setShowScanner(true)}
                    disabled={isLoading}
                    title="QR 코드 스캔"
                  >
                    📷
                  </button>
                </div>
                {availabilityMessage && (
                  <span className={`availability-message ${isAvailable ? 'available' : 'unavailable'}`}>
                    {availabilityMessage}
                  </span>
                )}
              </div>
              <div className="button-group">
                <button 
                  className="btn btn-success"
                  onClick={handleUpdate}
                  disabled={isLoading || !isAvailable}
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
        </div>

        {/* Search User Section */}
        <div className="orin-section">
          <h3 className="section-title">사용자 검색</h3>
          <div className="search-container">
            <div className="search-input-group">
              <div className="input-with-scan">
                <input
                  type="text"
                  className="orin-input"
                  placeholder="검색할 OrinId 입력"
                  value={searchOrinId}
                  onChange={(e) => setSearchOrinId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isLoading}
                />
                <button 
                  className="scan-qr-btn"
                  onClick={() => setShowSearchScanner(true)}
                  disabled={isLoading}
                  title="QR 코드 스캔"
                >
                  📷
                </button>
              </div>
              <button 
                className="btn btn-primary search-btn"
                onClick={() => handleSearch()}
                disabled={isLoading}
              >
                <span className="search-icon">🔍</span>
                검색
              </button>
            </div>

            {searchResult && (
              <div className="search-result">
                <div className="result-card">
                  <h4>검색 결과</h4>
                  <div className="result-info">
                    <div className="info-row">
                      <span className="info-label">사용자 ID:</span>
                      <span className="info-value">{searchResult.userId}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">이메일:</span>
                      <span className="info-value">{searchResult.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">OrinId:</span>
                      <span className="info-value highlight">{searchResult.orinId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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

      {/* QR Scanner Modals */}
      {showScanner && (
        <OrinIdScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showSearchScanner && (
        <OrinIdScanner
          onScanSuccess={handleSearchScanSuccess}
          onClose={() => setShowSearchScanner(false)}
        />
      )}
    </div>
  )
}

export default OrinIdManagement