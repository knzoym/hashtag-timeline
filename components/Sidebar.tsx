'use client';

import { useState } from 'react';
import { Timeline } from '@/types';

interface SidebarProps {
  timelines: Timeline[];
  selectedTimeline?: Timeline;
  onSelectTimeline: (timeline: Timeline | undefined) => void;
  onAddTimeline: (timeline: Omit<Timeline, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function Sidebar({
  timelines,
  selectedTimeline,
  onSelectTimeline,
  onAddTimeline,
}: SidebarProps) {
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineTags, setNewTimelineTags] = useState('');

  const handleAddTimeline = () => {
    if (newTimelineTitle.trim()) {
      const tags = newTimelineTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

      onAddTimeline({
        title: newTimelineTitle.trim(),
        description: '',
        tags,
        logic: { mode: 'AND' },
      });

      setNewTimelineTitle('');
      setNewTimelineTags('');
      setIsAddingTimeline(false);
    }
  };

  return (
    <div className="w-80 bg-gray-50 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg mb-2">年表一覧</h2>
        <button
          onClick={() => setIsAddingTimeline(true)}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          年表を追加
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <button
            onClick={() => onSelectTimeline(undefined)}
            className={`w-full text-left px-3 py-2 rounded mb-1 text-sm ${
              !selectedTimeline
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'hover:bg-gray-100'
            }`}
          >
            全てのイベント
          </button>

          {timelines.map((timeline) => (
            <button
              key={timeline.id}
              onClick={() => onSelectTimeline(timeline)}
              className={`w-full text-left px-3 py-2 rounded mb-1 text-sm ${
                selectedTimeline?.id === timeline.id
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{timeline.title}</div>
              {timeline.tags.length > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  {timeline.tags.join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {isAddingTimeline && (
        <div className="p-4 border-t bg-white">
          <h3 className="font-medium mb-3">新しい年表</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newTimelineTitle}
              onChange={(e) => setNewTimelineTitle(e.target.value)}
              placeholder="年表のタイトル"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={newTimelineTags}
              onChange={(e) => setNewTimelineTags(e.target.value)}
              placeholder="タグ (カンマ区切り)"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddTimeline}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setIsAddingTimeline(false);
                  setNewTimelineTitle('');
                  setNewTimelineTags('');
                }}
                className="flex-1 px-3 py-2 border rounded hover:bg-gray-100 text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}