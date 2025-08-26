// supabase/functions/rev.create/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 環境変数から設定を読み込み
const NG_WORDS = (Deno.env.get('NG_WORDS') || '').split(',').filter(Boolean)
const MAX_URLS = 5
const RATE_LIMIT_SECONDS = 60

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
    const { eventId, slug, payload } = body
    const { title, description, date_start, date_end, tags, sources, license } = payload

    // バリデーション
    const validation = validatePayload(payload)
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // レート制限チェック
    const rateLimit = await checkRateLimit(supabase, user.id)
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: `Rate limit exceeded. Try again in ${rateLimit.waitTime} seconds` 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let targetEventId = eventId

    // 新しいイベント作成が必要な場合
    if (!targetEventId) {
      const newSlug = slug || generateSlug(title)
      
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          title,
          date_start,
          date_end,
          description,
          tags: tags || [],
          sources: sources || [],
          license: license || 'CC0',
          slug: newSlug,
          created_by: user.id
        })
        .select()
        .single()

      if (eventError) throw eventError
      targetEventId = newEvent.id
    }

    // リビジョン作成
    const revisionData = {
      title,
      description,
      date_start,
      date_end,
      tags: tags || [],
      sources: sources || [],
      license: license || 'CC0'
    }

    const { data: revision, error: revisionError } = await supabase
      .from('event_revisions')
      .insert({
        event_id: targetEventId,
        data: revisionData,
        edited_by: user.id
      })
      .select()
      .single()

    if (revisionError) throw revisionError

    return new Response(JSON.stringify({
      revision,
      event_id: targetEventId
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

// バリデーション関数
function validatePayload(payload: any) {
  const { title, description, sources } = payload

  // 必須フィールド
  if (!title || !description) {
    return { valid: false, error: 'Title and description are required' }
  }

  // 文字数制限
  if (title.length < 2 || title.length > 64) {
    return { valid: false, error: 'Title must be 2-64 characters' }
  }

  if (description.length < 50 || description.length > 4000) {
    return { valid: false, error: 'Description must be 50-4000 characters' }
  }

  // 禁止語チェック
  const text = `${title} ${description}`.toLowerCase()
  for (const ngWord of NG_WORDS) {
    if (text.includes(ngWord.toLowerCase())) {
      return { valid: false, error: 'Content contains prohibited words' }
    }
  }

  // URL数制限
  if (sources && sources.length > MAX_URLS) {
    return { valid: false, error: `Maximum ${MAX_URLS} sources allowed` }
  }

  return { valid: true }
}

// レート制限チェック
async function checkRateLimit(supabase: any, userId: string) {
  const cutoff = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000)
  
  const { data, error } = await supabase
    .from('event_revisions')
    .select('created_at')
    .eq('edited_by', userId)
    .gte('created_at', cutoff.toISOString())

  if (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true }
  }

  if (data.length > 0) {
    const lastEdit = new Date(data[0].created_at)
    const waitTime = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (Date.now() - lastEdit.getTime())) / 1000)
    return { allowed: false, waitTime }
  }

  return { allowed: true }
}

// スラッグ生成
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) + '-' + Date.now()
}