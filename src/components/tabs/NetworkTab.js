// src/components/tabs/NetworkTab.js - レガシー版（削除予定）
// このファイルは VisualTab.js に統合されました
// 後方互換性のためのラッパーです

import React from 'react';
import VisualTab from './VisualTab';

const NetworkTab = (props) => {
  console.warn('NetworkTab is deprecated. Use VisualTab with viewMode="network" instead.');
  
  return (
    <VisualTab
      {...props}
      viewMode="network"
    />
  );
};

export default NetworkTab;