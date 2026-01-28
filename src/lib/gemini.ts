import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { getStoredApiKey } from '@/contexts/ApiKeyContext';

type ErrorAnalysis = {
  type: 'AUTH' | 'QUOTA' | 'NOT_FOUND' | 'SERVER' | 'NETWORK' | 'UNKNOWN';
  message: string;
  shouldFallback: boolean;
  shouldRetry?: boolean;
  retryAfterMs?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMsFromMessage(msg: string): number | undefined {
  // 일부 응답/SDK 메시지에 retry-after 힌트가 포함되는 경우가 있어, 최대한 보수적으로 파싱합니다.
  // 예: "Retry after 2s" / "retry after 2000ms" 같은 문자열
  const sMatch = msg.match(/retry\s*after\s*(\d+)\s*s/i);
  if (sMatch?.[1]) return Math.min(30_000, Number(sMatch[1]) * 1000);
  const msMatch = msg.match(/retry\s*after\s*(\d+)\s*ms/i);
  if (msMatch?.[1]) return Math.min(30_000, Number(msMatch[1]));
  return undefined;
}

function backoffMs(attempt: number, baseMs = 600, capMs = 8000) {
  // attempt: 1,2,3...  -> 600, 1200, 2400... + jitter
  const exp = Math.min(capMs, baseMs * Math.pow(2, attempt - 1));
  const jitter = Math.floor(Math.random() * 250);
  return exp + jitter;
}

// 싱글톤 인스턴스
let genAIInstance: GoogleGenerativeAI | null = null;

const MODEL_PRIORITY_QUEUE = [
  // ✅ 상세/고밀도 프롬프트 우선 (PRD 필수 정책)
  'gemini-2.5-pro',            // 1순위: 디테일/문장력 최상
  'gemini-2.5-flash',          // 2순위: 속도/비용 백업
  'gemini-pro-latest',         // 3순위: 최신 Pro Alias
  'gemini-flash-latest',       // 4순위: 최신 Flash Alias
  'gemini-2.0-flash',          // 5순위: 안정 백업
  'gemini-2.0-flash-lite',     // 6순위: 최후 백업
];

/**
 * API 키 가져오기 (localStorage > env)
 */
function getApiKey(): string | null {
  const storedKey = getStoredApiKey();
  if (storedKey && storedKey !== 'YOUR_API_KEY_HERE') return storedKey;
  
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'YOUR_API_KEY_HERE') return envKey;
  
  return null;
}

/**
 * Gemini 클라이언트 생성 및 초기화
 */
export function createGenAI(specificApiKey?: string): GoogleGenerativeAI | null {
  const apiKey = specificApiKey || getApiKey();
  if (!apiKey) return null;
  
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
    return null;
  }
}

/**
 * API 키 변경 시 genAI 재초기화
 */
export function refreshGenAI(): void {
  genAIInstance = createGenAI();
}

/**
 * Gemini 클라이언트 가져오기 (Singleton)
 */
export function getGenAI(specificApiKey?: string): GoogleGenerativeAI | null {
  if (specificApiKey) {
    return createGenAI(specificApiKey);
  }

  if (!genAIInstance) {
    genAIInstance = createGenAI();
  }
  return genAIInstance;
}

/**
 * Gemini API 사용 가능 여부 확인
 */
export const isGeminiAvailable = (): boolean => {
  if (!genAIInstance) {
    refreshGenAI();
  }
  return genAIInstance !== null;
};

/**
 * API 키 확인 및 에러 처리 (필수 함수 복구)
 */
export const checkApiKey = (): void => {
  if (!isGeminiAvailable()) {
    throw new Error(
      '웨이브A AI 제작 서비스를 사용하려면 API 키가 필요합니다. 상단 설정 메뉴에서 API 키를 입력해주세요.'
    );
  }
};

function analyzeError(error: any): ErrorAnalysis {
  const msg = error?.message || String(error);

  // 400: 요청 바디(JSON) 자체가 잘못된 경우. 모델 바꿔도 해결되지 않으므로 즉시 중단
  if (
    msg.includes('400') &&
    (msg.includes('Invalid JSON payload') ||
      msg.includes('Cannot find field') ||
      msg.includes('Unknown name "role"') ||
      msg.includes('Unknown name "parts"'))
  ) {
    return { type: 'UNKNOWN', message: msg, shouldFallback: false, shouldRetry: false };
  }

  // 인증/권한: 재시도/모델 변경 의미 없음
  if (msg.includes('401') || msg.includes('403') || /API key/i.test(msg)) {
    return { type: 'AUTH', message: msg, shouldFallback: false, shouldRetry: false };
  }
  // 쿼터/레이트리밋: 같은 모델 재시도는 의미 있음(짧게), 모델 변경은 보통 의미 없음이나
  // 프로젝트 상황에 따라 모델별 정책이 달라질 수 있어 fallback은 true로 둡니다(재시도 후).
  if (msg.includes('429') || /rate limit/i.test(msg) || /RESOURCE_EXHAUSTED/i.test(msg)) {
    return {
      type: 'QUOTA',
      message: msg,
      shouldFallback: true,
      shouldRetry: true,
      retryAfterMs: parseRetryAfterMsFromMessage(msg),
    };
  }
  // 모델 미존재/메서드 미지원
  if (msg.includes('404') || /not found/i.test(msg)) {
    return { type: 'NOT_FOUND', message: msg, shouldFallback: true, shouldRetry: false };
  }
  // 서버/일시 장애
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
    return { type: 'SERVER', message: msg, shouldFallback: true, shouldRetry: true };
  }
  // 네트워크/타임아웃 계열(환경에 따라 문구 상이)
  if (/network/i.test(msg) || /timeout/i.test(msg) || /fetch/i.test(msg)) {
    return { type: 'NETWORK', message: msg, shouldFallback: true, shouldRetry: true };
  }

  return { type: 'UNKNOWN', message: msg, shouldFallback: true, shouldRetry: false };
}

