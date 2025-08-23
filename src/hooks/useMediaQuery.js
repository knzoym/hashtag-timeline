// src/hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // 初期値を設定
    setMatches(media.matches);
    
    // リスナーを定義
    const listener = (event) => setMatches(event.matches);
    
    // リスナーを追加
    if (media.addListener) {
      media.addListener(listener); // 古いブラウザ対応
    } else {
      media.addEventListener('change', listener);
    }
    
    // クリーンアップ
    return () => {
      if (media.removeListener) {
        media.removeListener(listener);
      } else {
        media.removeEventListener('change', listener);
      }
    };
  }, [query]);

  return matches;
};

// 便利なプリセット
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1024px)');