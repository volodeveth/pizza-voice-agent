import { promises as fs } from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), '..', 'data', 'sessions');

export type ToolCall = { name: string; args: unknown; result: unknown; success: boolean };
export type Turn = { role: string; text: string };

export type SessionRecord = {
  room: string;
  started_at: string;
  ended_at: string;
  duration_sec: number;
  transcript: Turn[];
  tool_calls: ToolCall[];
  usage: Record<string, unknown>;
  metrics: { tool_call_count: number; tool_success_rate: number | null };
};

export async function listSessions(): Promise<SessionRecord[]> {
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
