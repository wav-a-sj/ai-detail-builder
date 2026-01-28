import { useState } from 'react';
import { generateContentWithSmartFallback } from '@/lib/gemini';
import { useApiKeys } from '@/contexts/ApiKeyContext';
import { compressImage } from '@/lib/image';
import type { DetailPageInput, DetailPagePlan, DetailPageSection } from '@/types';

/**
 * ✅ JSON 파싱 실패 대비 유틸 (썸네일 생성 로직과 통일)
 */
function stripCodeFences(text: string) {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
}

function extractLikelyJsonObject(text: string): string | null {
  const match = text.match(/\{[\s\S]*"sections"[\s\S]*\}/); // sections 키가 있는 부분을 찾음
  return match ? match[0] : null;
}

/**
 * 상세페이지 기획을 위한 커스텀 훅
 * Gemini API (@google/genai)를 사용하여 상품 상세페이지 구조를 기획합니다
 */
export function useDetailPlanning() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DetailPagePlan | null>(null);
  const { apiKey } = useApiKeys();

  // File 객체를 Gemini API용 Part 객체로 변환 (리사이즈/압축 적용)
  const fileToGenerativePart = async (file: File) => {
    try {
      // 1024px, 품질 0.8로 압축
      const base64Data = await compressImage(file, 1024, 0.8);
      return {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg', // compressImage는 항상 jpeg 반환
        },
      };
    } catch (e) {
      console.warn('Image compression failed, falling back to original', e);
      // 압축 실패 시 원본 사용 (기존 로직)
      return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
          resolve({
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };

  /**
   * AI 상품 특징(USP) 자동 추천 함수
   */
  const generateFeatures = async (productName: string): Promise<string> => {
    try {
      if (!apiKey) throw new Error('Gemini API 키가 필요합니다.');

      const systemInstruction = `
당신은 베테랑 마케터입니다.
상품명을 분석하여 소비자가 매력을 느낄만한 핵심 특징(USP) 3~5가지를 한 문단으로 자연스럽게 요약해 주세요.
한국어로 작성하고, 구체적이고 설득력 있게 표현하세요.
`;
      const prompt = `상품명: "${productName}"`;

      const contents = [
        { role: 'user', parts: [{ text: prompt }] },
      ];
      
      const text = await generateContentWithSmartFallback(
        apiKey,
        contents,
        systemInstruction, // systemInstruction 분리
        undefined
        // modelQueueOverride 제거 -> 전역 설정 따름
      );
      return (text || '').trim();
    } catch (err) {
      console.error('Feature generation failed:', err);
      throw new Error('상품 특징 추천에 실패했습니다.');
    }
  };

  /**
   * 상세페이지 기획 생성 함수
   */
  const generatePlan = async (input: DetailPageInput) => {
    setIsLoading(true);
    setError(null);
    setPlan(null);

    try {
      // API 키 확인
      if (!apiKey) throw new Error('Gemini API 키가 필요합니다.');

      // 페이지 길이에 따른 섹션 수 결정
      const sectionCounts = {
        auto: 7,
        short: 5,
        standard: 7,
        long: 9,
      };
      const targetSections = sectionCounts[input.pageLength];

      // 원본 이미지 처리
      let imagePart = null;
      if (input.originalImages && input.originalImages.length > 0) {
        // 첫 번째 이미지를 대표 이미지로 사용하여 컨텍스트 제공
        imagePart = await fileToGenerativePart(input.originalImages[0]);
      }

      // 시스템 지침 (강력한 규칙)
      const systemInstruction = `
당신은 한국 이커머스 전문 상세페이지 기획자입니다.

**기획 요구사항:**
1. **Constraint (필수):** 모든 섹션의 Title과 Key Message는 **무조건 '한글(Korean)'**로 작성되어야 합니다. 영어를 최대한 배제하세요.
2. **섹션 구성:** 총 ${targetSections}개 섹션으로 구성하세요. (Hook → Solution → 핵심 가치 제안 → 기능 설명 → 신뢰 구축 → 비교/차별점 → CTA 순서)
3. **포맷:** 각 섹션은 9:16 비율의 세로형 이미지로 구현됩니다.
4. **이미지 생성 프롬프트(visualPrompt) 작성 지침:** 
   - DALL-E 3가 원본 제품을 왜곡 없이 그려낼 수 있도록 아주 상세하게(색상, 소재, 형태, 로고 등) 영어(English)로 묘사하세요.
   - "High quality ecommerce product photography", "Professional lighting" 등의 키워드를 포함하세요.
   - **인물 모델이 필요한 경우, 반드시 'Korean model'로 명시하세요.**
   - 텍스트는 이미지에 포함하지 마세요 (No text).

**출력 형식 (JSON Only):**
{
  "sections": [
    {
      "title": "섹션 제목 (무조건 한국어)",
      "keyMessage": "핵심 메시지/카피 (무조건 한국어, 20자 이내)",
      "visualPrompt": "이미지 생성을 위한 상세한 영문 프롬프트 (English). 인물 등장 시 'Korean model' 필수 포함."
    }
  ]
}
`;

      const userPrompt = `
**상품 정보:**
- 상품명: ${input.productName}
- 카테고리: ${input.category}
- 가격: ${input.price.toLocaleString()}원
- 프로모션: ${input.promotionInfo || '없음'}
- 특징: ${input.features}
- 타겟 고객: ${input.targetAudience.join(', ')}

${imagePart ? '첨부된 상품 이미지를 분석하여 이를 반영해 기획해주세요.' : '상품 정보를 바탕으로 기획해주세요.'}
위 상품 정보를 바탕으로 상세페이지 구조를 기획해주세요. JSON 형식만 출력하세요.
`;

      // Gemini API 호출 (Vision 지원)
      const parts: any[] = [{ text: userPrompt }];
      if (imagePart) parts.push(imagePart);
      
      const contents = [
        { role: 'user', parts },
      ];

      const text = await generateContentWithSmartFallback(
        apiKey,
        contents,
        systemInstruction,
        undefined,
        {
          responseMimeType: 'application/json',
          // modelQueueOverride 제거 -> 전역 설정 따름 (일관성 확보)
        }
      );

      // JSON 파싱 (강화된 로직)
      let parsedData;
      try {
        // 1차 시도: Clean & Parse
        const cleanedText = stripCodeFences(text);
        parsedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.warn('1차 JSON 파싱 실패, 복구 시도:', parseError);
        try {
            // 2차 시도: JSON 객체 추출
            const cleanedText = stripCodeFences(text);
            const jsonChunk = extractLikelyJsonObject(cleanedText);
            if (!jsonChunk) throw new Error('JSON 구조를 찾을 수 없습니다.');
            parsedData = JSON.parse(jsonChunk);
        } catch (retryError) {
             console.error('JSON 파싱 최종 실패:', text);
             throw new Error('AI 응답(JSON) 파싱 실패');
        }
      }

      // 섹션 데이터 변환
      if (!parsedData.sections || !Array.isArray(parsedData.sections)) {
          throw new Error('응답에 sections 배열이 없습니다.');
      }

      const sections: DetailPageSection[] = parsedData.sections.map(
        (section: any, index: number) => ({
          id: `section-${index + 1}`,
          title: section.title,
          keyMessage: section.keyMessage,
          visualPrompt: section.visualPrompt,
          order: index + 1,
        })
      );

      const detailPlan: DetailPagePlan = {
        sections,
        totalSections: sections.length,
        timestamp: new Date(),
      };

      setPlan(detailPlan);
      return detailPlan;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '상세페이지 기획 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 섹션 수정 함수
   */
  const updateSection = (sectionId: string, updates: Partial<DetailPageSection>) => {
    if (!plan) return;

    const updatedSections = plan.sections.map((section) =>
      section.id === sectionId ? { ...section, ...updates } : section
    );

    setPlan({
      ...plan,
      sections: updatedSections,
    });
  };

  /**
   * 상태 초기화
   */
  const reset = () => {
    setIsLoading(false);
    setError(null);
    setPlan(null);
  };

  return {
    generatePlan,
    generateFeatures,
    updateSection,
    reset,
    isLoading,
    error,
    plan,
  };
}
