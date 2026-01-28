import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import type { DetailPageSection } from '@/types';

interface SectionEditorProps {
  section: DetailPageSection;
  onUpdate: (sectionId: string, updates: Partial<DetailPageSection>) => void;
}

/**
 * 섹션 편집 컴포넌트
 */
export function SectionEditor({ section, onUpdate }: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editKeyMessage, setEditKeyMessage] = useState(section.keyMessage);
  const [editVisualPrompt, setEditVisualPrompt] = useState(section.visualPrompt);

  const handleSave = () => {
    onUpdate(section.id, {
      title: editTitle,
      keyMessage: editKeyMessage,
      visualPrompt: editVisualPrompt,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(section.title);
    setEditKeyMessage(section.keyMessage);
    setEditVisualPrompt(section.visualPrompt);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            섹션 {section.order}: {isEditing ? '편집 중' : section.title}
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
              <Button variant="default" size="sm" onClick={handleSave}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">제목</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="섹션 제목"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">핵심 메시지</label>
              <Input
                value={editKeyMessage}
                onChange={(e) => setEditKeyMessage(e.target.value)}
                placeholder="핵심 메시지 (20자 이내)"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">이미지 프롬프트</label>
              <Textarea
                value={editVisualPrompt}
                onChange={(e) => setEditVisualPrompt(e.target.value)}
                placeholder="이미지 생성을 위한 시각적 묘사"
                rows={4}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="text-sm font-medium text-slate-600">핵심 메시지:</span>
              <p className="text-sm text-slate-900 mt-1">{section.keyMessage}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600">이미지 프롬프트:</span>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                {section.visualPrompt}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
