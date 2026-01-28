/**
 * 애플리케이션 푸터 컴포넌트
 * WAVA 관련 정보 및 링크를 포함합니다
 */
export function Footer() {
  return (
    <footer className="border-t bg-white py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-600">웨이브A</span>
            
            
          </div>
          
          <div className="flex gap-6">
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Gemini API Key 발급
            </a>
            <span>© 2026 WAVA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}