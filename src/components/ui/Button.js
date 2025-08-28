// src/components/ui/Button.js
import React from 'react';

/**
 * 統一されたボタンコンポーネント
 * プロジェクト全体で一貫したボタンスタイルを提供
 */
const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
  size = 'medium', // 'small' | 'medium' | 'large'
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left', // 'left' | 'right'
  fullWidth = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  type = 'button',
  style = {},
  className = '',
  title = '',
  ...props
}) => {
  // バリアント（色）設定
  const variantStyles = {
    primary: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: '1px solid #3b82f6',
      hover: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb'
      }
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#374151',
      border: '1px solid #d1d5db',
      hover: {
        backgroundColor: '#f9fafb',
        borderColor: '#9ca3af'
      }
    },
    danger: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
      border: '1px solid #ef4444',
      hover: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626'
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#6b7280',
      border: '1px solid transparent',
      hover: {
        backgroundColor: '#f3f4f6',
        color: '#374151'
      }
    },
    link: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: 'none',
      textDecoration: 'underline',
      hover: {
        color: '#2563eb',
        textDecoration: 'none'
      }
    }
  };

  // サイズ設定
  const sizeStyles = {
    small: {
      padding: '6px 12px',
      fontSize: '12px',
      minHeight: '28px'
    },
    medium: {
      padding: '8px 16px',
      fontSize: '14px',
      minHeight: '36px'
    },
    large: {
      padding: '12px 24px',
      fontSize: '16px',
      minHeight: '44px'
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const currentSize = sizeStyles[size] || sizeStyles.medium;

  // 無効化またはローディング時のスタイル
  const disabledStyles = {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none'
  };

  // 基本スタイル
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: '500',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    outline: 'none',
    textDecoration: 'none',
    ...(fullWidth && { width: '100%' }),
    ...currentSize,
    ...currentVariant,
    ...(disabled || loading ? disabledStyles : {}),
    ...style
  };

  // ホバーイベントハンドラー
  const handleMouseEnter = (e) => {
    if (!disabled && !loading) {
      Object.assign(e.target.style, currentVariant.hover);
      if (onMouseEnter) onMouseEnter(e);
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled && !loading) {
      e.target.style.backgroundColor = currentVariant.backgroundColor;
      e.target.style.borderColor = currentVariant.border.split(' ')[2]; // border-colorを抽出
      e.target.style.color = currentVariant.color;
      e.target.style.textDecoration = currentVariant.textDecoration || 'none';
      if (onMouseLeave) onMouseLeave(e);
    }
  };

  // クリックハンドラー
  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  // ローディングスピナー
  const LoadingIcon = () => (
    <div
      style={{
        width: '14px',
        height: '14px',
        border: '2px solid currentColor',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'button-spin 1s linear infinite'
      }}
    />
  );

  return (
    <>
      <style>{`
        @keyframes button-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <button
        type={type}
        style={baseStyles}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled || loading}
        title={title}
        {...props}
      >
        {/* ローディング中はスピナーを表示 */}
        {loading && <LoadingIcon />}
        
        {/* アイコン（左側） */}
        {!loading && icon && iconPosition === 'left' && (
          <span style={{ fontSize: 'inherit' }}>{icon}</span>
        )}
        
        {/* ボタンテキスト */}
        {children && (
          <span>{children}</span>
        )}
        
        {/* アイコン（右側） */}
        {!loading && icon && iconPosition === 'right' && (
          <span style={{ fontSize: 'inherit' }}>{icon}</span>
        )}
      </button>
    </>
  );
};

/**
 * アイコンボタン（テキストなし）
 */
export const IconButton = ({
  icon,
  size = 'medium',
  variant = 'ghost',
  disabled = false,
  loading = false,
  onClick,
  title = '',
  style = {},
  ...props
}) => {
  const sizeMap = {
    small: { width: '28px', height: '28px', fontSize: '12px' },
    medium: { width: '36px', height: '36px', fontSize: '16px' },
    large: { width: '44px', height: '44px', fontSize: '20px' }
  };

  const currentSizeStyle = sizeMap[size] || sizeMap.medium;

  return (
    <Button
      variant={variant}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      title={title}
      style={{
        ...currentSizeStyle,
        padding: '0',
        minHeight: 'auto',
        ...style
      }}
      {...props}
    >
      {!loading && icon}
    </Button>
  );
};

/**
 * ボタングループ
 */
export const ButtonGroup = ({ 
  children, 
  orientation = 'horizontal', // 'horizontal' | 'vertical'
  style = {},
  gap = '0' 
}) => {
  const groupStyles = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: gap,
    ...style
  };

  return (
    <div style={groupStyles} role="group">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === Button) {
          // ボタングループ内では角を調整
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          let borderRadius = '0';
          if (orientation === 'horizontal') {
            if (isFirst) borderRadius = '6px 0 0 6px';
            else if (isLast) borderRadius = '0 6px 6px 0';
          } else {
            if (isFirst) borderRadius = '6px 6px 0 0';
            else if (isLast) borderRadius = '0 0 6px 6px';
          }

          return React.cloneElement(child, {
            style: {
              borderRadius,
              marginLeft: orientation === 'horizontal' && !isFirst ? '-1px' : '0',
              marginTop: orientation === 'vertical' && !isFirst ? '-1px' : '0',
              ...child.props.style
            }
          });
        }
        return child;
      })}
    </div>
  );
};

export default Button;