// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 接続テスト用の関数
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    console.log('Supabase接続成功:', data)
    return true
  } catch (error) {
    console.error('Supabase接続エラー:', error)
    return false
  }
}