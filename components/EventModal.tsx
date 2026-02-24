'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => void;
  event?: Event;
}

export function EventModal({ isOpen, onClose, onSave, event }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateYear, setDateYear] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');
  const [datePrecision, setDatePrecision] = useState<'year' | 'month' | 'day'>('day');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setDateYear(event.date_year.toString());
      setDateMonth(event.date_month?.toString() || '');
      setDateDay(event.date_day?.toString() || '');
      setDatePrecision(event.date_precision);
      setHashtags(event.hashtags);
    } else {
      setTitle('');
      setDescription('');
      setDateYear('');
      setDateMonth('');
      setDateDay('');
      setDatePrecision('day');
      setHashtags([]);
    }
  }, [event, isOpen]);

  const handleAddHashtag = () => {
    if (hashtagInput && !hashtags.includes(hashtagInput)) {
      const tag = hashtagInput.startsWith('#') ? hashtagInput : `#${hashtagInput}`;
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
      title,
      description,
      date_precision: datePrecision,
      date_year: parseInt(dateYear),
      date_month: dateMonth ? parseInt(dateMonth) : undefined,
      date_day: dateDay ? parseInt(dateDay) : undefined,
      hashtags,
    };
    
    onSave(eventData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {event ? 'イベントを編集' : 'イベントを追加'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">日付精度</label>
            <select
              value={datePrecision}
              onChange={(e) => setDatePrecision(e.target.value as 'year' | 'month' | 'day')}
              className="w-full border rounded px-3 py-2"
            >
              <option value="year">年</option>
              <option value="month">年月</option>
              <option value="day">年月日</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">日付</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={dateYear}
                onChange={(e) => setDateYear(e.target.value)}
                placeholder="年"
                className="flex-1 border rounded px-3 py-2"
                required
              />
              {datePrecision !== 'year' && (
                <input
                  type="number"
                  value={dateMonth}
                  onChange={(e) => setDateMonth(e.target.value)}
                  placeholder="月"
                  min="1"
                  max="12"
                  className="w-20 border rounded px-3 py-2"
                />
              )}
              {datePrecision === 'day' && (
                <input
                  type="number"
                  value={dateDay}
                  onChange={(e) => setDateDay(e.target.value)}
                  placeholder="日"
                  min="1"
                  max="31"
                  className="w-20 border rounded px-3 py-2"
                />
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">ハッシュタグ</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                placeholder="#タグを入力"
                className="flex-1 border rounded px-3 py-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHashtag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddHashtag}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                追加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(tag)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}