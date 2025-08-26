// src/components/WikiRevisionForm.js
import React, { useState, useEffect } from 'react';
import { extractTagsFromDescription } from '../utils/timelineUtils';

const WikiRevisionForm = ({ 
  eventId, 
  slug, 
  initialData, 
  user, 
  supabaseClient, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date_start: '',
    date_end: '',
    tags: [],
    sources: [''],
    license: 'CC-BY-SA-4.0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(false);

  // 初期値設定
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        date_start: initialData.date_start || '',
        date_end: initialData.date_end || initialData.date_start || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        sources: Array.isArray(initialData.sources) && initialData.sources.length > 0 
          ? initialData.sources 
          : [''],
        license: initialData.license || 'CC-BY-SA-4.0'
      });
    }
  }, [initialData]);

  // 全タグを取得（自動抽出 + 手動入力）
  const getAllTags = () => {
    const extractedTags = extractTagsFromDescription(formData.description);
    const titleTag = formData.title.trim() ? [formData.title.trim()] : [];
    return [...new Set([...titleTag, ...extractedTags, ...formData.tags])];
  };

  // タグ追加
  const addTag = (tagText) => {
    const trimmedTag = tagText.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  // タグ削除
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // ソース追加
  const addSource = () => {
    setFormData(prev => ({
      ...prev,
      sources: [...prev.sources, '']
    }));
  };

  // ソース更新
  const updateSource = (index, value) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.map((source, i) => i === index ? value : source)
    }));
  };

  // ソース削除
  const removeSource = (index) => {
    if (formData.sources.length > 1) {
      setFormData(prev => ({
        ...prev,
        sources: prev.sources.filter((_, i) => i !== index)
      }));
    }
  };

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date_start: formData.date_start,
        date_end: formData.date_end || formData.date_start,
        tags: getAllTags(),
        sources: formData.sources.filter(source => source.trim()),
        license: formData.license
      };

      const requestBody = eventId ? { eventId, payload } : { slug, payload };

      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev.create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.auth.session()?.access_token}`,
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to save revision');
      }

      alert('リビジョンを保存しました！');
      onSave(result.data);
    } catch (error) {
      console.error('保存エラー:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '2px solid #e5e7eb'
    },
    title: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '600',
      color: '#374151'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    content: {
      padding: '20px'
    },
    toggleButtons: {
      display: 'flex',
      marginBottom: '20px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      padding: '2px'
    },
    toggleButton: {
      flex: 1,
      padding: '8px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '6px',
      cursor: 'pointer'
    },
    toggleButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none'
    },
    textarea: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '120px',
      resize: 'vertical',
      outline: 'none'
    },
    dateRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      minHeight: '40px',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      alignItems: 'flex-start'
    },
    tag: {
      padding: '4px 8px',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: '12px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      height: '24px'
    },
    removeTagButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '0',
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%'
    },
    tagInput: {
      border: 'none',
      outline: 'none',
      padding: '4px 8px',
      fontSize: '12px',
      minWidth: '100px',
      backgroundColor: 'transparent',
      height: '24px',
      flex: 1
    },
    sourcesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    sourceRow: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    },
    sourceInput: {
      flex: 1
    },
    sourceButton: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      backgroundColor: 'white',
      color: '#374151',
      fontSize: '12px',
      cursor: 'pointer'
    },
    addSourceButton: {
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none'
    },
    removeSourceButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none'
    },
    licenseSelect: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    hint: {
      fontSize: '11px',
      color: '#6b7280',
      marginTop: '4px'
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '14px'
    },
    buttonContainer: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb',
      marginTop: '16px'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    cancelButton: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    saveButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    disabledButton: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    previewContent: {
      backgroundColor: '#f8fafc',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    previewTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '8px'
    },
    previewDescription: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#374151',
      marginBottom: '16px',
      whiteSpace: 'pre-wrap'
    },
    previewTags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '16px'
    },
    previewTag: {
      padding: '4px 8px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      fontSize: '12px',
      borderRadius: '12px',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {eventId ? 'イベントを編集' : '新しいイベントを作成'}
          </h2>
          <button 
            style={styles.closeButton}
            onClick={onCancel}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <div style={styles.content}>
          {/* プレビュー切り替え */}
          <div style={styles.toggleButtons}>
            <button
              onClick={() => setPreview(false)}
              style={{
                ...styles.toggleButton,
                ...(!preview ? styles.toggleButtonActive : {})
              }}
            >
              ✏️ 編集
            </button>
            <button
              onClick={() => setPreview(true)}
              style={{
                ...styles.toggleButton,
                ...(preview ? styles.toggleButtonActive : {})
              }}
            >
              👀 プレビュー
            </button>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          {!preview ? (
            <form style={styles.form} onSubmit={handleSubmit}>
              {/* タイトル */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>タイトル *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={styles.input}
                  placeholder="イベントのタイトル"
                  required
                />
              </div>

              {/* 日付 */}
              <div style={styles.dateRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>開始日 *</label>
                  <input
                    type="date"
                    value={formData.date_start}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      date_start: e.target.value,
                      date_end: prev.date_end || e.target.value
                    }))}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>終了日</label>
                  <input
                    type="date"
                    value={formData.date_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_end: e.target.value }))}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* 説明文 */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>説明文 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={styles.textarea}
                  placeholder="イベントの詳細な説明。#タグ名 の形式でタグを自動追加できます。"
                  required
                />
                <div style={styles.hint}>
                  💡 #タグ名 の形式で自動的にタグが追加されます
                </div>
              </div>

              {/* タグ */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>タグ</label>
                <div style={styles.tagContainer}>
                  {getAllTags().map((tag, index) => (
                    <span key={`${tag}-${index}`} style={styles.tag}>
                      {tag}
                      {formData.tags.includes(tag) && (
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          style={styles.removeTagButton}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  
                  <input
                    type="text"
                    style={styles.tagInput}
                    placeholder={getAllTags().length === 0 ? "タグを入力してEnterで追加" : "新しいタグ"}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        e.preventDefault();
                        addTag(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              {/* 参考資料 */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>参考資料（URL）</label>
                <div style={styles.sourcesList}>
                  {formData.sources.map((source, index) => (
                    <div key={index} style={styles.sourceRow}>
                      <input
                        type="url"
                        value={source}
                        onChange={(e) => updateSource(index, e.target.value)}
                        style={{ ...styles.input, ...styles.sourceInput }}
                        placeholder="https://example.com/reference"
                      />
                      {formData.sources.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSource(index)}
                          style={{ ...styles.sourceButton, ...styles.removeSourceButton }}
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSource}
                    style={{ ...styles.sourceButton, ...styles.addSourceButton }}
                  >
                    + 参考資料を追加
                  </button>
                </div>
                <div style={styles.hint}>
                  情報源となるWebサイトやドキュメントのURLを追加してください
                </div>
              </div>

              {/* ライセンス */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>ライセンス</label>
                <select
                  value={formData.license}
                  onChange={(e) => setFormData(prev => ({ ...prev, license: e.target.value }))}
                  style={styles.licenseSelect}
                >
                  <option value="CC-BY-SA-4.0">CC-BY-SA-4.0（表示-継承）</option>
                  <option value="CC-BY-4.0">CC-BY-4.0（表示）</option>
                  <option value="CC0-1.0">CC0-1.0（パブリックドメイン）</option>
                  <option value="GFDL-1.3">GFDL-1.3（GNU自由文書ライセンス）</option>
                </select>
                <div style={styles.hint}>
                  コンテンツの利用条件を選択してください
                </div>
              </div>

              {/* ボタン */}
              <div style={styles.buttonContainer}>
                <button
                  type="button"
                  onClick={onCancel}
                  style={{ ...styles.button, ...styles.cancelButton }}
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    ...styles.saveButton,
                    ...(loading || !formData.title.trim() || !formData.description.trim() ? styles.disabledButton : {})
                  }}
                  disabled={loading || !formData.title.trim() || !formData.description.trim()}
                >
                  {loading ? '保存中...' : (eventId ? 'リビジョンを保存' : 'イベントを作成')}
                </button>
              </div>
            </form>
          ) : (
            // プレビュー表示
            <div style={styles.previewContent}>
              <h1 style={styles.previewTitle}>
                {formData.title || 'タイトル未入力'}
              </h1>
              
              {formData.date_start && (
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  {new Date(formData.date_start).toLocaleDateString('ja-JP')}
                  {formData.date_end && formData.date_end !== formData.date_start && 
                    ` - ${new Date(formData.date_end).toLocaleDateString('ja-JP')}`
                  }
                </div>
              )}
              
              <div style={styles.previewDescription}>
                {formData.description || '説明文未入力'}
              </div>
              
              {getAllTags().length > 0 && (
                <div style={styles.previewTags}>
                  {getAllTags().map((tag, index) => (
                    <span key={index} style={styles.previewTag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              {formData.sources.some(source => source.trim()) && (
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>参考資料:</strong>
                  {formData.sources
                    .filter(source => source.trim())
                    .map((source, index) => (
                      <div key={index} style={{ marginBottom: '4px' }}>
                        <a 
                          href={source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'none' }}
                        >
                          {source}
                        </a>
                      </div>
                    ))}
                </div>
              )}
              
              <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                ライセンス: {formData.license}
              </div>
              
              {/* プレビューでも保存ボタンを表示 */}
              <div style={styles.buttonContainer}>
                <button
                  onClick={onCancel}
                  style={{ ...styles.button, ...styles.cancelButton }}
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    ...styles.button,
                    ...styles.saveButton,
                    ...(loading || !formData.title.trim() || !formData.description.trim() ? styles.disabledButton : {})
                  }}
                  disabled={loading || !formData.title.trim() || !formData.description.trim()}
                >
                  {loading ? '保存中...' : (eventId ? 'リビジョンを保存' : 'イベントを作成')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WikiRevisionForm;