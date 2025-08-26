// supabase/functions/rev.vote/index.ts
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
    const { revision_id, kind } = body

    // バリデーション
    if (!revision_id || !kind) {
      return new Response(JSON.stringify({ 
        error: 'revision_id and kind are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!['upvote', 'report'].includes(kind)) {
      return new Response(JSON.stringify({ 
        error: 'kind must be "upvote" or "report"' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // リビジョンの存在確認
    const { data: revision, error: revisionError } = await supabase
      .from('event_revisions')
      .select('rev_id, edited_by')
      .eq('rev_id', revision_id)
      .single()

    if (revisionError || !revision) {
      return new Response(JSON.stringify({ 
        error: 'Revision not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 自分の編集に投票することを防ぐ
    if (revision.edited_by === user.id) {
      return new Response(JSON.stringify({ 
        error: 'Cannot vote on your own revision' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 投票の upsert（同じ種類の投票は上書き、異なる種類は削除して新規作成）
    // まず既存の投票を削除
    await supabase
      .from('revision_votes')
      .delete()
      .eq('revision_id', revision_id)
      .eq('voter_uid', user.id)

    // 新しい投票を挿入
    const { error: voteError } = await supabase
      .from('revision_votes')
      .insert({
        revision_id,
        voter_uid: user.id,
        kind
      })

    if (voteError) throw voteError

    // 最新スコアを取得
    const { data: scoreData, error: scoreError } = await supabase
      .from('revision_scores')
      .select('upvotes, reports, stable_score')
      .eq('rev_id', revision_id)
      .single()

    if (scoreError) {
      console.error('Score fetch error:', scoreError)
    }

    // ユーザー評価を更新（非同期）
    updateUserReputation(supabase, revision.edited_by).catch(console.error)

    return new Response(JSON.stringify({
      success: true,
      revision_id,
      kind,
      scores: scoreData || { upvotes: 0, reports: 0, stable_score: 0 }
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

// ユーザー評価の更新（非同期）
async function updateUserReputation(supabase: any, userId: string) {
  try {
    // そのユーザーが受けたupvoteの総数を計算
    const { data: voteData } = await supabase
      .from('revision_votes')
      .select('*')
      .eq('kind', 'upvote')
      .in('revision_id', 
        supabase
          .from('event_revisions')
          .select('rev_id')
          .eq('edited_by', userId)
      )

    const score = voteData?.length || 0

    // user_reputationテーブルを更新
    await supabase
      .from('user_reputation')
      .upsert({
        user_id: userId,
        score,
        updated_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Reputation update error:', error)
  }
}
