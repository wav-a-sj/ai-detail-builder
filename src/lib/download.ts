/**
 * 이미지 강제 다운로드 유틸리티
 * 브라우저 보안 정책으로 인해 새 탭이 열리던 문제를 해결하기 위해,
 * 이미지를 내부적으로 받아와 Blob 형태로 변환 후 다운로드합니다.
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('이미지 다운로드 실패');
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // 리소스 정리
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // 폴백: 실패 시 새 탭으로 열기
    window.open(url, '_blank');
    throw error;
  }
}
