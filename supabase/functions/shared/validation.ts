// supabase/functions/shared/validation.ts
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidationConfig {
  TITLE_MIN_LENGTH: number;
  TITLE_MAX_LENGTH: number;
  DESCRIPTION_MIN_LENGTH: number;
  DESCRIPTION_MAX_LENGTH: number;
  MAX_SOURCES: number;
  MAX_TAGS: number;
  FORBIDDEN_WORDS: string[];
}

export function getValidationConfig(): ValidationConfig {
  const env = Deno.env.toObject();
  
  return {
    TITLE_MIN_LENGTH: parseInt(env.TITLE_MIN_LENGTH || '2'),
    TITLE_MAX_LENGTH: parseInt(env.TITLE_MAX_LENGTH || '64'),
    DESCRIPTION_MIN_LENGTH: parseInt(env.DESCRIPTION_MIN_LENGTH || '10'), // 50から10に緩和
    DESCRIPTION_MAX_LENGTH: parseInt(env.DESCRIPTION_MAX_LENGTH || '4000'),
    MAX_SOURCES: parseInt(env.MAX_SOURCES || '5'),
    MAX_TAGS: parseInt(env.MAX_TAGS || '10'),
    FORBIDDEN_WORDS: (env.FORBIDDEN_WORDS || '').split(',').filter(Boolean),
  };
}

export function validateRevisionPayload(payload: CreateRevisionPayload['payload']): void {
  const config = getValidationConfig();
  
  // タイトル検証
  if (!payload.title || payload.title.trim().length < config.TITLE_MIN_LENGTH) {
    throw new ValidationError(`タイトルは${config.TITLE_MIN_LENGTH}文字以上必要です`, 'title');
  }
  if (payload.title.length > config.TITLE_MAX_LENGTH) {
    throw new ValidationError(`タイトルは${config.TITLE_MAX_LENGTH}文字以下にしてください`, 'title');
  }
  
  // 説明文検証
  if (!payload.description || payload.description.trim().length < config.DESCRIPTION_MIN_LENGTH) {
    throw new ValidationError(`説明文は${config.DESCRIPTION_MIN_LENGTH}文字以上必要です`, 'description');
  }
  if (payload.description.length > config.DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`説明文は${config.DESCRIPTION_MAX_LENGTH}文字以下にしてください`, 'description');
  }
  
  // 日付検証
  const startDate = new Date(payload.date_start);
  const endDate = new Date(payload.date_end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ValidationError('無効な日付形式です', 'date');
  }
  if (startDate > endDate) {
    throw new ValidationError('開始日が終了日より後になっています', 'date');
  }
  
  // タグ検証
  if (!Array.isArray(payload.tags)) {
    throw new ValidationError('tagsは配列である必要があります', 'tags');
  }
  if (payload.tags.length > config.MAX_TAGS) {
    throw new ValidationError(`タグは${config.MAX_TAGS}個以下にしてください`, 'tags');
  }
  
  // ソース検証
  if (payload.sources && !Array.isArray(payload.sources)) {
    throw new ValidationError('sourcesは配列である必要があります', 'sources');
  }
  if (payload.sources && payload.sources.length > config.MAX_SOURCES) {
    throw new ValidationError(`参考資料は${config.MAX_SOURCES}個以下にしてください`, 'sources');
  }
  
  // URL検証
  if (payload.sources) {
    for (const url of payload.sources) {
      try {
        new URL(url);
      } catch {
        throw new ValidationError(`無効なURL: ${url}`, 'sources');
      }
    }
  }
  
  // 禁止語チェック
  const textToCheck = `${payload.title} ${payload.description}`.toLowerCase();
  for (const word of config.FORBIDDEN_WORDS) {
    if (textToCheck.includes(word.toLowerCase())) {
      throw new ValidationError('不適切な内容が含まれています', 'content');
    }
  }
}