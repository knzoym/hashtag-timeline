// src/hooks/useSampleSync.js
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sampleEvents } from '../lib/SampleEvents';

export const useSampleSync = (user) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null);

  // ローカルサンプルイベントをSupabase形式に変換
  const convertToSupabaseFormat = useCallback((localEvent) => {
    return {
      title: localEvent.title,
      description: localEvent.description || '',
      date_start: localEvent.startDate.toISOString().split('T')[0],
      date_end: localEvent.endDate ? localEvent.endDate.toISOString().split('T')[0] : null,
      tags: localEvent.tags || [],
      sources: [], // 初期は空配列
      license: 'CC0', // デフォルトライセンス
      // created_by は認証ユーザーで自動設定
      // id, created_at, updated_at は自動生成
    };
  }, []);

  // Supabaseイベントをローカル形式に変換
  const convertToLocalFormat = useCallback((supabaseEvent) => {
    return {
      id: Date.now() + Math.random(), // ローカル用の一意ID生成
      title: supabaseEvent.title,
      description: supabaseEvent.description || '',
      startDate: new Date(supabaseEvent.date_start),
      endDate: supabaseEvent.date_end ? new Date(supabaseEvent.date_end) : null,
      tags: Array.isArray(supabaseEvent.tags) ? supabaseEvent.tags : [],
      timelineInfos: [], // 個人ファイル用フィールド
      // Supabase情報を保持
      supabaseInfo: {
        originalId: supabaseEvent.id,
        importedAt: new Date(),
        license: supabaseEvent.license || 'CC0'
      }
    };
  }, []);

  // 既存イベントとの重複チェック（タイトルと日付で判定）
  const checkDuplicates = useCallback(async (localEvents) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date_start');
      
      if (error) throw error;

      const existingEvents = data || [];
      const duplicates = [];
      const newEvents = [];

      localEvents.forEach(localEvent => {
        const isDuplicate = existingEvents.some(existing => 
          existing.title === localEvent.title && 
          existing.date_start === localEvent.startDate.toISOString().split('T')[0]
        );

        if (isDuplicate) {
          duplicates.push(localEvent);
        } else {
          newEvents.push(localEvent);
        }
      });

      return { duplicates, newEvents, existingCount: existingEvents.length };
    } catch (err) {
      console.error('重複チェックエラー:', err);
      throw err;
    }
  }, []);

  // サンプルイベントを一括でSupabaseに登録
  const syncSampleEventsToSupabase = useCallback(async () => {
    if (!user) {
      throw new Error('Supabaseへの登録にはログインが必要です');
    }

    try {
      setLoading(true);
      setError(null);
      setSyncProgress({ phase: 'checking', message: '重複をチェック中...' });

      // 重複チェック
      const { duplicates, newEvents } = await checkDuplicates(sampleEvents);
      
      if (newEvents.length === 0) {
        setSyncProgress({ 
          phase: 'complete', 
          message: `全${sampleEvents.length}件のイベントは既に登録済みです` 
        });
        return { success: true, added: 0, skipped: duplicates.length };
      }

      setSyncProgress({ 
        phase: 'converting', 
        message: `${newEvents.length}件の新規イベントを変換中...` 
      });

      // ローカル形式をSupabase形式に変換
      const supabaseEvents = newEvents.map(convertToSupabaseFormat);

      setSyncProgress({ 
        phase: 'uploading', 
        message: `${supabaseEvents.length}件をSupabaseに登録中...` 
      });

      // Supabaseに一括登録
      const { data, error } = await supabase
        .from('events')
        .insert(supabaseEvents)
        .select();

      if (error) throw error;

      setSyncProgress({ 
        phase: 'complete', 
        message: `登録完了: ${data.length}件追加, ${duplicates.length}件スキップ` 
      });

      console.log('✅ サンプルイベント同期完了:', {
        added: data.length,
        skipped: duplicates.length,
        total: sampleEvents.length
      });

      return { 
        success: true, 
        added: data.length, 
        skipped: duplicates.length,
        addedEvents: data
      };

    } catch (err) {
      console.error('サンプルイベント同期エラー:', err);
      setError(err.message);
      setSyncProgress({ 
        phase: 'error', 
        message: `同期エラー: ${err.message}` 
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, checkDuplicates, convertToSupabaseFormat]);

  // Wikiイベントを個人ファイルにインポート
  const importWikiEventsToPersonal = useCallback((wikiEvents) => {
    if (!Array.isArray(wikiEvents) || wikiEvents.length === 0) {
      return [];
    }

    try {
      const importedEvents = wikiEvents.map(convertToLocalFormat);
      
      console.log('📥 Wikiから個人ファイルにインポート:', {
        count: importedEvents.length,
        titles: importedEvents.map(e => e.title)
      });

      return importedEvents;
    } catch (err) {
      console.error('Wikiイベントインポートエラー:', err);
      setError(err.message);
      return [];
    }
  }, [convertToLocalFormat]);

  // 個別イベントのインポート（モーダル・EventEditタブ用）
  const importSingleEventToPersonal = useCallback((wikiEvent) => {
    if (!wikiEvent) return null;

    try {
      const importedEvent = convertToLocalFormat(wikiEvent);
      
      console.log('📥 単体イベントインポート:', importedEvent.title);
      
      return importedEvent;
    } catch (err) {
      console.error('単体イベントインポートエラー:', err);
      setError(err.message);
      return null;
    }
  }, [convertToLocalFormat]);

  // Wiki検索結果から一時年表を個人ファイル用に変換
  const convertWikiTimelineToPersonal = useCallback((wikiEvents, timelineName) => {
    if (!Array.isArray(wikiEvents) || wikiEvents.length === 0) {
      return null;
    }

    try {
      const importedEvents = wikiEvents.map(convertToLocalFormat);
      
      // 一時年表データを個人ファイル形式で作成
      const personalTimeline = {
        id: Date.now(),
        name: timelineName || 'Wikiから作成した年表',
        events: importedEvents,
        createdAt: new Date(),
        source: {
          type: 'wiki_import',
          originalCount: wikiEvents.length,
          importedAt: new Date()
        }
      };

      console.log('📋 Wiki年表を個人用に変換:', {
        timelineName: personalTimeline.name,
        eventCount: importedEvents.length
      });

      return personalTimeline;
    } catch (err) {
      console.error('Wiki年表変換エラー:', err);
      setError(err.message);
      return null;
    }
  }, [convertToLocalFormat]);

  // 同期状態のリセット
  const resetSyncState = useCallback(() => {
    setError(null);
    setSyncProgress(null);
  }, []);

  return {
    loading,
    error,
    syncProgress,
    syncSampleEventsToSupabase,
    importWikiEventsToPersonal,
    importSingleEventToPersonal,
    convertWikiTimelineToPersonal,
    resetSyncState,
    // ユーティリティ関数も公開
    convertToSupabaseFormat,
    convertToLocalFormat,
    checkDuplicates
  };
};