'use client';

import { useState } from 'react';
import { useEffect } from "react";
import { Timeline } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import { Sidebar } from '@/components/Sidebar';
import { TimelineView } from '@/components/TimelineView';

export default function Home() {
  const {
    events,
    timelines,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    addTimeline,
    getEventsForTimeline,
  } = useEvents();
  
  const [selectedTimeline, setSelectedTimeline] = useState<Timeline | undefined>();
  const [activeTab, setActiveTab] = useState<'timeline' | 'network' | 'table' | 'eventEdit'>('timeline');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  useEffect(() => {
    // 画面が読み込まれた時に実行される
    alert("【お知らせ】現在、一部の機能が工事中です。ご不便をおかけします。");
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">#TL</h1>
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === 'timeline' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              📊 年表
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === 'network' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              🕸️ ネットワーク
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === 'table' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              📋 テーブル
            </button>
            <button
              onClick={() => setActiveTab('eventEdit')}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === 'eventEdit' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              ✏️ イベント編集
            </button>
          </nav>
        </div>
        <div className="text-sm text-gray-600">
          {events.length} イベント • {timelines.length} 年表
        </div>
      </header>

      <div className="flex-1 flex">
        <Sidebar
          timelines={timelines}
          selectedTimeline={selectedTimeline}
          onSelectTimeline={setSelectedTimeline}
          onAddTimeline={addTimeline}
        />
        
        <main className="flex-1">
          {activeTab === 'timeline' && (
            <TimelineView
              events={events}
              timelines={timelines}
              selectedTimeline={selectedTimeline}
              onAddEvent={addEvent}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
              getEventsForTimeline={getEventsForTimeline}
            />
          )}
          {activeTab === 'network' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-500">ネットワーク表示は今後実装予定です</div>
            </div>
          )}
          {activeTab === 'table' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-500">テーブル表示は今後実装予定です</div>
            </div>
          )}
          {activeTab === 'eventEdit' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-500">イベント編集は今後実装予定です</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
