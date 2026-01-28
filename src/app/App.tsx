import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from '@/app/components/ui/sonner';
import { Header } from '@/app/components/layout/Header';
import { Footer } from '@/app/components/layout/Footer';
import { ThumbnailPage } from '@/app/pages/ThumbnailPage';
import { DetailPage } from '@/app/pages/DetailPage';
import { ApiKeySetup } from '@/app/components/common/ApiKeySetup';
import { ApiKeyProvider, useApiKey } from '@/contexts/ApiKeyContext';

/**
 * 앱 컨텐츠 컴포넌트 (API 키 확인)
 */
function AppContent() {
  const { hasApiKey } = useApiKey();

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* 상단 헤더 */}
        <Header />

        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1">
          {!hasApiKey ? (
            // API 키가 없으면 설정 안내 화면 표시
            <ApiKeySetup />
          ) : (
            // API 키가 있으면 정상 라우팅
            <Routes>
              {/* 홈/썸네일 제작 페이지 */}
              <Route path="/" element={<ThumbnailPage />} />
              
              {/* 상세페이지 제작 페이지 */}
              <Route path="/detail" element={<DetailPage />} />
            </Routes>
          )}
        </main>

        {/* 하단 푸터 */}
        <Footer />

        {/* 토스트 알림 */}
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

/**
 * WAVA 메인 애플리케이션 컴포넌트
 * 
 * 전체 레이아웃 구성:
 * - Header: 로고와 네비게이션
 * - Main Content: 라우팅된 페이지 컴포넌트
 * - Footer: 저작권 정보 및 링크
 */
export default function App() {
  return (
    <ApiKeyProvider>
      <AppContent />
    </ApiKeyProvider>
  );
}