export type Event = {
  id: string;
  title: string;
  description: string;
  date_precision: 'year' | 'month' | 'day';
  date_year: number;
  date_month?: number;
  date_day?: number;
  date_display?: string;
  hashtags: string[];
  created_at: string;
  updated_at: string;
};

export type Timeline = {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  logic: { 
    mode: 'AND' | 'OR'; 
  };
  date_range?: {
    start_year?: number;
    end_year?: number;
  };
  created_at: string;
  updated_at: string;
};

export type TimelineEventOverride = {
  timeline_id: string;
  event_id: string;
  override: 'register' | 'hide';
  notes?: string;
  created_at: string;
};