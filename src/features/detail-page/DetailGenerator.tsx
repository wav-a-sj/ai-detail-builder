import { Wand2, Eye } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { SectionEditor } from './SectionEditor';
import { useDetailPlanning } from '@/hooks/useDetailPlanning';
import { useDetailImageGeneration } from '@/hooks/useDetailImageGeneration';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { LoadingSpinner } from '@/app/components/common/LoadingSpinner';
import { ErrorMessage } from '@/app/components/common/ErrorMessage';
import { toast } from 'sonner';
import type { DetailPagePlan, DetailPageSection } from '@/types';

interface DetailGeneratorProps {
  plan: DetailPagePlan;
  productName: string;
  onViewResults: () => void;
  onGenerateComplete: (sections: DetailPageSection[]) => void;
}

/**
 * 상세페이지 이미지 생성 컴포넌트
 */
export function DetailGenerator({ plan, productName, onViewResults, onGenerateComplete }: DetailGeneratorProps) {
  const { updateSection } = useDetailPlanning();
  const { generateAllImages, progress, error } = useDetailImageGeneration();
  const { openaiApiKey } = useApiKey();

  const handleGenerate = async () => {
    if (!openaiApiKey) {
        toast.error('이미지 생성을 위해 OpenAI API 키가 필요합니다. 설정에서 키를 등록해주세요.');
        return;
    }

    try {
      const results = await generateAllImages(plan.sections, productName, openaiApiKey); // API Key 전달
      onGenerateComplete(results);
      toast.success('모든 이미지가 생성되었습니다!');
    } catch (err) {
      toast.error('이미지 생성 중 오류가 발생했습니다.');
    }
  };

  const isGenerating = progress.status === 'generating';
  const isCompleted = progress.status === 'completed';
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 기획 확인 및 수정 */}
      <Card>
        <CardHeader>
          <CardTitle>기획안 확인 및 수정</CardTitle>
          <p className="text-sm text-slate-600">
            총 {plan.totalSections}개 섹션 • 각 섹션을 클릭하여 수정할 수 있습니다
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              onUpdate={updateSection}
            />
          ))}
        </CardContent>
      </Card>

      {/* 이미지 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            이미지 생성
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isGenerating && !isCompleted && !error && (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">
                기획안을 확인하고 이미지 생성을 시작하세요
              </p>
              <Button onClick={handleGenerate} size="lg">
                <Wand2 className="w-4 h-4 mr-2" />
                전체 이미지 생성 시작
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4">
              <LoadingSpinner message={progress.message} />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">진행률</span>
                  <span className="font-medium">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <Progress value={progressPercent} />
              </div>
            </div>
          )}

          {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

          {isCompleted && (
            <div className="text-center py-8 space-y-4">
              <div className="text-green-600 text-lg font-semibold">
                ✅ 모든 이미지 생성 완료!
              </div>
              <p className="text-slate-600">
                {plan.totalSections}개의 이미지가 생성되었습니다
              </p>
              <Button onClick={onViewResults} size="lg">
                <Eye className="w-4 h-4 mr-2" />
                생성 결과 보기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
