# 웨이브A (WaveA) - 이커머스 콘텐츠 AI 빌더

AI를 활용한 이커머스 썸네일 및 상세페이지 자동 생성 도구

## 🚀 프로젝트 개요

웨이브A는 Google Gemini AI를 활용하여 이커머스 상품의 썸네일과 상세페이지를 자동으로 생성하는 웹 애플리케이션입니다.

### 주요 기능

- **썸네일 생성기**: 상품 정보를 입력하면 AI가 최적화된 썸네일 이미지를 생성합니다
- **상세페이지 기획**: AI가 상품 특성에 맞는 상세페이지 구조를 자동으로 기획합니다
- **상세페이지 이미지 생성**: 기획안에 따라 9:16 비율의 세로형 이미지를 자동 생성합니다

## 📋 기술 스택

- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Lucide React
- **AI SDK**: @google/generative-ai
- **Routing**: React Router DOM 6+

## 🛠️ 설치 및 실행

### 1. 애플리케이션 시작

이 프로젝트는 자동으로 빌드되어 실행됩니다. 별도의 설치나 실행 명령이 필요하지 않습니다.

### 2. Gemini API 키 설정 (필수)

애플리케이션을 처음 실행하면 API 키 설정 안내 화면이 표시됩니다.

#### 방법 1: 화면 안내 따라하기 (추천)
1. 애플리케이션 실행 시 표시되는 안내 화면 확인
2. "Google AI Studio 열기" 버튼 클릭
3. API 키 발급 후 .env 파일에 추가
4. 브라우저 새로고침

#### 방법 2: 수동 설정
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 방문
2. Google 계정으로 로그인
3. "Create API Key" 클릭하여 무료 API 키 발급
4. 프로젝트 루트에 `.env` 파일 생성
5. 아래 내용 추가:
   ```bash
   VITE_GEMINI_API_KEY=여기에_발급받은_API_키_붙여넣기
   ```
6. 브라우저 새로고침

## 📁 프로젝트 구조

```
wave-a-builder/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── layout/          # Header, Footer
│   │   │   ├── common/          # LoadingSpinner, ErrorMessage
│   │   │   └── ui/              # shadcn/ui 컴포넌트
│   │   ├── pages/               # ThumbnailPage, DetailPage
│   │   └── App.tsx              # 메인 앱 컴포넌트
│   ├── lib/
│   │   └── gemini.ts            # Gemini API 클라이언트
│   ├── types/
│   │   └── index.ts             # TypeScript 타입 정의
│   └── styles/                  # 전역 스타일
├── .env.example                 # 환경 변수 예시
└── README.md
```

## 🎨 디자인 가이드

### 브랜드 컬러

- **Primary**: Blue-600 (신뢰감 있는 파란색)
- **Background**: Slate-50 (밝은 회색 배경)
- **Text**: Slate-900 (어두운 회색 텍스트)

### 레이아웃

- 반응형 디자인 (데스크탑 우선, 모바일 대응)
- 깔끔한 3단 구조 (Header, Content, Footer)
- 최대 너비 제한으로 가독성 확보

## 🔄 개발 로드맵

### ✅ Phase 1: 프로젝트 스캐폴딩 (완료)
- 기본 프로젝트 구조 설정
- 라우팅 및 레이아웃 구축
- Gemini API 클라이언트 설정

### ✅ Phase 2: 썸네일 생성기 (완료)
- 썸네일 입력 폼 UI
- Gemini API 연동
- 이미지 생성 및 다운로드

### ✅ Phase 3: 상세페이지 기획 (완료)
- 상품 정보 입력 폼
- AI 기획 생성 로직
- 기획안 수정 기능

### ✅ Phase 4: 상세페이지 이미지 생성 (완료)
- 섹션별 이미지 생성
- 진행 상황 표시
- 전체 뷰어 및 다운로드

## 🎯 주요 기능 상세

### 썸네일 생성기
- ✅ 상품명, 특징, 스타일 선택 입력
- ✅ 4가지 이미지 스타일 (모던, 미니멀, 생동감, 우아함)
- ✅ 원본 이미지 업로드 (선택)
- ✅ AI 기반 썸네일 생성
- ✅ 1:1 비율 정사각형 썸네일
- ✅ 생성 프롬프트 확인
- ✅ 이미지 다운로드

### 상세페이지 제작
- ✅ 3단계 워크플로우 (기획 → 생성 → 결과)
- ✅ 상품 정보 입력 (이름, 카테고리, 가격, 특징)
- ✅ 타겟 고객 설정
- ✅ 페이지 길이 선택 (5/7/9장)
- ✅ AI 기반 상세페이지 구조 기획
- ✅ 섹션별 편집 기능
- ✅ 9:16 세로형 이미지 생성
- ✅ 진행률 표시
- ✅ 연속 뷰어 및 개별 섹션 보기
- ✅ 개별/전체 다운로드

## ⚠️ 주의사항

- Gemini API 키는 절대 공개 저장소에 커밋하지 마세요
- `.env` 파일은 `.gitignore`에 포함되어 있습니다
- API 사용량에 따라 비용이 발생할 수 있습니다

## 📝 라이선스

이 프로젝트는 학습 및 개발 목적으로 제작되었습니다.

---

**WaveA** - Powered by Google Gemini AI