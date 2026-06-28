import { promises as fs } from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

// Спільне сховище: на проді читаємо з Postgres (Vercel/Neon), локально — з файлів.
const DB_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

const DIR = path.join(process.cwd(), '..', 'data', 'sessions');

export type ToolCall = { name: string; args: unknown; result: unknown; success: boolean };
export type Turn = { role: string; text: string };
export type Evaluation = {
  tool_correctness?: number;
  naturalness?: number;
  task_completion?: number;
  overall?: number;
  rationale?: string;
};

export type SessionRecord = {
  room: string;
  started_at: string;
  ended_at: string;
  duration_sec: number;
  transcript: Turn[];
  tool_calls: ToolCall[];
  usage: Record<string, unknown>;
  metrics: { tool_call_count: number; tool_success_rate: number | null };
  evaluation?: Evaluation | null;
};

export async function listSessions(): Promise<SessionRecord[]> {
  return DB_URL ? listFromDb() : listFromFs();
}

/** Зберегти/оновити кешовану оцінку LLM-судді поруч із сесією (лише в БД-режимі). */
export async function saveEvaluation(room: string, evaluation: Evaluation): Promise<void> {
  if (!DB_URL) return;
  const sql = neon(DB_URL);
  await sql`UPDATE sessions SET evaluation = ${JSON.stringify(evaluation)}::jsonb WHERE room = ${room}`;
}

async function listFromDb(): Promise<SessionRecord[]> {
  const sql = neon(DB_URL!);
  const rows = (await sql`
    SELECT room, started_at, ended_at, duration_sec, transcript, tool_calls, usage, metrics, evaluation
    FROM sessions
    ORDER BY started_at DESC
  `) as Record<string, unknown>[];

  return rows.map((r) => ({
    room: String(r.room),
    started_at: toIso(r.started_at),
    ended_at: toIso(r.ended_at),
    duration_sec: Number(r.duration_sec ?? 0),
    transcript: (r.transcript as Turn[]) ?? [],
    tool_calls: (r.tool_calls as ToolCall[]) ?? [],
    usage: (r.usage as Record<string, unknown>) ?? {},
    metrics: (r.metrics as SessionRecord['metrics']) ?? {
      tool_call_count: 0,
      tool_success_rate: null,
    },
    evaluation: (r.evaluation as Evaluation | null) ?? null,
  }));
}

async function listFromFs(): Promise<SessionRecord[]> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const records = await Promise.all(
    files.map(
      async (f) => JSON.parse(await fs.readFile(path.join(DIR, f), 'utf-8')) as SessionRecord
    )
  );
  return records.sort((a, b) => b.started_at.localeCompare(a.started_at));
}

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}
