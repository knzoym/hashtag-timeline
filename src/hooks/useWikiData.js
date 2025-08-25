// src/hooks/useWikiData.js
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useWikiData = (user) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 共用イベント取得
  const getSharedEvents = useCallback(async (searchTerm = '', limit = 50) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('shared_events')
        .select(`
          *,
          profiles:created_by(display_name, username)
        `)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (searchTerm.trim()) {
        // タイトルまたはタグで検索
        query = query.or(`title.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('共用イベント取得エラー:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 新しい共用イベント作成
  const createSharedEvent = useCallback(async (eventData) => {
    if (!user) return null;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('shared_events')
        .insert({
          title: eventData.title,
          start_date: eventData.startDate.toISOString().split('T')[0],
          description: eventData.description || '',
          tags: eventData.tags || [],
          created_by: user.id
        })
        .select(`
          *,
          profiles:created_by(display_name, username)
        `);

      if (error) throw error;

      // 編集履歴に記録
      await supabase.from('event_edits').insert({
        event_id: data[0].id,
        user_id: user.id,
        edit_type: 'create'
      });

      return data[0];
    } catch (err) {
      console.error('共用イベント作成エラー:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 共用イベント更新
  const updateSharedEvent = useCallback(async (eventId, updates) => {
    if (!user) return null;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('shared_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          edit_count: supabase.raw('edit_count + 1')
        })
        .eq('id', eventId)
        .select(`
          *,
          profiles:created_by(display_name, username)
        `);

      if (error) throw error;

      // 編集履歴に記録
      await supabase.from('event_edits').insert({
        event_id: eventId,
        user_id: user.id,
        edit_type: 'update'
      });

      return data[0];
    } catch (err) {
      console.error('共用イベント更新エラー:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 個人ファイルにインポート
  const importEventToPersonal = useCallback((sharedEvent) => {
    // 共用イベントを個人用の形式に変換
    return {
      id: Date.now(), // 新しいIDを生成
      title: sharedEvent.title,
      startDate: new Date(sharedEvent.start_date),
      endDate: new Date(sharedEvent.start_date),
      description: sharedEvent.description || '',
      tags: sharedEvent.tags || [],
      // 出典情報を残す
      source: {
        type: 'wiki',
        originalId: sharedEvent.id,
        importedAt: new Date()
      }
    };
  }, []);

  // 編集履歴取得
  const getEventHistory = useCallback(async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('event_edits')
        .select(`
          *,
          profiles:user_id(display_name, username)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('履歴取得エラー:', err);
      return [];
    }
  }, []);

  // 最近の編集活動取得
  const getRecentActivity = useCallback(async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('event_edits')
        .select(`
          *,
          shared_events!inner(title),
          profiles:user_id(display_name, username)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('活動履歴取得エラー:', err);
      return [];
    }
  }, []);

  // 人気のタグ取得
  const getPopularTags = useCallback(async (limit = 10) => {
    try {
      const { data, error } = await supabase.rpc('get_popular_tags', {
        tag_limit: limit
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('人気タグ取得エラー:', err);
      return [];
    }
  }, []);

  return {
    loading,
    error,
    getSharedEvents,
    createSharedEvent,
    updateSharedEvent,
    importEventToPersonal,
    getEventHistory,
    getRecentActivity,
    getPopularTags
  };
};