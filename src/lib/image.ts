/**
 * 이미지 처리 유틸리티
 */

/**
 * 이미지를 리사이즈하고 JPEG로 압축합니다.
 * @param file 원본 이미지 파일
 * @param maxDimension 가로/세로 최대 길이 (기본값: 1024px)
 * @param quality JPEG 품질 (0~1, 기본값: 0.8)
 * @returns 리사이즈된 Base64 문자열 (data URL 아님, raw base64)
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1024,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 비율 유지하며 리사이즈
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // JPEG 포맷으로 압축
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Base64 데이터만 추출 (data:image/jpeg;base64, 부분 제거)
        const base64Data = dataUrl.split(',')[1];
        resolve(base64Data);
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}
