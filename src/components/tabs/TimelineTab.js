// src/components/tabs/TimelineTab.js - レガシー版（削除予定）
// このファイルは VisualTab.js に統合されました
// 後方互換性のためのラッパーです

import React from 'react';
import VisualTab from './VisualTab';

const TimelineTab = (props) => {
  console.warn('TimelineTab is deprecated. Use VisualTab with viewMode="timeline" instead.');
  
  return (
    <VisualTab
      {...props}
      viewMode="timeline"
    />
  );
};

export default TimelineTab;