// src/components/wiki/WikiRevisionForm.js
import React, { useState, useEffect } from 'react';
import { extractTagsFromDescription } from '../../utils/timelineUtils';

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

  // フォーム送信 - 修正版
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('ログインが必要です');
      return;
    }

    // バリデーション
    if (!formData.title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    if (!formData.description.trim()) {
      setError('説明文は必須です');
      return;
    }
    if (!formData.date_start) {
      setError('開始日は必須です');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // セッション取得
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw new Error('認証セッションの取得に失敗しました');
      if (!session) throw new Error('ログインが必要です');

      // ペイロード準備
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date_start: formData.date_start,
        date_end: formData.date_end || formData.date_start,
        tags: getAllTags(),
        sources: formData.sources.filter(source => source.trim()),
        license: formData.license
      };

      // リクエストボディ準備
      const requestBody = eventId 
        ? { eventId, payload } 
        : slug 
          ? { slug, payload }
          : { payload };

      console.log('API呼び出し開始:', {
        endpoint: `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-create`,
        hasEventId: !!eventId,
        hasSlug: !!slug,
        payloadKeys: Object.keys(payload)
      });

      // API呼び出し - エンドポイント統一
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(requestBody)
      });

      // レスポンス処理
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(`サーバーレスポンスの解析に失敗しました: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMessage = result.message || result.error || `HTTPエラー: ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log('API呼び出し成功:', result);
      
      // 成功時の処理
      if (onSave) {
        onSave(result.data || result);
      }
      
      // ユーザーに成功メッセージを表示
      alert(eventId ? 'リビジョンを保存しました！' : '新しいイベントを作成しました！');
      
    } catch (error) {
      console.error('保存エラー:', error);
      
      // エラー種別に応じたメッセージ
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'ネットワーク接続エラー：インターネット接続を確認してください';
      } else if (error.message.includes('401') || error.message.includes('認証')) {
        errorMessage = '認証エラー：再度ログインしてください';
      } else if (error.message.includes('403')) {
        errorMessage = '権限エラー：この操作を実行する権限がありません';
      } else if (error.message.includes('500')) {
        errorMessage = 'サーバーエラー：しばらく時間をおいてから再度お試しください';
      }
      
      setError(errorMessage);
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
    errorAlert: {
      backgroundColor: '#fee2e2',
      border: '1px solid #fca5a5',
      color: '#dc2626',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '14px'
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
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    textarea: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '120px',
      resize: 'vertical',
      outline: 'none',
      transition: 'border-color 0.2s'
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
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    tagRemoveButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '0',
      marginLeft: '2px'
    },
    autoTagsContainer: {
      marginTop: '8px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px'
    },
    autoTag: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    sourceRow: {
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-end'
    },
    sourceInput: {
      flex: 1,
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none'
    },
    sourceButton: {
      padding: '8px 12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    addSourceButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    removeSourceButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    licenseSelect: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: 'white'
    },
    hint: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px',
      fontStyle: 'italic'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s'
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
      backgroundColor: '#d1d5db',
      color: '#9ca3af',
      cursor: 'not-allowed'
    },
    previewContent: {
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    previewTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '12px'
    },
    previewDescription: {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.6',
      marginBottom: '16px',
      whiteSpace: 'pre-wrap'
    },
    previewTags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginBottom: '16px'
    },
    previewTag: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px'
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {eventId ? 'イベント編集' : '新しいイベント作成'}
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
                ...(preview ? {} : styles.toggleButtonActive)
              }}
            >
              編集
            </button>
            <button
              onClick={() => setPreview(true)}
              style={{
                ...styles.toggleButton,
                ...(preview ? styles.toggleButtonActive : {})
              }}
            >
              プレビュー
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div style={styles.errorAlert}>
              {error}
            </div>
          )}

          {!preview ? (
            // 編集フォーム
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* タイトル */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>タイトル *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    ...styles.input,
                    borderColor: !formData.title.trim() ? '#ef4444' : '#d1d5db'
                  }}
                  placeholder="イベントのタイトルを入力してください"
                  maxLength={100}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = !formData.title.trim() ? '#ef4444' : '#d1d5db'}
                />
              </div>

              {/* 日付 */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>日付 *</label>
                <div style={styles.dateRow}>
                  <div>
                    <input
                      type="date"
                      value={formData.date_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_start: e.target.value }))}
                      style={{
                        ...styles.input,
                        borderColor: !formData.date_start ? '#ef4444' : '#d1d5db'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = !formData.date_start ? '#ef4444' : '#d1d5db'}
                    />
                    <div style={styles.hint}>開始日</div>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={formData.date_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_end: e.target.value }))}
                      style={styles.input}
                      min={formData.date_start}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                    <div style={styles.hint}>終了日（任意）</div>
                  </div>
                </div>
              </div>

              {/* 説明文 */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>説明文 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    ...styles.textarea,
                    borderColor: !formData.description.trim() ? '#ef4444' : '#d1d5db'
                  }}
                  placeholder="イベントの詳細な説明を入力してください。#タグを含めることでタグが自動抽出されます。"
                  maxLength={2000}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = !formData.description.trim() ? '#ef4444' : '#d1d5db'}
                />
                <div style={styles.hint}>
                  #{formData.description.length}/2000文字 • #タグを含めると自動で抽出されます
                </div>
              </div>

              {/* タグ管理 */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>タグ</label>
                <div style={styles.tagContainer}>
                  {formData.tags.map((tag, index) => (
                    <span key={index} style={styles.tag}>
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        style={styles.tagRemoveButton}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                
                {/* 自動抽出タグ */}
                {extractTagsFromDescription(formData.description).length > 0 && (
                  <div style={styles.autoTagsContainer}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      説明文から抽出されたタグ:
                    </div>
                    {extractTagsFromDescription(formData.description).map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addTag(tag)}
                        style={{
                          ...styles.autoTag,
                          backgroundColor: formData.tags.includes(tag) ? '#dbeafe' : '#f3f4f6'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = formData.tags.includes(tag) ? '#dbeafe' : '#f3f4f6'}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 参考資料 */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>参考資料</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.sources.map((source, index) => (
                    <div key={index} style={styles.sourceRow}>
                      <input
                        type="url"
                        value={source}
                        onChange={(e) => updateSource(index, e.target.value)}
                        style={styles.sourceInput}
                        placeholder="https://example.com"
                      />
                      {formData.sources.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSource(index)}
                          style={{ ...styles.sourceButton, ...styles.removeSourceButton }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
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
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
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
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e5e7eb')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f3f4f6')}
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
                  onMouseEnter={(e) => {
                    if (!loading && formData.title.trim() && formData.description.trim()) {
                      e.target.style.backgroundColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && formData.title.trim() && formData.description.trim()) {
                      e.target.style.backgroundColor = '#3b82f6';
                    }
                  }}
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
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e5e7eb')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f3f4f6')}
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
                  onMouseEnter={(e) => {
                    if (!loading && formData.title.trim() && formData.description.trim()) {
                      e.target.style.backgroundColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && formData.title.trim() && formData.description.trim()) {
                      e.target.style.backgroundColor = '#3b82f6';
                    }
                  }}
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