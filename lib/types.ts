export type APIError = {
  code: string;
  message: string;
};

export type Me = {
  id: string;
  email: string;
  timezone: string;
  polishes_this_month: number;
  morning_reminder_hour: number | null;
  evening_reminder_hour: number | null;
  weekly_reminder_hour: number | null;
};

export type Client = {
  id: string;
  name: string;
  accent_color: string;
  archived: boolean;
  last_active_at: string;
  created_at: string;
};

export type Plan = {
  id: string;
  position: number;
  text: string;
  done: boolean;
  carried_from_entry_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type Entry = {
  id: string;
  client_id: string;
  entry_date: string;
  what_happened_md: string;
  carried_at?: string | null;
  created_at: string;
  updated_at: string;
  plans: Plan[];
};

export type CalendarDay = {
  date: string;
  has_entry: boolean;
};

export type TodayItem = {
  client: Client;
  entry: Entry;
};

export type PolishResult = {
  polished: string;
  model: string;
  event_id?: string;
};

export type Rollup = {
  id: string;
  client_id: string;
  /** YYYY-MM-DD Monday in user's TZ */
  week_start: string;
  generated_md: string;
  edited_md?: string | null;
  share_token?: string | null;
  shared_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
  updated_at: string;
};
