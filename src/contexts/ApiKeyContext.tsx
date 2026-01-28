import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * API 키 컨텍스트 타입
 */
interface ApiKeyContextType {
  // Gemini API Key
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: boolean;

  // Replicate API Key (OpenAI 대체)
  replicateKey: string | null;
  saveReplicateKey: (key: string) => void;
  removeReplicateKey: () => void;
  hasKey: boolean; // hasReplicateKey의 alias (호환성 유지)
}

/**
 * API 키 컨텍스트
 */
const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

/**
 * localStorage 키 상수
 */
const GEMINI_STORAGE_KEY = 'gemini_api_key';
const REPLICATE_STORAGE_KEY = 'replicate_api_key';

/**
 * API 키 Provider 컴포넌트
 */
export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [replicateKey, setReplicateKeyState] = useState<string | null>(null);

  // 컴포넌트 마운트 시 localStorage에서 API 키 불러오기
  useEffect(() => {
    const storedGeminiKey = localStorage.getItem(GEMINI_STORAGE_KEY);
    if (storedGeminiKey) {
      setApiKeyState(storedGeminiKey);
    }

    const storedReplicateKey = localStorage.getItem(REPLICATE_STORAGE_KEY);
    if (storedReplicateKey) {
      setReplicateKeyState(storedReplicateKey);
    }
  }, []);

  /**
   * Gemini API 키 설정 및 localStorage 저장
   */
  const setApiKey = (key: string) => {
    localStorage.setItem(GEMINI_STORAGE_KEY, key);
    setApiKeyState(key);
  };

  /**
   * Gemini API 키 삭제
   */
  const clearApiKey = () => {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
    setApiKeyState(null);
  };

  /**
   * Replicate API 키 설정 및 localStorage 저장
   */
  const saveReplicateKey = (key: string) => {
    localStorage.setItem(REPLICATE_STORAGE_KEY, key);
    setReplicateKeyState(key);
  };

  /**
   * Replicate API 키 삭제
   */
  const removeReplicateKey = () => {
    localStorage.removeItem(REPLICATE_STORAGE_KEY);
    setReplicateKeyState(null);
  };

  /**
   * API 키 존재 여부 (Gemini)
   */
  const hasApiKey = !!apiKey && apiKey !== 'YOUR_API_KEY_HERE';

  /**
   * API 키 존재 여부 (Replicate)
   */
  const hasKey = !!replicateKey && replicateKey !== 'YOUR_API_KEY_HERE';

  return (
    <ApiKeyContext.Provider 
      value={{ 
        apiKey, 
        setApiKey, 
        clearApiKey, 
        hasApiKey,
        
        replicateKey,
        saveReplicateKey,
        removeReplicateKey,
        hasKey, // hasReplicateKey 대신 hasKey 사용
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

/**
 * API 키 컨텍스트 Hook (기존 호환성 + 신규 기능)
 */
export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}

/**
 * 신규 Hook 이름 (Replicate 전용 명시)
 */
export const useApiKeys = useApiKey;

/**
 * Gemini API 키 가져오기 (라이브러리용)
 */
export function getStoredApiKey(): string | null {
  return localStorage.getItem(GEMINI_STORAGE_KEY);
}

/**
 * Replicate API 키 가져오기 (라이브러리용)
 */
export function getStoredReplicateKey(): string | null {
  return localStorage.getItem(REPLICATE_STORAGE_KEY);
}
