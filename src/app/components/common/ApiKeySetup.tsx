import { AlertCircle, ExternalLink, Key, Check, X, Eye, EyeOff, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * API 키 설정 안내 컴포넌트
 */
export function ApiKeySetup() {
  const { 
    apiKey: geminiKey, setApiKey: setGeminiKey, clearApiKey: clearGeminiKey, hasApiKey: hasGeminiKey,
    replicateKey, saveReplicateKey, removeReplicateKey, hasKey: hasReplicateKey
  } = useApiKey();
  
  const [geminiInput, setGeminiInput] = useState('');
  const [replicateInput, setReplicateInput] = useState('');
  
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showReplicateKey, setShowReplicateKey] = useState(false);
  
  const [isEditing, setIsEditing] = useState(!hasGeminiKey);

  /**
   * Gemini API 키 저장
   */
  const handleSaveGemini = () => {
    if (!geminiInput.trim()) {
      toast.error('Gemini API 키를 입력해주세요.');
      return;
    }

    if (!geminiInput.startsWith('AIza')) {
      toast.error('올바른 Google Gemini API 키 형식이 아닙니다. API 키는 "AIza"로 시작해야 합니다.');
      return;
    }

    setGeminiKey(geminiInput.trim());
    setGeminiInput('');
    // Gemini 키가 저장되면 편집 모드 종료 (필수 키이므로)
    setIsEditing(false);
    toast.success('Gemini API 키가 성공적으로 저장되었습니다!');
  };

  /**
   * Replicate API 키 저장
   */
  const handleSaveReplicate = () => {
    if (!replicateInput.trim()) {
      toast.error('Replicate API Token을 입력해주세요.');
      return;
    }

    if (!replicateInput.startsWith('r8_')) {
      toast.warning('Replicate API Token은 보통 "r8_"로 시작합니다. 확인 후 입력해주세요.');
    }

    saveReplicateKey(replicateInput.trim());
    setReplicateInput('');
    toast.success('Replicate API Token이 저장되었습니다! (이미지 생성에 사용됨)');
  };

  /**
   * Gemini API 키 삭제
   */
  const handleClearGemini = () => {
    clearGeminiKey();
    setGeminiInput('');
    setIsEditing(true);
    toast.success('Gemini API 키가 삭제되었습니다.');
  };

  /**
   * Replicate API 키 삭제
   */
  const handleClearReplicate = () => {
    removeReplicateKey();
    setReplicateInput('');
    toast.success('Replicate API Token이 삭제되었습니다.');
  };

  /**
   * API 키 마스킹 표시
   */
  const getMaskedKey = (key: string) => {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 6)}${'*'.repeat(key.length - 10)}${key.substring(key.length - 4)}`;
  };

  // API 키가 이미 설정되어 있고 수정 모드가 아닌 경우 (카드 형태의 요약 화면)
  if (hasGeminiKey && !isEditing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">API 키 설정 완료</CardTitle>
                  <CardDescription className="mt-1">
                    WAVA를 사용할 준비가 되었습니다
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                설정 관리
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">연결됨</AlertTitle>
              <AlertDescription className="text-green-800">
                기본 AI 엔진(Gemini)이 연결되었습니다.
                {hasReplicateKey && ' 이미지 생성 엔진(Replicate)도 연결되어 있습니다.'}
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Gemini Key Status */}
              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold flex items-center gap-2">
                    <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" className="w-4 h-4" />
                    Gemini API
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">연결됨</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={showGeminiKey ? geminiKey || '' : getMaskedKey(geminiKey || '')}
                    readOnly
                    className="font-mono text-xs bg-white"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                  >
                    {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Replicate Key Status */}
              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold flex items-center gap-2">
                    <span className="text-lg leading-none">🎨</span>
                    Replicate API
                  </span>
                  {hasReplicateKey ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">연결됨</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded-full font-medium">미설정</span>
                  )}
                </div>
                {hasReplicateKey ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={showReplicateKey ? replicateKey || '' : getMaskedKey(replicateKey || '')}
                      readOnly
                      className="font-mono text-xs bg-white"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setShowReplicateKey(!showReplicateKey)}
                    >
                      {showReplicateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 py-2">
                    ControlNet 이미지 생성을 위해 설정에서 키를 추가하세요.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // API 키 입력/수정 화면 (탭 구조)
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                API 키 설정
              </CardTitle>
              <CardDescription className="text-slate-600">
                WAVA 서비스 사용을 위한 AI 모델 API 키를 관리합니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gemini" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="gemini">Google Gemini (필수)</TabsTrigger>
              <TabsTrigger value="replicate">Replicate (이미지)</TabsTrigger>
            </TabsList>

            {/* Gemini 탭 */}
            <TabsContent value="gemini" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">Gemini API 키</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gemini-key"
                      type={showGeminiKey ? 'text' : 'password'}
                      placeholder="AIza..."
                      value={geminiInput}
                      onChange={(e) => setGeminiInput(e.target.value)}
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                    >
                      {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">
                    기획 및 텍스트 생성에 사용되는 필수 API 키입니다.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveGemini} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    {hasGeminiKey ? '수정사항 저장' : '저장 및 시작하기'}
                  </Button>
                  {hasGeminiKey && (
                    <Button variant="destructive" onClick={handleClearGemini}>
                      <X className="w-4 h-4 mr-2" />
                      삭제
                    </Button>
                  )}
                </div>
              </div>

              {/* 안내 메시지 */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>무료 발급 안내</AlertTitle>
                <AlertDescription className="mt-2">
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Google AI Studio에서 키 발급받기
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Replicate 탭 */}
            <TabsContent value="replicate" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="replicate-key">Replicate API Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="replicate-key"
                      type={showReplicateKey ? 'text' : 'password'}
                      placeholder="r8_..."
                      value={replicateInput}
                      onChange={(e) => setReplicateInput(e.target.value)}
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowReplicateKey(!showReplicateKey)}
                    >
                      {showReplicateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">
                    ControlNet을 사용한 고품질 이미지 생성에 사용됩니다.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveReplicate} className="flex-1" variant="secondary">
                    <Check className="w-4 h-4 mr-2" />
                    Replicate 키 저장
                  </Button>
                  {hasReplicateKey && (
                    <Button variant="destructive" onClick={handleClearReplicate}>
                      <X className="w-4 h-4 mr-2" />
                      삭제
                    </Button>
                  )}
                </div>
              </div>

              {/* 안내 메시지 */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Replicate API 안내</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Replicate 토큰을 등록하면 ControlNet 모델을 사용하여 원본 형태를 유지한 이미지를 생성합니다.</p>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto mt-2">
                    <a
                      href="https://replicate.com/account/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Replicate에서 토큰 발급받기
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* 하단 닫기 버튼 (편집 모드일 때만 표시) */}
          {hasGeminiKey && isEditing && (
            <div className="mt-6 pt-6 border-t flex justify-end">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                닫기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
