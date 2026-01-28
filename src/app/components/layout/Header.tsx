import { Link, useLocation } from 'react-router';
import { Settings, Bug } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useApiKey } from '@/contexts/ApiKeyContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { ApiKeySetup } from '@/app/components/common/ApiKeySetup';
import { ApiKeyDebugger } from '@/app/components/common/ApiKeyDebugger';

/**
 * 애플리케이션 헤더 컴포넌트
 * WAVA 로고와 네비게이션 링크를 포함합니다
 */
export function Header() {
  const location = useLocation();
  const { hasApiKey } = useApiKey();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="https://cdn.imweb.me/upload/S20251125de354b8205da7/aec9550d8ff37.png" 
              alt="WAVA Logo" 
              className="h-8"
            />
            <span className="font-bold text-slate-2000 text-[24px]">웨이브A</span>
          </Link>

          {/* 네비게이션 및 설정 */}
          <div className="flex items-center gap-4">
            <nav className="flex gap-6">
              <Link
                to="/"
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >썸네일 제작</Link>
              <Link
                to="/detail"
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/detail')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                상세페이지 제작
              </Link>
            </nav>

            {/* API 키 설정 버튼 */}
            {hasApiKey && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    API 키 관리
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="sr-only">
                    <DialogTitle>API 키 관리</DialogTitle>
                    <DialogDescription>
                      Gemini API 키를 관리할 수 있습니다
                    </DialogDescription>
                  </DialogHeader>
                  <ApiKeySetup />
                </DialogContent>
              </Dialog>
            )}

            {/* API 키 디버거 버튼 */}
            {hasApiKey && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bug className="w-4 h-4 mr-2" />
                    API 키 디버거
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="sr-only">
                    <DialogTitle>API 키 디버거</DialogTitle>
                    <DialogDescription>
                      Gemini API 키를 디버그할 수 있습니다
                    </DialogDescription>
                  </DialogHeader>
                  <ApiKeyDebugger />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}