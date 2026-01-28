import { useState } from 'react';
import { Lightbulb, ArrowRight, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Card, CardContent } from '@/app/components/ui/card';
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner';
import { ErrorMessage } from '@/app/components/common/ErrorMessage';
import { useDetailPlanning } from '@/hooks/useDetailPlanning';
import { toast } from 'sonner';
import type { PageLength, DetailPagePlan } from '@/types';

interface DetailPlannerProps {
  onPlanGenerated: (plan: DetailPagePlan, productName: string) => void;
}

// 카테고리 옵션 (고정)
const CATEGORIES = [
  '패션/의류',
  '뷰티/화장품',
  '식품/건강',
  '리빙/가전',
  '디지털/컴퓨터',
  '기타',
];

// 성별 옵션
const GENDER_OPTIONS = ['남성', '여성', '전체'] as const;

// 연령대 옵션
const AGE_OPTIONS = ['10대', '20대', '30대', '40대', '50대', '60대'] as const;

// 페이지 길이 옵션
const PAGE_LENGTH_OPTIONS = [
  { value: 'auto', label: 'Auto (AI 자동)', description: 'AI가 최적의 길이를 결정합니다' },
  { value: 'short', label: '5장 (Short)', description: '간결한 구성' },
  { value: 'standard', label: '7장 (Standard)', description: '표준 구성' },
  { value: 'long', label: '9장 (Long)', description: '상세한 구성' },
] as const;

/**
 * 상세페이지 기획 컴포넌트
 */
export function DetailPlanner({ onPlanGenerated }: DetailPlannerProps) {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [promotionInfo, setPromotionInfo] = useState('');
  const [category, setCategory] = useState('');
  const [features, setFeatures] = useState('');
  const [gender, setGender] = useState<string>('전체');
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [pageLength, setPageLength] = useState<PageLength>('auto');
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  
  // features 로딩 상태 별도 관리
  const [isFeatureLoading, setIsFeatureLoading] = useState(false);

  const { generatePlan, generateFeatures, isLoading, error } = useDetailPlanning();

  // 연령대 토글
  const toggleAge = (age: string) => {
    if (selectedAges.includes(age)) {
      setSelectedAges(selectedAges.filter((a) => a !== age));
    } else {
      setSelectedAges([...selectedAges, age]);
    }
  };

  // 이미지 파일 선택
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setOriginalImages(files);
      toast.success(`${files.length}개의 이미지가 업로드되었습니다.`);
    }
  };

  // AI 자동 추천 (USP)
  const handleAutoRecommend = async () => {
    if (!productName.trim()) {
      toast.error('먼저 상품명을 입력해주세요.');
      return;
    }

    setIsFeatureLoading(true);
    try {
      const recommendedFeatures = await generateFeatures(productName);
      setFeatures(recommendedFeatures);
      toast.success('AI가 추천 특징을 입력했습니다!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '특징 추천에 실패했습니다.');
    } finally {
      setIsFeatureLoading(false);
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim() || !category || !features.trim()) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (selectedAges.length === 0) {
      toast.error('타겟 연령대를 최소 1개 이상 선택해주세요.');
      return;
    }

    try {
      const targetAudience = [gender, ...selectedAges];
      
      const plan = await generatePlan({
        productName: productName.trim(),
        category,
        price: price ? parseFloat(price) : undefined,
        promotionInfo: promotionInfo.trim() || undefined,
        features: features.trim(),
        targetAudience,
        originalImages,
        pageLength,
      });

      toast.success('상세페이지 기획이 완료되었습니다!');
      onPlanGenerated(plan, productName.trim());
    } catch (err) {
      toast.error('상세페이지 기획에 실패했습니다.');
    }
  };

  return (
    <Card className="w-full border-0 shadow-sm">
      <CardContent className="p-8">
        {isLoading ? (
          <LoadingSpinner message="AI가 상세페이지를 기획하고 있습니다..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => handleSubmit(new Event('submit') as any)} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 섹션 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#2563EB]" />
                기본 정보
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">
                    상품명 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="예: 프리미엄 무선 이어폰"
                    required
                    className="h-11 rounded-lg shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    카테고리 <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="h-11 rounded-lg shadow-sm">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    가격 (원)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="예: 89000 (선택사항)"
                    className="h-11 rounded-lg shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promotionInfo">프로모션 정보</Label>
                  <Input
                    id="promotionInfo"
                    value={promotionInfo}
                    onChange={(e) => setPromotionInfo(e.target.value)}
                    placeholder="예: 오늘만 1+1"
                    className="h-11 rounded-lg shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* 상품 특징 (USP) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="features">
                  상품 특징 (USP) <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoRecommend}
                  disabled={isFeatureLoading || !productName.trim()}
                  className="rounded-lg"
                >
                  {isFeatureLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">분석 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI 자동 추천
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="features"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="예: 최신 ANC 기술, 20시간 배터리, IPX7 방수, 프리미엄 사운드"
                rows={4}
                required
                className="rounded-lg shadow-sm resize-none"
              />
            </div>

            {/* 타겟 설정 섹션 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">타겟 설정</h3>

              {/* 성별 */}
              <div className="space-y-3">
                <Label>성별</Label>
                <div className="flex gap-3">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 px-4 rounded-lg border-2 transition-all font-medium ${
                        gender === g
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* 연령 */}
              <div className="space-y-3">
                <Label>
                  연령 <span className="text-red-500">*</span> (다중 선택 가능)
                </Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {AGE_OPTIONS.map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => toggleAge(age)}
                      className={`py-2.5 px-4 rounded-lg border-2 transition-all font-medium ${
                        selectedAges.includes(age)
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 레퍼런스 이미지 - 모델 선택 섹션 삭제됨 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">이미지</h3>

              {/* 이미지 업로드 */}
              <div className="space-y-3">
                <Label htmlFor="originalImages">레퍼런스 이미지</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                  <label htmlFor="originalImages" className="flex flex-col items-center cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      {originalImages.length > 0
                        ? `${originalImages.length}개 파일 선택됨`
                        : '클릭하여 이미지 업로드'}
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG (다중 선택 가능)</p>
                    <Input
                      id="originalImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 상세페이지 길이 (카드 UI) */}
            <div className="space-y-4">
              <Label>상세페이지 길이 (구조)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PAGE_LENGTH_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPageLength(option.value as PageLength)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      pageLength === option.value
                        ? 'border-[#2563EB] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <h4
                      className={`font-semibold mb-1 ${ pageLength === option.value ? 'text-[#2563EB]' : 'text-gray-900' } text-center`}
                    >
                      {option.label}
                    </h4>
                    <p
                      className={`text-xs ${ pageLength === option.value ? 'text-blue-600' : 'text-gray-500' } text-center`}
                    >
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 기획 생성 버튼 */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg shadow-sm"
              size="lg"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              상세페이지 기획 생성
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
