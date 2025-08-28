// src/components/common/LoadingSpinner.js
import React from 'react';

/**
 * 汎用ローディングスピナーコンポーネント
 * プロジェクト全体で統一されたローディング表示を提供
 */
const LoadingSpinner = ({
  size = 'medium',
  message = null,
  centered = false,
  color = '#3b82f6',
  backgroundColor = null,
  fullHeight = false,
  style = {},
  className = ''
}) => {
  // サイズ設定
  const sizeMap = {
    small: { 
      spinner: 20, 
      border: 2, 
      fontSize: 12 
    },
    medium: { 
      spinner: 40, 
      border: 4, 
      fontSize: 14 
    },
    large: { 
      spinner: 60, 
      border: 6, 
      fontSize: 16 
    }
  };

  const currentSize = sizeMap[size] || sizeMap.medium;

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    ...(centered && { 
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000
    }),
    ...(fullHeight && { 
      height: 'calc(100vh - 64px)',
      minHeight: '200px'
    }),
    ...(backgroundColor && { backgroundColor }),
    padding: '20px',
    ...style
  };

  const spinnerStyles = {
    width: `${currentSize.spinner}px`,
    height: `${currentSize.spinner}px`,
    border: `${currentSize.border}px solid #e5e7eb`,
    borderTop: `${currentSize.border}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spinner-rotate 1s linear infinite'
  };

  const messageStyles = {
    color: '#6b7280',
    fontSize: `${currentSize.fontSize}px`,
    fontWeight: '500',
    textAlign: 'center'
  };

  return (
    <div style={containerStyles} className={className}>
      <style>{`
        @keyframes spinner-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={spinnerStyles} />
      
      {message && (
        <div style={messageStyles}>
          {message}
        </div>
      )}
    </div>
  );
};

/**
 * インライン用の小さなスピナー
 */
export const InlineSpinner = ({ 
  color = '#3b82f6',
  size = 16,
  style = {}
}) => {
  const spinnerStyles = {
    display: 'inline-block',
    width: `${size}px`,
    height: `${size}px`,
    border: `2px solid #e5e7eb`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    animation: 'spinner-rotate 1s linear infinite',
    verticalAlign: 'middle',
    ...style
  };

  return (
    <>
      <style>{`
        @keyframes spinner-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinnerStyles} />
    </>
  );
};

/**
 * ページ全体をオーバーレイするローディング
 */
export const OverlaySpinner = ({ 
  message = 'データを読み込み中...',
  backgroundColor = 'rgba(255, 255, 255, 0.9)',
  color = '#3b82f6'
}) => {
  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  };

  return (
    <div style={overlayStyles}>
      <LoadingSpinner 
        size="large" 
        message={message} 
        color={color}
      />
    </div>
  );
};

/**
 * ボタン内で使用するスピナー
 */
export const ButtonSpinner = ({ 
  color = '#ffffff',
  size = 14
}) => {
  return (
    <InlineSpinner 
      color={color} 
      size={size}
      style={{ marginRight: '8px' }}
    />
  );
};

export default LoadingSpinner;