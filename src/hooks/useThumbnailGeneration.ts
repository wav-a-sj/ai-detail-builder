import { useState, useRef } from 'react';
import { generateContentWithSmartFallback } from '@/lib/gemini';
import { generateImageWithControlNet, generateImageStandard } from '@/lib/replicate';
import { useApiKeys } from '@/contexts/ApiKeyContext';
import { compressImage } from '@/lib/image';
import type { ThumbnailInput, ThumbnailResult } from '@/types';

/**
 * ✅ JSON 파싱 실패 대비 유틸
 */
function stripCodeFences(text: string) {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
}

function extractLikelyJsonObject(text: string): string | null {
  const match = text.match(/\{[\s\S]*"prompt"[\s\S]*\}/);
  return match ? match[0] : null;
}

function extractJsonStringField(text: string, fieldName: string): string | null {
  const re = new RegExp(`"${fieldName}"\\s*:\\s*"([\\s\\S]*?)"\\s*(,|\\})`);
  const m = text.match(re);
  if (!m?.[1]) return null;

  try {
    return JSON.parse(`"${m[1].replace(/"/g, '\\"')}"`);
  } catch {
    return m[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
  }
}

/**
 * 썸네일 생성을 위한 커스텀 훅
 */
export function useThumbnailGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ThumbnailResult | null>(null);
  const [progress, setProgress] = useState(0);
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const { replicateKey, apiKey } = useApiKeys();

  // File 객체를 Gemini API용 Part 객체로 변환 (압축 적용)
  const fileToGenerativePart = async (file: File) => {
    try {
      // 1024px, 품질 0.8로 압축
      const base64Data = await compressImage(file, 1024, 0.8);
      return {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      };
    } catch (e) {
      console.warn('Image compression failed, falling back to original', e);
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
   * File 객체를 Data URI 문자열로 변환 (Replicate 전송용)
   * 여기서는 Replicate가 대용량도 어느정도 처리하므로 원본을 보내거나, 
   * 필요시 compressImage를 활용할 수도 있음. 현재는 원본 유지.
   */
  const fileToDataUri = async (file: File): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
              resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };

  /**
   * 내부 함수: 프롬프트 생성 (Gemini)
   */
  const _generatePromptLogic = async (input: ThumbnailInput) => {
    if (!apiKey) throw new Error('Gemini API 키가 필요합니다.');

    let imagePart = null;
    let userPrompt = '';

    const systemInstruction = `
Role: World-class eCommerce AI Planner.

Goal:
1. Analyze product info/image.
2. Write 'rationale' (Korean) explaining the concept to the user.
3. Write 'prompt' (English) for Stable Diffusion/ControlNet.

Constraint:
- No text/watermarks in image.
- Style: '${input.imageStyle}'
- **IMPORTANT**: prompt는 최대 3~4문장, 400자 이내로 작성한다.
- 8K, UHD, ultra-detailed, 렌즈, 카메라 세팅, 조명 세부값 등 장식적 기술어는 사용하지 않는다.
- Focus on the main subject, composition, and lighting atmosphere only.
`;

    if (input.originalImage) {
      imagePart = await fileToGenerativePart(input.originalImage);
      // 비율 정보를 프롬프트에 포함하여 구도 최적화 유도
      userPrompt = `[Request]\nAnalyze the attached product image and generate JSON output.\nTarget Resolution: ${input.width}x${input.height} (${input.aspectRatio}). Ensure the composition fits this ratio.`;
    } else {
      userPrompt = `[Request]\nProduct: ${input.mainCopy}\nStyle: ${input.imageStyle}\nTarget Resolution: ${input.width}x${input.height} (${input.aspectRatio})\nExtra: ${input.additionalRequest || 'None'}`;
    }

    const parts: any[] = [{ text: userPrompt }];
    if (imagePart) parts.push(imagePart);

    // 배열 래핑은 generateContentWithSmartFallback 내부가 아닌 호출부에서 구조를 잡고,
    // gemini.ts가 최종적으로 { contents: [...] }로 감싸서 보냄.
    // 여기서는 SDK 포맷인 Content[] 구조를 만듦.
    const contents: any[] = [
      {
        role: 'user',
        parts,
      },
    ];
    
    // 구조화된 JSON 출력을 강제하기 위한 스키마 정의
    const responseSchema = {
      type: "object",
      properties: {
        rationale: { type: "string" },
        prompt: { type: "string" }
      },
      required: ["rationale", "prompt"]
    };
    
    const responseText = await generateContentWithSmartFallback(
        apiKey,
        contents,
        systemInstruction,
        responseSchema,
        { responseMimeType: 'application/json' }
    );
    
    if (!responseText) throw new Error('AI 응답이 비어있습니다.');

    // JSON 파싱
    let parsedData: { rationale?: string; prompt: string };
    try {
      const cleanedText = stripCodeFences(responseText);
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error('JSON Parsing Error (1st):', e);
      const cleanedText = stripCodeFences(responseText);
      const jsonChunk = extractLikelyJsonObject(cleanedText);
      if (jsonChunk) {
        try {
          parsedData = JSON.parse(jsonChunk);
        } catch (e2) {
          const extractedPrompt = extractJsonStringField(cleanedText, 'prompt');
          const extractedRationale =
            extractJsonStringField(cleanedText, 'rationale') ||
            extractJsonStringField(cleanedText, 'reasoning');

          if (extractedPrompt) {
            parsedData = {
              rationale: extractedRationale || "기획 의도를 파싱하지 못했습니다.",
              prompt: extractedPrompt,
            };
          } else {
            parsedData = {
              rationale: "기획 의도를 파싱하지 못했습니다.",
              prompt: responseText,
            };
          }
        }
      } else {
        const extractedPrompt = extractJsonStringField(cleanedText, 'prompt');
        const extractedRationale =
          extractJsonStringField(cleanedText, 'rationale') ||
          extractJsonStringField(cleanedText, 'reasoning');

        // P0-1: 파싱 실패 시 원본 텍스트(responseText)를 절대 사용하지 않음
        // prompt가 추출되지 않으면 실패로 간주
        parsedData = extractedPrompt
          ? { rationale: extractedRationale || "기획 의도를 파싱하지 못했습니다.", prompt: extractedPrompt }
          : { rationale: "파싱 실패", prompt: "" }; 
      }
    }

    // P0-1: 프롬프트 유효성 검사 (빈 값, 너무 짧은 값 차단)
    if (!parsedData.prompt || parsedData.prompt.length < 20) {
        console.error('Prompt Parsing Failed. Raw Text:', responseText);
        throw new Error('AI 응답(JSON) 파싱 실패: 프롬프트를 정상적으로 생성하지 못했습니다.');
    }

    return {
        reasoning: parsedData.rationale || "기획 의도 없음",
        prompt: parsedData.prompt
    };
  };

  const startProgress = (start: number, end: number, duration: number) => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    let current = start;
    const step = 1; 
    const intervalTime = duration / (end - start);

    setProgress(current);
    
    progressInterval.current = setInterval(() => {
        current += step;
        if (current >= end) {
            current = end;
            if (progressInterval.current) clearInterval(progressInterval.current);
        }
        setProgress(Math.round(current));
    }, intervalTime);
  };

  /**
   * 썸네일 생성 (통합 함수)
   */
  const generate = async (input: ThumbnailInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      if (!replicateKey) throw new Error('Replicate API 키가 필요합니다.');
      if (!apiKey) throw new Error('Gemini API 키가 필요합니다.');

      // [0% ~ 30%] 기획 단계
      startProgress(0, 30, 2000); 

      console.log('Step 1: Generating Prompt with Smart Fallback...');
      const promptData = await _generatePromptLogic(input);
      console.log('Prompt Generated:', promptData.prompt);

      // [30% ~ 90%] 이미지 생성 단계
      startProgress(30, 90, 8000);

      console.log('Step 2: Generating Image...', { width: input.width, height: input.height });
      let imageUrl = '';
      
      // P0-3: 프롬프트 정리 (길이 제한, 개행 제거) - Replicate 요청 안정화
      const cleanPrompt = promptData.prompt
          .replace(/[\r\n]+/g, ' ')
          .trim()
          .slice(0, 2000);

      if (input.originalImage) {
          const originalImageUri = await fileToDataUri(input.originalImage);
          // width, height 전달
          imageUrl = await generateImageWithControlNet(
            replicateKey, 
            originalImageUri, 
            cleanPrompt, 
            input.width, 
            input.height
          );
      } else {
          // width, height 전달
          imageUrl = await generateImageStandard(
            replicateKey, 
            cleanPrompt, 
            input.width, 
            input.height
          );
      }

      if (!imageUrl) throw new Error('이미지 생성 결과가 없습니다.');

      // [90% ~ 100%] 마무리
      setProgress(100);

      setResult({
        imageUrl,
        prompt: promptData.prompt,
        reasoning: promptData.reasoning,
        timestamp: new Date(),
      });

    } catch (err: any) {
      console.error('Generation Error:', err);
      let errorMessage = '작업 중 오류가 발생했습니다.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setResult(null);
    setProgress(0);
  };

  return {
    generate,
    reset,
    isLoading,
    error,
    result,
    progress,
  };
}
