import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { listSessions, saveEvaluation } from '@/lib/sessions';

export const dynamic = 'force-dynamic';

const RUBRIC = `Ти — суворий, але справедливий рецензент якості голосового агента піцерії.
Оціни сесію за трьома критеріями (0–5 кожен):
1) tool_correctness — чи викликались потрібні функції в потрібний момент із правильними аргументами;
2) naturalness — чи репліки короткі, природні, без markdown і списків;
3) task_completion — чи виконано запит клієнта.
Поверни СТРОГО JSON без пояснень навколо:
{"tool_correctness":n,"naturalness":n,"task_completion":n,"overall":n,"rationale":"коротке пояснення українською"}`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as { room?: string });
  const room = (body as { room?: string }).room;
  if (!room) return NextResponse.json({ error: 'room required' }, { status: 400 });

  const session = (await listSessions()).find((s) => s.room === room);
  if (!session) return NextResponse.json({ error: 'session not found' }, { status: 404 });

  // LLM-as-judge через OpenRouter (DeepSeek V4 Pro — суттєво дешевше за gpt-4.1)
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: { 'X-Title': 'pizza-voice-agent' },
  });
  try {
    const completion = await client.chat.completions.create({
      model: 'deepseek/deepseek-v4-pro',
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
    await saveEvaluation(room, result).catch(() => {}); // кешуємо поруч із сесією (best-effort)
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
