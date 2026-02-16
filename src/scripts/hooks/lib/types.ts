/**
 * Types for the hooks system
 */

export interface WorkerConfig {
  github_user: string;
  working_language: string;
  assigned_carnets?: string[];
  roles?: string[];
  auto_commit?: {
    enabled: boolean;
    frequency: 'after_entry' | 'after_carnet' | 'after_session' | 'manual';
    message_prefix?: string;
  };
  session?: {
    started_at: string | null;
    skills_used: string[];
  };
}

export interface RunReport {
  date: string;
  operator: string;
  duration_minutes: number | string;
  target_language: string;
  carnets: string[];
  pipeline: string[];
  skills: Record<string, string>;
  status: 'draft' | 'final' | 'reviewed';
}

export interface CarnetProgress {
  carnet: string;
  entries: number;
  research: number;
  annotation: number;
  translation: number;
  gemini: number;
  edited: number;
  approved: number;
  worker?: string;
}

export interface TodoItem {
  tag: string;
  entry?: string;
  description: string;
  source: 'original' | 'translation';
  syncDirection?: 'upstream' | 'downstream' | 'local';
}

export interface ChangelogEntry {
  timestamp: string;
  user: string;
  description: string;
}

export interface ReadmeData {
  carnet: string;
  language: string;
  summary?: string;
  status: CarnetProgress;
  todosFromOriginal: TodoItem[];
  todosLocal: TodoItem[];
  todosPropose: TodoItem[];
  whatsDone: string[];
  changelog: ChangelogEntry[];
  worker?: string;
  workerSince?: string;
}

export interface HookInput {
  tool_name?: string;
  tool_input?: {
    file_path?: string;
    content?: string;
    [key: string]: unknown;
  };
  tool_response?: unknown;
  session_id?: string;
  cwd?: string;
}

export interface HookOutput {
  success: boolean;
  message?: string;
  warnings?: string[];
  updated_files?: string[];
  [key: string]: unknown;
}
