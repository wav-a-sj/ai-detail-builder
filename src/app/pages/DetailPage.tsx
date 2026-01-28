import { useState } from 'react';
import { DetailPlanner } from '@/features/detail-page/DetailPlanner';
import { DetailGenerator } from '@/features/detail-page/DetailGenerator';
import { DetailViewer } from '@/features/detail-page/DetailViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import type { DetailPagePlan, DetailPageSection } from '@/types';

/**
 * 상세페이지 제작 페이지
 */
export function DetailPage() {
  const [plan, setPlan] = useState<DetailPagePlan | null>(null);
  const [productName, setProductName] = useState('');
  const [currentTab, setCurrentTab] = useState('plan');
  const [resultSections, setResultSections] = useState<DetailPageSection[]>([]);

  // 기획 완료 핸들러
  const handlePlanGenerated = (newPlan: DetailPagePlan, name: string) => {
    setPlan(newPlan);
    setProductName(name);
    setCurrentTab('generate');
  };

  // 결과 보기 핸들러
  const handleViewResults = () => {
    setCurrentTab('result');
  };

  // 초기화 핸들러
  const handleReset = () => {
    setPlan(null);
    setProductName('');
    setCurrentTab('plan');
    setResultSections([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">상세페이지 제작</h2>
          
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="plan">1. 기획</TabsTrigger>
            <TabsTrigger value="generate" disabled={!plan}>
              2. 생성
            </TabsTrigger>
            <TabsTrigger value="result" disabled={resultSections.length === 0}>
              3. 결과
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan">
            <DetailPlanner onPlanGenerated={handlePlanGenerated} />
          </TabsContent>

          <TabsContent value="generate">
            {plan && (
              <DetailGenerator
                plan={plan}
                productName={productName}
                onViewResults={handleViewResults}
                onGenerateComplete={setResultSections}
              />
            )}
          </TabsContent>

          <TabsContent value="result">
            {resultSections.length > 0 && (
              <DetailViewer
                sections={resultSections}
                productName={productName}
                onReset={handleReset}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
