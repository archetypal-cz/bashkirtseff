// ─── Paragraph Report Service ────────────────────────────────────────
//
// Submits translation issue reports to PostgREST API.
// JWT token is passed in Authorization header; PostgREST + RLS
// handle user_id assignment automatically.
//
// Usage:
//   import { submitReport } from '../lib/reports';
//   await submitReport({ paragraphId: '008.0145', language: 'cz', reason: 'typo' }, token);

const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.bashkirtseff.org';

declare const __GIT_COMMIT__: string;

// ─── Types ───────────────────────────────────────────────────────────

export type ReportReason =
  | 'bad_translation'
  | 'unnatural'
  | 'missing_text'
  | 'wrong_language'
  | 'factual_error'
  | 'typo'
  | 'other';

export interface ReportData {
  paragraphId: string;
  language: string;
  reason: ReportReason;
  customReason?: string;
  highlightedText?: string;
}

export interface Report {
  id: string;
  paragraph_id: string;
  language: string;
  reason: string;
  custom_reason: string | null;
  highlighted_text: string | null;
  status: string;
  created_at: string;
}

// ─── Public API ──────────────────────────────────────────────────────

export async function submitReport(data: ReportData, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/paragraph_reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      paragraph_id: data.paragraphId,
      language: data.language,
      commit_hash: typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : 'unknown',
      reason: data.reason,
      custom_reason: data.customReason || null,
      highlighted_text: data.highlightedText || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Report failed: ${res.status}`);
  }
}

export async function getMyReports(token: string): Promise<Report[]> {
  const res = await fetch(`${API_URL}/paragraph_reports?order=created_at.desc&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
  return res.json();
}
