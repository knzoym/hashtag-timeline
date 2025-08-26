// supabase/functions/shared/rate-limit.ts
export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export async function checkRateLimit(
  supabaseClient: any,
  userId: string,
  action: string,
  limit: number,
  windowMinutes: number
): Promise<void> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  // 過去の窓時間内のアクション数をカウント
  const { count, error } = await supabaseClient
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart.toISOString());
    
  if (error) {
    console.error('Rate limit check error:', error);
    // エラー時は通す（可用性を優先）
    return;
  }
  
  if (count && count >= limit) {
    const retryAfter = Math.ceil(windowMinutes * 60 - (Date.now() - windowStart.getTime()) / 1000);
    throw new RateLimitError(
      `レート制限: ${windowMinutes}分間に${limit}回まで`,
      retryAfter
    );
  }
  
  // レート制限記録を追加
  await supabaseClient.from('rate_limits').insert({
    user_id: userId,
    action: action,
    created_at: new Date().toISOString()
  });
}