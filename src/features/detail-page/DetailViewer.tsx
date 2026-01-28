import { Download, RotateCcw, FileJson } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { toast } from 'sonner';
import { downloadImage } from '@/lib/download';
import type { DetailPageSection } from '@/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface DetailViewerProps {
  sections: DetailPageSection[];
  productName: string;
  onReset: () => void;
}

/**
 * 상세페이지 결과 뷰어 컴포넌트
 */
export function DetailViewer({ sections, productName, onReset }: DetailViewerProps) {
  // 개별 이미지 다운로드
  const handleDownloadSingle = async (section: DetailPageSection) => {
    if (!section.imageUrl) return;

    try {
      const filename = `${productName}-${section.order}-${section.title}.png`;
      toast.info(`${section.title} 이미지 다운로드를 시작합니다.`);
      await downloadImage(section.imageUrl, filename);
      toast.success('다운로드가 완료되었습니다.');
    } catch (error) {
      toast.error('다운로드 중 오류가 발생했습니다.');
    }
  };

  // 전체 이미지 다운로드 (순차적)
  const handleDownloadAll = async () => {
    toast.info('전체 이미지 다운로드를 시작합니다...');

    try {
      for (const section of sections) {
        if (section.imageUrl) {
          const filename = `${productName}-${section.order}-${section.title}.png`;
          await downloadImage(section.imageUrl, filename);
          
          // 다운로드 간 짧은 지연 (브라우저 부하 방지)
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
      toast.success('전체 이미지 다운로드가 완료되었습니다!');
    } catch (error) {
      toast.error('전체 다운로드 중 일부 오류가 발생했습니다.');
    }
  };

  // Figma용 데이터 다운로드 (Zip)
  const handleDownloadForFigma = async () => {
    toast.info('Figma용 에셋 번들링을 시작합니다...');
    const zip = new JSZip();
    const folder = zip.folder("figma-assets");

    try {
      // 1. JSON 데이터 생성
      const figmaData = {
        productName,
        generatedAt: newDg(),
        sections: sections.map(s => ({
          order: s.order,
          title: s.title,
          keyMessage: s.keyMessage,
          imageFileName: `section-${s.order}.png`
        }))
      };
      
      folder?.file("project-data.json", JSON.stringify(figmaData, null, 2));

      // 2. 이미지 추가
      const imagePromises = sections.map(async (section) => {
        if (section.imageUrl) {
          // data URL인 경우
          if (section.imageUrl.startsWith('data:')) {
             const base64Data = section.imageUrl.split(',')[1];
             folder?.file(`section-${section.order}.png`, base64Data, { base64: true });
          } 
          // URL인 경우 (Unsplash/Picsum 등)
          else {
             try {
               const response = await fetch(section.imageUrl);
               const blob = await response.blob();
               folder?.file(`section-${section.order}.png`, blob);
             } catch (e) {
               console.error(`Failed to fetch image for section ${section.order}`, e);
             }
          }
        }
      });

      await Promise.all(imagePromises);

      // 3. Zip 생성 및 다운로드
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${productName}-figma-assets.zip`);
      toast.success('Figma용 에셋 다운로드가 완료되었습니다.');

    } catch (error) {
      console.error(error);
      toast.error('Figma 에셋 생성 중 오류가 발생했습니다.');
    }
  };

  function newDg() { return new Date().toISOString(); }

  return (
    <div className="space-y-6">
      {/* 상단 액션 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>생성 결과</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownloadForFigma} variant="secondary" className="bg-purple-100 text-purple-900 hover:bg-purple-200 border-purple-200">
                <FileJson className="w-4 h-4 mr-2" />
                Figma용 에셋 다운로드
              </Button>
              <Button onClick={handleDownloadAll} variant="default">
                <Download className="w-4 h-4 mr-2" />
                전체 이미지 다운로드
              </Button>
              <Button onClick={onReset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                새로 만들기
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            총 {sections.length}개의 섹션이 생성되었습니다. 
            이미지는 텍스트 없이 생성되었으며, HTML 텍스트가 위에 오버레이되어 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* 이미지 뷰어 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 세로 스크롤 뷰어 (HTML 오버레이 적용) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">미리보기 (HTML 텍스트 오버레이)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[800px] rounded-md border bg-slate-100">
              <div className="flex flex-col items-center py-8 space-y-0 max-w-[400px] mx-auto">
                {sections.map((section) => (
                  <div key={section.id} className="relative w-full group">
                    {/* 이미지 배경 */}
                    {section.imageUrl ? (
                      <img
                        src={section.imageUrl}
                        alt={section.title}
                        className="w-full h-auto block"
                      />
                    ) : (
                      <div className="aspect-[9/16] bg-white flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-slate-600">이미지 생성 중...</p>
                        </div>
                      </div>
                    )}

                    {/* HTML 텍스트 오버레이 */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent opacity-100 transition-opacity">
                      <div className="text-white drop-shadow-md">
                        <h3 className="text-2xl font-bold mb-2 leading-tight" contentEditable suppressContentEditableWarning={true}>
                          {section.title}
                        </h3>
                        <p className="text-lg font-medium opacity-90 leading-relaxed" contentEditable suppressContentEditableWarning={true}>
                          {section.keyMessage}
                        </p>
                      </div>
                    </div>
                    
                    {/* 편집 힌트 */}
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      텍스트 수정 가능
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 우측: 개별 섹션 정보 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">섹션별 상세</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[780px]">
                <div className="space-y-4 pr-4">
                  {sections.map((section) => (
                    <Card key={section.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-medium text-blue-600">
                              섹션 {section.order}
                            </div>
                            <div className="font-semibold text-slate-900">
                              {section.title}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadSingle(section)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* 이미지 썸네일 */}
                        {section.imageUrl ? (
                          <div className="relative aspect-[9/16] rounded-md overflow-hidden border">
                            <img
                              src={section.imageUrl}
                              alt={section.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="relative aspect-[9/16] rounded-md overflow-hidden border bg-slate-50 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              <p className="text-xs text-slate-600">생성 중...</p>
                            </div>
                          </div>
                        )}

                        {/* 핵심 메시지 */}
                        <div>
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            핵심 메시지
                          </div>
                          <div className="text-sm text-slate-900 font-medium">
                            {section.keyMessage}
                          </div>
                        </div>

                        {/* 프롬프트 */}
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                            이미지 프롬프트 보기
                          </summary>
                          <p className="mt-2 text-slate-600 whitespace-pre-wrap">
                            {section.visualPrompt}
                          </p>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
