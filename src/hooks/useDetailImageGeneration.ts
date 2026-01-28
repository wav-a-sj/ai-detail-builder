import { useState } from 'react';
import { getGenAI, checkApiKey } from '@/lib/gemini';
import { generateImageStandard } from '@/lib/replicate';
import { useApiKeys } from '@/contexts/ApiKeyContext';
import type { DetailPageSection, GenerationProgress } from '@/types';

/**
 * 상세페이지 이미지 생성을 위한 커스텀 훅
 * 텍스트/기획: Gemini API (gemini-3-pro-preview)
 * 이미지 생성: Replicate (SDXL)
 */
export function useDetailImageGeneration() {
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    status: 'idle',
  });
  const [generatedSections, setGeneratedSections] = useState<DetailPageSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Replicate API Key
  const { replicateKey } = useApiKeys();

  /**
   * 단일 섹션 이미지 생성
   */
  const generateSectionImage = async (
    section: DetailPageSection,
    productName: string
  ): Promise<DetailPageSection> => {
    try {
      checkApiKey(); // Gemini Key 확인
      const ai = getGenAI();
      if (!ai) {
        throw new Error('Gemini API 클라이언트가 초기화되지 않았습니다.');
      }

      if (!replicateKey) {
        throw new Error('이미지 생성을 위해 Replicate API Token이 필요합니다. 설정 메뉴에서 키를 등록해주세요.');
      }

      // 1. Gemini가 생성한 시각적 묘사(visualPrompt)
      const visualPrompt = section.visualPrompt;
      
      // Korean model 및 고품질 이커머스 스타일 키워드 주입
      const fullPrompt = `
      Product photography of ${productName}. ${visualPrompt}. 
      Style: High quality ecommerce product photography, Professional studio lighting, 8k resolution.
      Subject: Korean model if person is shown.
      Negative: Text, Typography, Logo, Watermark, Distorted, Blurry, Low quality.
      `.replace(/\s+/g, ' ').trim();
      
      // P0-3: 프롬프트 길이 제한 (Replicate 요청 안정화)
      const safePrompt = fullPrompt.slice(0, 2000);

      // 2. 이미지 생성 (Replicate SDXL)
      // 상세페이지는 각 섹션마다 다른 이미지를 생성해야 하므로 ControlNet보다는
      // 텍스트 기반의 고품질 생성이 더 적합할 수 있음. 
      // (만약 원본 이미지를 계속 유지해야 한다면 로직 변경 필요하지만, 
      // 현재 기획상 섹션별 연출 이미지가 필요하므로 SDXL 사용)
      let imageUrl = '';
      try {
        imageUrl = await generateImageStandard(replicateKey, safePrompt);
        if (!imageUrl) {
            throw new Error('Replicate 이미지 데이터가 없습니다.');
        }
      } catch (imageGenError: any) {
          console.error('이미지 생성 최종 실패:', imageGenError);
          throw imageGenError;
      }

      return {
        ...section,
        imageUrl: imageUrl,
      };
    } catch (err) {
      console.error('이미지 생성 실패:', section.id, err);
      throw err;
    }
  };

  /**
   * 모든 섹션 이미지 생성 (순차적)
   * @param sections 생성할 섹션 목록
   * @param productName 상품명
   */
  const generateAllImages = async (sections: DetailPageSection[], productName: string) => {
    setError(null);
    setProgress({
      current: 0,
      total: sections.length,
      status: 'generating',
      message: '이미지 생성을 시작합니다... (Replicate SDXL)',
    });

    const results: DetailPageSection[] = [];

    try {
      // API 키 체크
      if (!replicateKey) {
        throw new Error('이미지 생성을 위해 Replicate API Token이 필요합니다. 설정 메뉴에서 키를 등록해주세요.');
      }

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        setProgress({
          current: i + 1,
          total: sections.length,
          status: 'generating',
          message: `${section.title} 이미지 생성 중... (${i + 1}/${sections.length})`,
        });

        // 에러 발생 시 여기서 즉시 catch 블록으로 이동하여 중단됨
        const generatedSection = await generateSectionImage(section, productName);
        
        results.push(generatedSection);
        setGeneratedSections([...results]);
      }

      setProgress({
        current: sections.length,
        total: sections.length,
        status: 'completed',
        message: '모든 이미지가 생성되었습니다!',
      });

      return results;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      setProgress({
        current: results.length,
        total: sections.length,
        status: 'error',
        message: errorMessage,
      });
      throw err;
    }
  };

  /**
   * 상태 초기화
   */
  const reset = () => {
    setProgress({
      current: 0,
      total: 0,
      status: 'idle',
    });
    setGeneratedSections([]);
    setError(null);
  };

  return {
    generateAllImages,
    reset,
    progress,
    generatedSections,
    error,
  };
}
