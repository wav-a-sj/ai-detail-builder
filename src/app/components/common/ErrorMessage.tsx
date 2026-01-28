import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/**
 * 에러 메시지 컴포넌트
 * API 호출 실패 등의 에러 상황에 표시됩니다
 */
export function ErrorMessage({ 
  title = '오류가 발생했습니다', 
  message, 
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-red-50 rounded-lg border border-red-200">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
        <p className="text-sm text-red-700 whitespace-pre-line">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
