import { useState, useMemo } from 'react';
import { Download, Sparkles, Upload, ImageIcon, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent } from '@/app/components/ui/card';
import { ErrorMessage } from '@/app/components/common/ErrorMessage';
import { useThumbnailGeneration } from '@/hooks/useThumbnailGeneration';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { downloadImage } from '@/lib/download';
import { toast } from 'sonner';
import type { ImageStyle, ImageModel, AspectRatio } from '@/types';

/**
 * 썸네일 생성기 메인 컴포넌트
 */
export function ThumbnailGenerator() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mainCopy, setMainCopy] = useState('');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('clean');
  const [imageModel] = useState<ImageModel>('nanobanana'); // Fixed for now
  const [additionalRequest, setAdditionalRequest] = useState('');
  
  // 비율 관련 상태
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [customWidth, setCustomWidth] = useState<number>(1024);
  const [customHeight, setCustomHeight] = useState<number>(1024);

  const { generate, reset, isLoading, error, result, progress } = useThumbnailGeneration();
  const { hasApiKey } = useApiKey();

  // 최종 치수 계산
  const dimensions = useMemo(() => {
    if (aspectRatio === '1:1') return { width: 1024, height: 1024, label: '1:1' };
    if (aspectRatio === '9:16') return { width: 768, height: 1344, label: '9:16' };
    if (aspectRatio === '16:9') return { width: 1344, height: 768, label: '16:9' };
    return { width: customWidth, height: customHeight, label: 'Custom' };
  }, [aspectRatio, customWidth, customHeight]);

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      setOriginalImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success('이미지가 업로드되었습니다.');
    }
  };

  // 썸네일 생성 핸들러 (통합)
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mainCopy.trim()) {
      toast.error('메인 카피를 입력해주세요.');
      return;
    }

    if (!hasApiKey) {
      toast.error('AI 기획을 위해 Gemini API 키가 필요합니다. 설정에서 키를 등록해주세요.');
      return;
    }

    // Custom 크기 유효성 검사
    if (aspectRatio === 'custom') {
      if (customWidth < 256 || customWidth > 2048) {
        toast.error('너비는 256px ~ 2048px 사이여야 합니다.');
        return;
      }
      if (customHeight < 256 || customHeight > 2048) {
        toast.error('높이는 256px ~ 2048px 사이여야 합니다.');
        return;
      }
    }

    try {
      await generate({
        originalImage: originalImage || undefined,
        mainCopy: mainCopy.trim(),
        imageStyle,
        imageModel,
        additionalRequest: additionalRequest.trim() || undefined,
        aspectRatio,
        width: dimensions.width,
        height: dimensions.height,
      });
      toast.success('썸네일이 생성되었습니다!');
    } catch (err) {
      toast.error('생성에 실패했습니다.');
    }
  };

  const handleDownload = async () => {
    if (result?.imageUrl) {
      try {
        const filename = `thumbnail-${mainCopy.slice(0, 20)}-${Date.now()}.png`;
        toast.info('다운로드를 시작합니다...');
        await downloadImage(result.imageUrl, filename);
        toast.success('다운로드가 완료되었습니다.');
      } catch (error) {
        toast.error('다운로드 중 오류가 발생했습니다.');
      }
    }
  };

  const handleReset = () => {
    reset();
    setOriginalImage(null);
    setImagePreview(null);
    setMainCopy('');
    setImageStyle('clean');
    setAdditionalRequest('');
    // 비율은 초기화하지 않거나 기본값으로
    setAspectRatio('1:1');
    setCustomWidth(1024);
    setCustomHeight(1024);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 왼쪽: 입력 폼 */}
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* 1. 원본 이미지 업로드 */}
              <div className="space-y-3">
                <Label htmlFor="originalImage" className="text-base">
                  1. 원본 이미지 업로드 (선택)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative w-full flex justify-center bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="미리보기"
                          className="h-48 object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOriginalImage(null);
                          setImagePreview(null);
                        }}
                        className="w-full"
                      >
                        이미지 제거
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="originalImage"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        클릭하여 이미지 업로드
                      </p>
                      <p className="text-xs text-gray-400">JPG, PNG (최대 5MB)</p>
                      <Input
                        id="originalImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isLoading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 2. 메인 카피 입력 */}
              <div className="space-y-3">
                <Label htmlFor="mainCopy" className="text-base">
                  2. 상품명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mainCopy"
                  value={mainCopy}
                  onChange={(e) => setMainCopy(e.target.value)}
                  placeholder="예: 프리미엄 무선 이어폰"
                  disabled={isLoading}
                  required
                  className="h-12 rounded-lg shadow-sm"
                />
              </div>

              {/* 3. 이미지 비율 및 크기 */}
              <div className="space-y-3">
                <Label className="text-base">3. 이미지 비율 및 크기</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['1:1', '9:16', '16:9', 'custom'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      disabled={isLoading}
                      className={`py-2 px-1 rounded-lg border text-sm transition-all font-medium ${
                        aspectRatio === ratio
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {ratio === 'custom' ? 'Custom' : ratio}
                    </button>
                  ))}
                </div>
                
                {/* Custom 크기 입력 */}
                {aspectRatio === 'custom' && (
                  <div className="flex gap-3 mt-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="customWidth" className="text-xs text-slate-500">너비 (px)</Label>
                        <Input
                            id="customWidth"
                            type="number"
                            min={256}
                            max={2048}
                            value={customWidth}
                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                            disabled={isLoading}
                            className="h-9"
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="customHeight" className="text-xs text-slate-500">높이 (px)</Label>
                        <Input
                            id="customHeight"
                            type="number"
                            min={256}
                            max={2048}
                            value={customHeight}
                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                            disabled={isLoading}
                            className="h-9"
                        />
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                   최종 해상도: {dimensions.width} x {dimensions.height}px
                </p>
              </div>

              {/* 4. 스타일 선택 */}
              <div className="space-y-3">
                <Label className="text-base">4. 스타일 선택</Label>
                <div className="flex gap-3">
                  {(['clean', 'lifestyle', 'creative'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setImageStyle(style)}
                      disabled={isLoading}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                        imageStyle === style
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {style === 'clean' && 'Clean'}
                      {style === 'lifestyle' && 'Lifestyle'}
                      {style === 'creative' && 'Creative'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. 추가 요청사항 */}
              <div className="space-y-3">
                <Label htmlFor="additionalRequest" className="text-base">
                  5. 추가 요청사항 (선택)
                </Label>
                <Textarea
                  id="additionalRequest"
                  value={additionalRequest}
                  onChange={(e) => setAdditionalRequest(e.target.value)}
                  placeholder="예: 배경을 노란색으로 해줘"
                  rows={3}
                  disabled={isLoading}
                  className="rounded-lg shadow-sm resize-none"
                />
              </div>

              {/* 통합 생성 버튼 */}
              <Button 
                type="submit" 
                className="w-full h-14 text-lg bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-md flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI가 열심히 작업 중... {progress}%</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>썸네일 생성하기</span>
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-slate-500 mt-2">
                 Gemini 기획 + Replicate 생성 (ControlNet/SDXL)
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 오른쪽: 결과 확인 */}
      <div className="space-y-6">
        <Card className="border-0 shadow-sm h-full">
          <CardContent className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#2563EB]" />
              생성 결과
            </h3>

            {/* 초기 상태 */}
            {!isLoading && !error && !result && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-gray-50 min-h-[400px]">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-900 font-medium mb-2">
                  아직 생성된 이미지가 없습니다
                </p>
                <p className="text-sm text-gray-500 max-w-xs">
                  왼쪽 폼에서 정보를 입력하고 생성 버튼을 눌러주세요.
                </p>
              </div>
            )}

            {/* 에러 상태 */}
            {error && (
              <ErrorMessage
                message={error}
                onRetry={() => {}} 
              />
            )}

            {/* 로딩 중 (스켈레톤 느낌) */}
            {isLoading && !result && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-white min-h-[400px] space-y-4">
                    {/* 진행률 바 표시 */}
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                           <span>진행률</span>
                           <span>{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 text-center pt-2">
                            {progress < 30 ? '기획안을 분석하고 있습니다...' : '고품질 이미지를 생성하고 있습니다...'}
                        </p>
                    </div>
                </div>
            )}

            {/* 결과 표시 */}
            {result && result.imageUrl && (
              <div className="space-y-6 flex-1 flex flex-col animate-in fade-in duration-500">
                <div 
                  className="relative rounded-lg overflow-hidden border shadow-sm group bg-slate-100 flex items-center justify-center bg-checkered"
                  style={{
                    // 비율에 따라 컨테이너 모양은 유동적이되, 너무 길어지지 않게 max-height 설정
                     aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                     maxHeight: '600px'
                  }}
                >
                  <img
                    src={result.imageUrl}
                    alt="생성된 썸네일"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* 기획 의도 표시 */}
                {result.reasoning && (
                    <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border">
                        <p className="font-semibold mb-1 text-slate-700">💡 AI 기획 포인트</p>
                        <p className="line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                            {result.reasoning}
                        </p>
                    </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-3 mt-auto">
                  <Button 
                    onClick={handleDownload} 
                    className="flex-1 bg-slate-900 hover:bg-slate-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    새로 만들기
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
