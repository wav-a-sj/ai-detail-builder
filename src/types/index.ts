/**
 * WAVA 애플리케이션 전역 타입 정의
 */

// ============================================
// 썸네일 생성 관련 타입
// ============================================

/**
 * 이미지 스타일 옵션
 */
export type ImageStyle = 'clean' | 'lifestyle' | 'creative';

/**
 * 이미지 생성 모델 타입
 */
export type ImageModel = 'free' | 'nanobanana';

/**
 * 썸네일 이미지 비율
 */
export type AspectRatio = '1:1' | '9:16' | '16:9' | 'custom';

/**
 * 썸네일 생성 입력 데이터
 */
export interface ThumbnailInput {
  originalImage?: File;        // 원본 이미지 (옵션)
  mainCopy: string;            // 메인 카피
  imageStyle: ImageStyle;      // 이미지 스타일 (Clean/Lifestyle/Creative)
  imageModel: ImageModel;      // 이미지 모델 (무료/Nanobanana Pro)
  additionalRequest?: string;  // 추가 요청사항
  aspectRatio: AspectRatio;    // 이미지 비율
  width: number;               // 너비 (px)
  height: number;              // 높이 (px)
}

/**
 * 썸네일 생성 결과
 */
export interface ThumbnailResult {
  imageUrl: string;            // 생성된 썸네일 이미지 URL
  prompt: string;              // 사용된 프롬프트 (영문 - 이미지 생성용)
  reasoning?: string;          // 기획 의도/설명 (한글 - 사용자 확인용)
  timestamp: Date;             // 생성 시간
}

// ============================================
// 상세페이지 생성 관련 타입
// ============================================

/**
 * 상세페이지 길이 옵션
 */
export type PageLength = 'auto' | 'short' | 'standard' | 'long';

/**
 * 상세페이지 기본 정보 입력
 */
export interface DetailPageInput {
  productName: string;         // 상품명
  category: string;            // 카테고리
  price?: number;               // 가격 (옵션)
  promotionInfo?: string;      // 프로모션 정보 (옵션)
  features: string;            // 상품 특징
  targetAudience: string[];    // 타겟 고객
  originalImages: File[];      // 원본 제품 이미지 (필수)
  pageLength: PageLength;      // 페이지 길이
}

/**
 * 상세페이지 섹션 정보
 */
export interface DetailPageSection {
  id: string;                  // 섹션 고유 ID
  title: string;               // 섹션 제목
  keyMessage: string;          // 핵심 메시지/카피
  visualPrompt: string;        // 이미지 생성용 프롬프트
  imageUrl?: string;           // 생성된 이미지 URL (생성 후)
  order: number;               // 섹션 순서
}

/**
 * 상세페이지 기획 결과
 */
export interface DetailPagePlan {
  sections: DetailPageSection[]; // 섹션 배열
  totalSections: number;          // 총 섹션 수
  timestamp: Date;                // 기획 생성 시간
}

/**
 * 상세페이지 생성 진행 상태
 */
export interface GenerationProgress {
  current: number;             // 현재 진행 중인 섹션 번호
  total: number;               // 총 섹션 수
  status: 'idle' | 'planning' | 'generating' | 'completed' | 'error';
  message?: string;            // 상태 메시지
}

// ============================================
// API 응답 관련 타입
// ============================================

/**
 * API 에러 응답
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * API 성공 응답 래퍼
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
