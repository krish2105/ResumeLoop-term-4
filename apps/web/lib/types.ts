export type Kind = 'recap' | 'reading' | 'exercise' | 'assessment' | 'reflection';
export type DueStatus = 'none' | 'unverified' | 'verified' | 'conflict';

export type CourseAction = {
  id: string; title: string; session: number; kind: Kind; minutes: number | null;
  prerequisites: string[]; due: string | null; due_status: DueStatus; source_ref: string;
};

export type Source = {id: string; session: number; title: string; text: string};

export type CourseInfo = {
  course: string; notice: string; source_owner: string; timezone: string; schema_version: string;
  versions: string[]; version: string; published_at: string; actions: CourseAction[]; sources: Source[];
  source_type: 'SYNTHETIC';
};

export type ItemState = 'completed' | 'planned' | 'locked' | 'does-not-fit' | 'abstained';
export type PlanItem = CourseAction & {state: ItemState; reason: string; order?: number; needs?: string[]};

export type Plan = {
  method: string; budget_minutes: number; planned_minutes: number; remaining_minutes: number;
  next_action: string | null; sequence: string[]; items: PlanItem[]; warnings: string[];
  empty_reason: string | null; version?: string;
};

export type ProgressState = {
  completed: string[]; budget_minutes: number; seen_version: string;
  current_action: string | null; notes: Record<string, string>;
};
export type Progress = {version: number; state: ProgressState; updated_at: string | null};

export type Change = {
  id: string; type: 'added' | 'removed' | 'changed'; action_id: string; title: string; session: number;
  source_ref: string; field?: string; before?: unknown; after?: unknown; minutes?: number | null;
};
export type Diff = {from: string; to: string; changes: Change[]};
