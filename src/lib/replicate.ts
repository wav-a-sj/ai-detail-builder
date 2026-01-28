import Replicate from "replicate";

/**
 * Replicate ControlNet(Canny)을 사용한 이미지 생성
 * @param apiKey Replicate API Token
 * @param originalImageUrl 원본 이미지 URL (Base64 Data URI 가능)
 * @param prompt 생성 프롬프트
 */
export const generateImageWithControlNet = async (
  apiKey: string,
  originalImageUrl: string, 
  prompt: string,
  width?: number,
  height?: number
) => {
  // Replicate 클라이언트 인스턴스 생성 (브라우저 환경에서 사용 시 주의 필요)
  // 클라이언트 사이드에서 직접 호출 시 CORS 문제가 발생할 수 있으므로, 
  // 실제 프로덕션에서는 백엔드 프록시를 사용하는 것이 좋습니다.
  // 여기서는 요구사항에 따라 직접 호출 방식을 구현합니다.
  
  const replicate = new Replicate({
    auth: apiKey,
  });

  try {
    // jagilley/controlnet-canny 모델 사용 (윤곽선 고정)
    // 입력값 타입 정의가 명확하지 않은 경우 any로 처리하거나 타입을 보강해야 함
    
    // 참고: 이 모델은 explicit width/height보다 image_resolution(긴 변 기준)을 주로 사용함.
    // 비율은 인풋 이미지를 따르는 경향이 있음.
    // 하지만 API 스펙상 width/height 지원 여부를 확인해야 함. 
    // jagilley/controlnet-canny는 image_resolution을 주로 씀.
    // 여기서는 image_resolution을 긴 변으로 설정하여 대응.
    const resolution = width && height ? Math.max(width, height) : 512;

    const output = await replicate.run(
      "jagilley/controlnet-canny:aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613",
      {
        input: {
          image: originalImageUrl, // 사용자가 업로드한 원본 이미지 URL (또는 Base64)
          prompt: prompt,          // Gemini가 만든 프롬프트
          num_samples: 1,
          image_resolution: resolution,
          low_threshold: 100,    // 윤곽선 민감도
          high_threshold: 200,
          ddim_steps: 20,
          scale: 9.0,
          // 필수 부정 프롬프트
          n_prompt: "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality",
        }
      }
    );

    // Replicate는 이미지 URL 배열을 반환함 (예: ["https://..."])
    if (Array.isArray(output) && output.length > 0) {
        return output[0];
    }
    return output; // 단일 문자열로 반환될 경우 대비

  } catch (error: any) {
    console.error("Replicate Error:", error);
    const msg = error?.message || String(error);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
       throw new Error('Replicate 연결 실패: 네트워크 차단(CORS) 또는 키 설정 문제입니다. (VPN/확장프로그램 확인 필요)');
    }
    throw error;
  }
};

/**
 * 일반 텍스트 기반 이미지 생성 (Replicate SDXL 등 사용)
 * 이미지가 없는 경우 사용
 */
export const generateImageStandard = async (
    apiKey: string,
    prompt: string,
    width: number = 1024,
    height: number = 1024
) => {
    const replicate = new Replicate({
        auth: apiKey,
    });

    try {
        // stability-ai/sdxl 사용
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: prompt,
                    num_outputs: 1,
                    width: width,
                    height: height,
                    refine: "expert_ensemble_refiner",
                    scheduler: "Kyuvin", // or DDIM
                    lora_scale: 0.6,
                    guidance_scale: 7.5,
                    apply_watermark: false,
                    high_noise_frac: 0.8,
                    negative_prompt: "text, watermark, low quality, distorted, blurry, bad anatomy"
                }
            }
        );

        if (Array.isArray(output) && output.length > 0) {
            return output[0];
        }
        return output;
    } catch (error: any) {
        console.error("Replicate Standard Gen Error:", error);
        const msg = error?.message || String(error);
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
           throw new Error('Replicate 연결 실패: 네트워크 차단(CORS) 또는 키 설정 문제입니다. (VPN/확장프로그램 확인 필요)');
        }
        throw error;
    }
}
