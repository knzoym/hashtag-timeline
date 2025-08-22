// src/hooks/useSupabaseSync.js
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useSupabaseSync = (user) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // プロファイル作成・更新
  const upsertProfile = useCallback(async (profileData) => {
    if (!user) return null

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profileData.username || user.email.split('@')[0],
          display_name: profileData.display_name || user.user_metadata?.full_name || user.email,
          ...profileData
        })
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('プロファイル保存エラー:', error)
      setError(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // 年表データ保存
  const saveTimelineData = useCallback(async (timelineData, title) => {
    if (!user) return null

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_timelines')
        .insert({
          user_id: user.id,
          timeline_data: timelineData,
          title: title || `年表 ${new Date().toLocaleDateString('ja-JP')}`,
        })
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('年表保存エラー:', error)
      setError(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // 年表データ更新
  const updateTimelineData = useCallback(async (timelineId, timelineData, title) => {
    if (!user) return null

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_timelines')
        .update({
          timeline_data: timelineData,
          title: title,
          updated_at: new Date().toISOString()
        })
        .eq('id', timelineId)
        .eq('user_id', user.id)
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('年表更新エラー:', error)
      setError(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // ユーザーの年表一覧取得
  const getUserTimelines = useCallback(async () => {
    if (!user) return []

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_timelines')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('年表取得エラー:', error)
      setError(error.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // 年表削除
  const deleteTimeline = useCallback(async (timelineId) => {
    if (!user) return false

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('user_timelines')
        .delete()
        .eq('id', timelineId)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('年表削除エラー:', error)
      setError(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    loading,
    error,
    upsertProfile,
    saveTimelineData,
    updateTimelineData,
    getUserTimelines,
    deleteTimeline
  }
}