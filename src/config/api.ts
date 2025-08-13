// API 설정
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://minjcho.site';

// API 엔드포인트 생성 함수
export const getApiUrl = (endpoint: string): string => {
  // 개발 환경에서는 프록시 사용
  if (import.meta.env.DEV) {
    return endpoint; // /api/... 형태로 반환
  }
  
  // 프로덕션 환경에서는 전체 URL 사용
  return `${API_BASE_URL}${endpoint}`;
};