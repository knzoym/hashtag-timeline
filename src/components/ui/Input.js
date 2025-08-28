// src/components/ui/Input.js
import React, { forwardRef, useState } from 'react';

/**
 * 統一された入力フィールドコンポーネント
 */
const Input = forwardRef(({
  type = 'text',
  placeholder = '',
  value = '',
  defaultValue = '',
  onChange,
  onFocus,
  onBlur,
  onKeyPress,
  onKeyDown,
  disabled = false,
  readOnly = false,
  required = false,
  error = null,
  success = false,
  label = null,
  hint = null,
  prefix = null,
  suffix = null,
  size = 'medium', // 'small' | 'medium' | 'large'
  variant = 'default', // 'default' | 'minimal' | 'filled'
  fullWidth = false,
  autoFocus = false,
  maxLength = null,
  minLength = null,
  pattern = null,
  step = null,
  min = null,
  max = null,
  style = {},
  className = '',
  id = null,
  name = null,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // サイズ設定
  const sizeStyles = {
    small: {
      padding: '6px 12px',
      fontSize: '12px',
      minHeight: '32px'
    },
    medium: {
      padding: '8px 12px',
      fontSize: '14px',
      minHeight: '40px'
    },
    large: {
      padding: '12px 16px',
      fontSize: '16px',
      minHeight: '48px'
    }
  };

  // バリアント設定
  const variantStyles = {
    default: {
      backgroundColor: '#ffffff',
      border: '1px solid #d1d5db',
      borderRadius: '6px'
    },
    minimal: {
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: '2px solid #e5e7eb',
      borderRadius: '0'
    },
    filled: {
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;
  const currentVariant = variantStyles[variant] || variantStyles.default;

  // 状態に応じたスタイル
  const getStateStyles = () => {
    if (error) {
      return {
        borderColor: '#ef4444',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
      };
    }
    if (success) {
      return {
        borderColor: '#10b981',
        boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
      };
    }
    if (isFocused) {
      return {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        outline: 'none'
      };
    }
    return {};
  };

  // 基本スタイル
  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    color: '#374151',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
    ...(disabled && {
      opacity: 0.6,
      cursor: 'not-allowed',
      backgroundColor: '#f3f4f6'
    }),
    ...(readOnly && {
      backgroundColor: '#f9fafb',
      cursor: 'default'
    }),
    ...currentSize,
    ...currentVariant,
    ...getStateStyles(),
    ...style
  };

  // プレフィックス・サフィックス付きの場合のコンテナスタイル
  const containerStyles = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: fullWidth ? '100%' : 'auto'
  };

  const affixStyles = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
    fontSize: currentSize.fontSize,
    pointerEvents: 'none',
    userSelect: 'none'
  };

  // フォーカスハンドラー
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // プレフィックス・サフィックスがある場合の入力フィールド調整
  const adjustedInputStyles = {
    ...inputStyles,
    ...(prefix && { paddingLeft: '36px' }),
    ...(suffix && { paddingRight: '36px' })
  };

  const renderInput = () => (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyPress={onKeyPress}
      onKeyDown={onKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      autoFocus={autoFocus}
      maxLength={maxLength}
      minLength={minLength}
      pattern={pattern}
      step={step}
      min={min}
      max={max}
      style={prefix || suffix ? adjustedInputStyles : inputStyles}
      className={className}
      id={id}
      name={name}
      {...props}
    />
  );

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {/* ラベル */}
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
        </label>
      )}

      {/* 入力フィールドコンテナ */}
      {prefix || suffix ? (
        <div style={containerStyles}>
          {prefix && (
            <div style={{ ...affixStyles, left: '12px' }}>
              {prefix}
            </div>
          )}
          {renderInput()}
          {suffix && (
            <div style={{ ...affixStyles, right: '12px' }}>
              {suffix}
            </div>
          )}
        </div>
      ) : (
        renderInput()
      )}

      {/* エラーメッセージ */}
      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#ef4444',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      {/* ヒントテキスト */}
      {hint && !error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          {hint}
        </div>
      )}
    </div>
  );
});

/**
 * テキストエリア
 */
export const TextArea = forwardRef(({
  rows = 4,
  resize = 'vertical', // 'none' | 'vertical' | 'horizontal' | 'both'
  ...props
}, ref) => {
  return (
    <Input
      {...props}
      ref={ref}
      as="textarea"
      rows={rows}
      style={{
        resize: resize,
        minHeight: `${rows * 24 + 16}px`,
        lineHeight: '1.5',
        ...props.style
      }}
    />
  );
});

/**
 * 検索入力フィールド
 */
export const SearchInput = forwardRef(({
  onClear,
  clearable = true,
  ...props
}, ref) => {
  const [hasValue, setHasValue] = useState(false);

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    if (props.onChange) props.onChange(e);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (props.onChange) {
      props.onChange({ target: { value: '' } });
    }
    setHasValue(false);
  };

  return (
    <Input
      {...props}
      ref={ref}
      type="search"
      prefix="🔍"
      suffix={
        clearable && hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '2px',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}
            title="クリア"
          >
            ×
          </button>
        ) : null
      }
      onChange={handleChange}
    />
  );
});

// 表示名設定
Input.displayName = 'Input';
TextArea.displayName = 'TextArea';
SearchInput.displayName = 'SearchInput';

export default Input;