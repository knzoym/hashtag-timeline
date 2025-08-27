// hooks/useTimelineSearch.js
import { useState, useCallback } from 'react';

export const useTimelineSearch = (events) => {
  console.log('🔍 useTimelineSearch 初期化');

  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedEvents, setHighlightedEvents] = useState(new Set());

  const handleSearchChange = useCallback((term) => {
    console.log('🔍 検索:', term);
    setSearchTerm(term);
    
    if (!term.trim()) {
      setHighlightedEvents(new Set());
      return;
    }

    try {
      const matchingEvents = new Set();
      (events || []).forEach(event => {
        const matchesTitle = event.title?.toLowerCase().includes(term.toLowerCase());
        const matchesDescription = event.description?.toLowerCase().includes(term.toLowerCase());
        const matchesTags = event.tags?.some(tag => 
          tag?.toLowerCase().includes(term.toLowerCase())
        );
        
        if (matchesTitle || matchesDescription || matchesTags) {
          matchingEvents.add(event.id);
        }
      });
      
      setHighlightedEvents(matchingEvents);
      console.log(`  → ${matchingEvents.size}件マッチ`);
    } catch (error) {
      console.error('検索エラー:', error);
      setHighlightedEvents(new Set());
    }
  }, [events]);

  const getTopTagsFromSearch = useCallback((searchEvents) => {
    if (!searchEvents || !Array.isArray(searchEvents) || searchEvents.length === 0) {
      return [];
    }
    
    try {
      const tagCount = {};
      searchEvents.forEach(event => {
        (event?.tags || []).forEach(tag => {
          if (typeof tag === 'string') {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          }
        });
      });
      
      return Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag);
    } catch (error) {
      console.error('getTopTagsFromSearch エラー:', error);
      return [];
    }
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    highlightedEvents,
    setHighlightedEvents,
    handleSearchChange,
    getTopTagsFromSearch
  };
};