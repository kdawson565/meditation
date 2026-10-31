export type PracticeId = "past_self" | "mental_subtraction" | "win_thank" | "grind" | "invisible_chain" | "counted_days" | "enough_line" | "play" | "control" | "one_move" | "future_pull" | "whose_hunger" | "short_day";

export type SailResult = "filled" | "partly" | "not";

export interface EnoughLine {
  money: string;
  health: string;
  relationships: string;
  time: string;
}

export interface Profile {
  id: "me";
  name: string;
  ritualTime: string; // "HH:MM"
  enough: EnoughLine;
  countedDays: boolean;
  notify: boolean;
  aiConsent: boolean;
  theme: "system" | "light" | "dark";
  timezone: string;
  lenses?: string[];
  createdAt: string;
  updatedAt: string;
  dirty: 0 | 1;
}

export interface Checkin {
  id: string;
  localDate: string; // YYYY-MM-DD, day rolls over at 4am
  drive: number;
  peace: number;
  peaceAfter?: number;
  driveAfter?: number;
  createdAt: string;
  updatedAt: string;
  dirty: 0 | 1;
}

export interface Entry {
  id: string;
  localDate: string;
  practice: PracticeId;
  prompt: string; // snapshot of the prompt shown
  fields: Record<string, string>; // practice-specific answers
  body: string; // the main reflective text, used for search + display
  tags: string[];
  sail?: string;
  floor?: string;
  /** answered at the next check-in: did yesterday's Sail fill? */
  sailResult?: SailResult;
  checkinId?: string;
  resurfaceOn?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  dirty: 0 | 1;
}

export interface Resurfaced {
  entryId: string;
  shownOn: string;
}

export interface LedgerItem {
  id: string;
  kind: "want" | "asset";
  text: string;
  wantId?: string; // an asset may counterweight a specific want; a want can have many assets
  arrivedOn?: string; // want: the day it was reached ("I got it")
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  dirty: 0 | 1;
}

/** Arrival Audit: after a want is reached, check back at 30 and 90 days: how long did the glow last? */
export interface Audit {
  id: string;
  wantId: string;
  days: 30 | 90;
  dueOn: string;
  glow?: number; // 1-10
  note?: string;
  answeredAt?: string;
  createdAt: string;
  updatedAt: string;
  dirty: 0 | 1;
}

export interface Thank {
  id: string;
  person: string;
  reason: string;
  status: "owed" | "sent";
  draft?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  dirty: 0 | 1;
}

export interface Reflection {
  id: string;
  weekStart: string; // the Monday the week begins
  body: string;
  source: "ai" | "local";
  createdAt: string;
  updatedAt: string;
  dirty: 0 | 1;
}
