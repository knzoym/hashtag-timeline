// supabase/functions/shared/types.ts
export interface CreateRevisionPayload {
  eventId?: string;
  slug?: string;
  payload: {
    title: string;
    description: string;
    date_start: string;
    date_end: string;
    tags: string[];
    sources?: string[];
    license?: string;
  };
}

export interface VotePayload {
  revision_id: string;
  kind: 'upvote' | 'report';
}

export interface RevertPayload {
  revision_id: string;
}

export interface RevisionScore {
  revision_id: string;
  upvotes: number;
  reports: number;
  stable_score: number;
}