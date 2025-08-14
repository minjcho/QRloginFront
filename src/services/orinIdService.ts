import { getApiUrl } from '../config/api'
import authService from './authService'

export interface OrinIdResponse {
  userId: number
  email: string
  orinId: string
}

export interface OrinIdUpdateRequest {
  orinId: string
}

export interface OrinIdAvailabilityResponse {
  available: boolean
  message?: string
}

class OrinIdService {
  // Get my OrinId
  async getMyOrinId(): Promise<OrinIdResponse> {
    const response = await authService.authenticatedFetch(
      getApiUrl('/api/orin/my'),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('인증이 필요합니다')
      }
      throw new Error('OrinId 조회에 실패했습니다')
    }

    return response.json()
  }

  // Update my OrinId
  async updateMyOrinId(orinId: string): Promise<OrinIdResponse> {
    const response = await authService.authenticatedFetch(
      getApiUrl('/api/orin/my'),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orinId }),
      }
    )

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json()
        throw new Error(error.message || '잘못된 요청입니다')
      }
      if (response.status === 401) {
        throw new Error('인증이 필요합니다')
      }
      throw new Error('OrinId 변경에 실패했습니다')
    }

    const result = await response.json()
    
    // Update local storage with new OrinId
    if (result.orinId) {
      localStorage.setItem('orinId', result.orinId)
    }
    
    return result
  }

  // Delete my OrinId
  async deleteMyOrinId(): Promise<OrinIdResponse> {
    const response = await authService.authenticatedFetch(
      getApiUrl('/api/orin/my'),
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('인증이 필요합니다')
      }
      throw new Error('OrinId 삭제에 실패했습니다')
    }

    // Remove OrinId from local storage
    localStorage.removeItem('orinId')
    
    return response.json()
  }

  // Get user by OrinId
  async getUserByOrinId(orinId: string): Promise<OrinIdResponse> {
    const response = await authService.authenticatedFetch(
      getApiUrl(`/api/orin/user/${encodeURIComponent(orinId)}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('인증이 필요합니다')
      }
      if (response.status === 404) {
        throw new Error('사용자를 찾을 수 없습니다')
      }
      throw new Error('사용자 조회에 실패했습니다')
    }

    return response.json()
  }

  // Check OrinId availability
  async checkOrinIdAvailability(orinId: string): Promise<OrinIdAvailabilityResponse> {
    const response = await authService.authenticatedFetch(
      getApiUrl(`/api/orin/check/${encodeURIComponent(orinId)}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('인증이 필요합니다')
      }
      throw new Error('OrinId 확인에 실패했습니다')
    }

    const data = await response.json()
    
    // Parse the response to determine availability
    // The API returns a generic object, so we need to check for specific fields
    const available = data.available !== false
    
    return {
      available,
      message: available ? '사용 가능한 OrinId입니다' : '이미 사용 중인 OrinId입니다'
    }
  }

  // Validate OrinId format
  validateOrinIdFormat(orinId: string): { valid: boolean; message?: string } {
    if (!orinId || orinId.trim().length === 0) {
      return { valid: false, message: 'OrinId를 입력해주세요' }
    }

    if (orinId.length < 3) {
      return { valid: false, message: 'OrinId는 최소 3자 이상이어야 합니다' }
    }

    if (orinId.length > 50) {
      return { valid: false, message: 'OrinId는 50자를 초과할 수 없습니다' }
    }

    // Allow alphanumeric characters, hyphens, and underscores
    const pattern = /^[a-zA-Z0-9-_]+$/
    if (!pattern.test(orinId)) {
      return { valid: false, message: 'OrinId는 영문, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다' }
    }

    return { valid: true }
  }
}

// Create singleton instance
const orinIdService = new OrinIdService()

export default orinIdService