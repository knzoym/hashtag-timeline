// supabase/functions/rev.revert/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // 認証確認
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const { revision_id } = body

    // バリデーション
    if (!revision_id) {
      return new Response(JSON.stringify({ 
        error: 'revision_id is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 指定されたリビジョンを取得
    const { data: targetRevision, error: revisionError } = await supabase
      .from('event_revisions')
      .select('*')
      .eq('rev_id', revision_id)
      .single()

    if (revisionError || !targetRevision) {
      return new Response(JSON.stringify({ 
        error: 'Revision not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // レート制限チェック（簡易版）
    const cutoff = new Date(Date.now() - 60 * 1000) // 60秒
    const { data: recentRevisions } = await supabase
      .from('event_revisions')
      .select('created_at')
      .eq('edited_by', user.id)
      .gte('created_at', cutoff.toISOString())

    if (recentRevisions && recentRevisions.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit: Please wait before creating another revision' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // リバート用の新しいリビジョンを作成
    // 元のリビジョンのデータをそのまま使用
    const { data: newRevision, error: createError } = await supabase
      .from('event_revisions')
      .insert({
        event_id: targetRevision.event_id,
        data: targetRevision.data,
        edited_by: user.id
      })
      .select()
      .single()

    if (createError) throw createError

    // 対応するeventsテーブルも更新（最新リビジョンの内容を反映）
    const revisionData = targetRevision.data
    await supabase
      .from('events')
      .update({
        title: revisionData.title,
        description: revisionData.description,
        date_start: revisionData.date_start,
        date_end: revisionData.date_end,
        tags: revisionData.tags || [],
        sources: revisionData.sources || [],
        license: revisionData.license || 'CC0',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetRevision.event_id)

    return new Response(JSON.stringify({
      success: true,
      new_revision: newRevision,
      reverted_to: revision_id,
      message: `Successfully reverted to revision ${revision_id}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})