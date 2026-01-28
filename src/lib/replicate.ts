/**
 * Replicate API Client (Proxy Version)
 * 프론트엔드에서 직접 Replicate를 호출하지 않고, /api/replicate 엔드포인트를 통해 호출합니다.
 * 이를 통해 CORS 문제와 API 키 노출 문제를 해결합니다.
 */

// Polling Helper
async function runReplicateProxy(version: string, input: any) {
  // 1. 예측 작업 시작 (POST)
  const startRes = await fetch('/api/replicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version, input }),
  });

  if (!startRes.ok) {
    const errorData = await startRes.json().catch(() => ({}));
    throw new Error(errorData.error || `Replicate 요청 실패 (${startRes.status})`);
  }

  let prediction = await startRes.json();

  // 2. 결과 폴링 (GET)
  const maxAttempts = 60; // 최대 60번 (약 90초)
  let attempts = 0;

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    prediction.status !== 'canceled'
  ) {
    attempts++;
    if (attempts > maxAttempts) throw new Error('이미지 생성 시간 초과');

    await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5초 대기

    const statusRes = await fetch(`/api/replicate?id=${prediction.id}`);
    if (!statusRes.ok) throw new Error('상태 확인 실패');
    
    prediction = await statusRes.json();
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`이미지 생성 실패: ${prediction.error || prediction.status}`);
  }

  return prediction.output;
}

/**
 * Replicate ControlNet(Canny)을 사용한 이미지 생성
 */
export const generateImageWithControlNet = async (
  _apiKey: string, // Proxy 사용 시 클라이언트 키는 무시됨 (서버 env 사용)
  originalImageUrl: string, 
  prompt: string,
  width?: number,
  height?: number
) => {
  try {
    const resolution = width && height ? Math.max(width, height) : 512;

    const output = await runReplicateProxy(
      "aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613", // jagilley/controlnet-canny
      {
        image: originalImageUrl,
        prompt: prompt,
        num_samples: 1,
        image_resolution: resolution,
        low_threshold: 100,
        high_threshold: 200,
        ddim_steps: 20,
        scale: 9.0,
        n_prompt: "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality",
      }
    );

    if (Array.isArray(output) && output.length > 0) {
        return output[0];
    }
    return output;

  } catch (error: any) {
    console.error("Replicate Proxy Error:", error);
    throw error;
  }
};

/**
 * 일반 텍스트 기반 이미지 생성 (Replicate SDXL 등 사용)
 */
export const generateImageStandard = async (
    _apiKey: string, // Proxy 사용 시 클라이언트 키는 무시됨
    prompt: string,
    width: number = 1024,
    height: number = 1024
) => {
    try {
        const output = await runReplicateProxy(
            "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // stability-ai/sdxl
            {
                prompt: prompt,
                num_outputs: 1,
                width: width,
                height: height,
                refine: "expert_ensemble_refiner",
                scheduler: "Kyuvin",
                lora_scale: 0.6,
                guidance_scale: 7.5,
                apply_watermark: false,
                high_noise_frac: 0.8,
                negative_prompt: "text, watermark, low quality, distorted, blurry, bad anatomy"
            }
        );

        if (Array.isArray(output) && output.length > 0) {
            return output[0];
        }
        return output;
    } catch (error: any) {
        console.error("Replicate Proxy Standard Gen Error:", error);
        throw error;
    }
}