export async function generateContentWithSmartFallback(
  apiKey: string,
  contents: any,
  systemInstruction?: string,
  responseSchema?: any,
  options?: { modelQueueOverride?: string[]; responseMimeType?: string }
): Promise<string> {
  const ai = getGenAI(apiKey);
  if (!ai) throw new Error('Gemini 클라이언트 초기화 실패');

  let lastError: Error | null = null;

  const queue = options?.modelQueueOverride?.length
    ? options.modelQueueOverride
    : MODEL_PRIORITY_QUEUE;

  for (const modelName of queue) {
    try {
      console.log(`🤖 Attempting model: ${modelName}`);

      const modelParams: any = {
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          // ✅ 디테일 강화(출력 길이 확보)
          // (너무 짧게 나오는 문제를 막기 위해 넉넉하게)
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 64,
        }
      };

      if (systemInstruction) modelParams.systemInstruction = systemInstruction;
      if (responseSchema) {
        modelParams.generationConfig.responseSchema = responseSchema;
        // 스키마를 쓰는 경우 기본적으로 JSON 모드를 켭니다.
        modelParams.generationConfig.responseMimeType = options?.responseMimeType ?? 'application/json';
      } else if (options?.responseMimeType) {
        // 스키마 없이도 JSON 강제 모드를 쓰고 싶을 때(썸네일/기획 등)
        modelParams.generationConfig.responseMimeType = options.responseMimeType;
      }

      const model = ai.getGenerativeModel(modelParams);

      // 429/5xx/네트워크 에러는 같은 모델에서 짧게 재시도 후, 그래도 실패하면 다음 모델로 넘어갑니다.
      const MAX_RETRIES_PER_MODEL = 2;
      for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
        try {
          // 중요: 배열을 그대로 넘기면 SDK가 parts로 오해할 수 있음
          // 반드시 { contents: [...] } 형태로 감싸서 전달
          const request: any = Array.isArray(contents)
            ? { contents }
            : contents;

          const result = await model.generateContent(request);
          const response = await result.response;
          return response.text();
        } catch (e: any) {
          // 네트워크 차단/확장프로그램/보안솔루션 등으로 fetch 자체가 실패하면
          // status code 없이 TypeError: Failed to fetch 형태로 떨어집니다.
          console.error('[Gemini raw error]', e);
          console.error('[Gemini name]', e?.name);
          console.error('[Gemini message]', e?.message);
          console.error('[Gemini stack]', e?.stack);

          // 일부 환경에서는 response/status가 들어오기도 함
          if (e?.response) console.error('[Gemini error response]', e.response);
          if (e?.status) console.error('[Gemini error status]', e.status);

          const analysis = analyzeError(e);
          lastError = e;

          // 400(요청 구조 오류)은 재시도/모델 변경해도 해결되지 않으므로 즉시 중단
          if (analysis.shouldFallback === false && analysis.shouldRetry === false) {
            throw new Error(`[${analysis.type}] ${analysis.message}`);
          }

          // 치명적(인증/권한 등): 즉시 중단
          if (analysis.type === 'AUTH' && analysis.shouldFallback === false) {
            throw new Error(`[${analysis.type}] ${analysis.message}`);
          }

          const canRetry = analysis.shouldRetry && attempt < MAX_RETRIES_PER_MODEL;
          if (!canRetry) {
            console.warn(`❌ Model ${modelName} failed: [${analysis.type}] ${analysis.message}`);
            console.log(`⚠️ Switching to backup model...`);
            break; // 같은 모델 재시도 종료 -> 다음 모델로 fallback
          }

          const waitMs =
            analysis.retryAfterMs ??
            backoffMs(attempt + 1); // attempt 0일 때 1회차 backoff

          console.warn(
            `⏳ Temporary error on ${modelName}: [${analysis.type}] retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES_PER_MODEL})`
          );
          await sleep(waitMs);
          continue;
        }
      }

    } catch (e: any) {
      const analysis = analyzeError(e);
      lastError = e;
      // AUTH는 즉시 중단, 그 외는 다음 모델로 진행
      if (analysis.type === 'AUTH') {
        throw new Error(`[${analysis.type}] ${analysis.message}`);
      }
      continue;
    }
  }

  throw lastError || new Error('모든 AI 모델이 응답하지 않습니다.');
}
