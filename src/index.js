// src/index.js - 修正版
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// 既存のAppの代わりにAppTestをimport
import AppTest from './pages/AppTest';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppTest />
  </React.StrictMode>
);