// src/components/TimelineErrorBoundary.js
import React from 'react';

class TimelineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Timeline Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          margin: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>
            エラーが発生しました
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            年表の読み込み中に問題が発生しました。
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ページを再読み込み
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>エラー詳細</summary>
              <pre style={{ 
                backgroundColor: '#f3f4f6',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default TimelineErrorBoundary;