import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

/**
 * API 키 디버깅 도구 컴포넌트
 * localStorage에 저장된 API 키 상태를 확인하고 관리합니다
 */
export function ApiKeyDebugger() {
  const { 
    apiKey, clearApiKey, hasApiKey,
    replicateKey, removeReplicateKey, hasKey: hasReplicateKey
  } = useApiKey();
  
  const [showKey, setShowKey] = useState(false);
  const [showReplicateKey, setShowReplicateKey] = useState(false);

  // localStorage에서 직접 읽기
  const storedGeminiKey = localStorage.getItem('gemini_api_key');
  const storedReplicateKey = localStorage.getItem('replicate_api_key');
  
  // API 키 마스킹 처리
  const getMaskedKey = (key: string | null) => {
    if (!key) return 'N/A';
    if (key.length <= 8) return '••••••••';
    return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
  };

  // Gemini API 키 상태 확인
  const getGeminiStatus = () => {
    if (!storedGeminiKey) {
      return {
        status: 'error',
        message: 'API 키가 저장되어 있지 않습니다',
        icon: XCircle,
        color: 'text-red-500',
      };
    }
    if (storedGeminiKey === 'YOUR_API_KEY_HERE') {
      return {
        status: 'warning',
        message: '기본 플레이스홀더 API 키입니다',
        icon: AlertCircle,
        color: 'text-yellow-500',
      };
    }
    if (hasApiKey) {
      return {
        status: 'success',
        message: 'API 키가 정상적으로 저장되어 있습니다',
        icon: CheckCircle2,
        color: 'text-green-500',
      };
    }
    return {
      status: 'warning',
      message: 'API 키가 유효하지 않을 수 있습니다',
      icon: AlertCircle,
      color: 'text-yellow-500',
    };
  };

  // Replicate API 키 상태 확인
  const getReplicateStatus = () => {
    if (!storedReplicateKey) {
      return {
        status: 'default',
        message: '키가 설정되지 않음 (기본 Gemini 이미지 생성 사용)',
        icon: AlertCircle,
        color: 'text-slate-500',
      };
    }
    if (hasReplicateKey) {
      return {
        status: 'success',
        message: 'ControlNet/SDXL 이미지 생성이 활성화되었습니다',
        icon: CheckCircle2,
        color: 'text-green-500',
      };
    }
    return {
      status: 'error',
      message: '키 저장 오류',
      icon: XCircle,
      color: 'text-red-500',
    };
  };

  const geminiStatus = getGeminiStatus();
  const GeminiStatusIcon = geminiStatus.icon;

  const replicateStatus = getReplicateStatus();
  const ReplicateStatusIcon = replicateStatus.icon;

  // 페이지 새로고침
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🔧 API 키 디버깅 도구</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      <Tabs defaultValue="gemini" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gemini">Gemini (필수)</TabsTrigger>
          <TabsTrigger value="replicate">Replicate (이미지)</TabsTrigger>
        </TabsList>

        {/* Gemini 디버거 */}
        <TabsContent value="gemini" className="space-y-3 pt-4">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-md">
            <GeminiStatusIcon className={`w-5 h-5 mt-0.5 ${geminiStatus.color}`} />
            <div className="flex-1">
              <p className="font-medium text-sm">상태</p>
              <p className="text-sm text-slate-600">{geminiStatus.message}</p>
            </div>
          </div>

          <div className="space-y-2 p-3 border rounded-md">
            <p className="text-sm font-medium">📦 키 정보</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">localStorage:</span>
                <span className={storedGeminiKey ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {storedGeminiKey ? '✅ 존재함' : '❌ 없음'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">React Context:</span>
                <span className={hasApiKey ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {hasApiKey ? '✅ 활성' : '❌ 비활성'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">형식 검증:</span>
                <span className="font-mono text-xs">
                  {storedGeminiKey?.startsWith('AIza') ? 'AIza...' : '알 수 없음'}
                </span>
              </div>
            </div>
          </div>

          {storedGeminiKey && (
            <div className="space-y-2 p-3 border rounded-md bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">🔑 저장된 키</p>
                <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="p-2 bg-white rounded border">
                <code className="text-xs font-mono break-all">
                  {showKey ? storedGeminiKey : getMaskedKey(storedGeminiKey)}
                </code>
              </div>
            </div>
          )}

          {storedGeminiKey && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Gemini API 키를 삭제하시겠습니까? 앱 사용이 불가능해집니다.')) {
                  clearApiKey();
                  handleRefresh();
                }
              }}
              className="w-full"
            >
              🗑️ Gemini 키 삭제
            </Button>
          )}
        </TabsContent>

        {/* Replicate 디버거 */}
        <TabsContent value="replicate" className="space-y-3 pt-4">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-md">
            <ReplicateStatusIcon className={`w-5 h-5 mt-0.5 ${replicateStatus.color}`} />
            <div className="flex-1">
              <p className="font-medium text-sm">상태</p>
              <p className="text-sm text-slate-600">{replicateStatus.message}</p>
            </div>
          </div>

          <div className="space-y-2 p-3 border rounded-md">
            <p className="text-sm font-medium">📦 키 정보</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">localStorage:</span>
                <span className={storedReplicateKey ? 'text-green-600 font-medium' : 'text-slate-400 font-medium'}>
                  {storedReplicateKey ? '✅ 존재함' : '⚪ 없음'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">React Context:</span>
                <span className={hasReplicateKey ? 'text-green-600 font-medium' : 'text-slate-400 font-medium'}>
                  {hasReplicateKey ? '✅ 활성' : '⚪ 비활성'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">형식 검증:</span>
                <span className="font-mono text-xs">
                  {storedReplicateKey?.startsWith('r8_') ? 'r8_...' : (storedReplicateKey ? '알 수 없음' : '-')}
                </span>
              </div>
            </div>
          </div>

          {storedReplicateKey && (
            <div className="space-y-2 p-3 border rounded-md bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">🔑 저장된 키</p>
                <Button variant="ghost" size="sm" onClick={() => setShowReplicateKey(!showReplicateKey)}>
                  {showReplicateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="p-2 bg-white rounded border">
                <code className="text-xs font-mono break-all">
                  {showReplicateKey ? storedReplicateKey : getMaskedKey(storedReplicateKey)}
                </code>
              </div>
            </div>
          )}

          {storedReplicateKey && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Replicate API 키를 삭제하시겠습니까?')) {
                  removeReplicateKey();
                  handleRefresh();
                }
              }}
              className="w-full"
            >
              🗑️ Replicate 키 삭제
            </Button>
          )}
        </TabsContent>
      </Tabs>

      {/* 도움말 */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
        <p className="font-medium text-blue-900 mb-1">💡 도움말</p>
        <ul className="text-blue-700 space-y-1 text-xs ml-4 list-disc">
          <li>Gemini 키는 필수입니다.</li>
          <li>Replicate 키가 있으면 ControlNet/SDXL로 고품질 이미지를 생성합니다.</li>
          <li>API 키는 브라우저에만 저장됩니다.</li>
        </ul>
      </div>
    </Card>
  );
}
