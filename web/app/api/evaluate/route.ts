import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { listSessions } from '@/lib/sessions';

export const dynamic = 'force-dynamic';

const RUBRIC = `Ти — суворий, але справедливий рецензент якості голосового агента піцерії.
Оціни сесію за трьома критеріями (0–5 кожен):
1) tool_correctness — чи викликались потрібні функції в потрібний момент із правильними аргументами;
2) naturalness — чи репліки короткі, природні, без markdown і списків;
3) task_completion — чи виконано запит клієнта.
Поверни СТРОГО JSON без пояснень навколо:
{"tool_correctness":n,"naturalness":n,"task_completion":n,"overall":n,"rationale":"коротке пояснення українською"}`;

export async function POST(req: Request) {
  const { room } = await req.json();
  const session = (await listSessions()).find((s) => s.room === room);
  if (!session) return NextResponse.json({ error: 'session not found' }, { status: 404 });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4.1',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: RUBRIC },
        {
          role: 'user',
          content: JSON.stringify({
            transcript: session.transcript,
            tool_calls: session.tool_calls,
          }),
        },
      ],
    });
    const result = JSON.parse(completion.choices[0].message.content ?? '{}');
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
