// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 初回セッション取得
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('セッション取得エラー:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    getSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)
      }
    )

    // クリーンアップ
    return () => subscription?.unsubscribe()
  }, [])

  // Googleログイン
  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('ログインエラー:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  // ログアウト
  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('ログアウトエラー:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user
  }
}