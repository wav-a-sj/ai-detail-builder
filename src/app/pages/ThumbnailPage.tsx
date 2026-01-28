import { ThumbnailGenerator } from '@/features/thumbnail/ThumbnailGenerator';

/**
 * 썸네일 제작 페이지
 */
export function ThumbnailPage() {
  return (
    <div className="container mx-auto px-4 py-8 bg-[#ffffff00]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">썸네일 제작</h2>
          <p className="text-slate-600"></p>
        </div>
        
        <ThumbnailGenerator />
      </div>
    </div>
  );
}
