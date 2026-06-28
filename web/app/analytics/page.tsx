'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SessionRecord } from '@/lib/sessions';

type Evaluation = {
  tool_correctness?: number;
  naturalness?: number;
  task_completion?: number;
  overall?: number;
  rationale?: string;
  error?: string;
};

const ACCENT = '#E63946';

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selected, setSelected] = useState<SessionRecord | null>(null);
  const [evals, setEvals] = useState<Record<string, Evaluation>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((d: SessionRecord[]) => {
        setSessions(d);
        setSelected(d[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = sessions.length;
  const avgDuration = total
    ? (sessions.reduce((a, s) => a + s.duration_sec, 0) / total).toFixed(1)
    : '0';
  const rates = sessions
    .map((s) => s.metrics.tool_success_rate)
    .filter((r): r is number => r != null);
  const avgSuccess = rates.length
    ? Math.round((rates.reduce((a, r) => a + r, 0) / rates.length) * 100)
    : null;

  async function evaluate(room: string) {
    setBusy(room);
    try {
      const r = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ room }),
      });
      const data = await r.json();
      setEvals((p) => ({ ...p, [room]: data }));
    } catch (e) {
      setEvals((p) => ({ ...p, [room]: { error: String(e) } }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Аналітика якості агента</h1>
        <Link href="/" style={{ color: ACCENT }}>
          ← На головну
        </Link>
      </div>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Stat label="Сесій" value={String(total)} />
        <Stat label="Середня тривалість, с" value={avgDuration} />
        <Stat label="Успішність tools" value={avgSuccess == null ? '—' : `${avgSuccess}%`} />
      </section>

      {loading ? (
        <p>Завантаження…</p>
      ) : total === 0 ? (
        <p>Поки немає сесій. Поговоріть з агентом — записи зʼявляться тут.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((s) => (
              <li
                key={s.room + s.started_at}
                onClick={() => setSelected(s)}
                style={{
                  cursor: 'pointer',
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${selected === s ? ACCENT : 'rgba(128,128,128,0.3)'}`,
                  background: selected === s ? 'rgba(230,57,70,0.08)' : 'transparent',
                }}
              >
                <div style={{ fontWeight: 600 }}>{s.room}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {new Date(s.started_at).toLocaleString('uk-UA')} · {s.duration_sec.toFixed(0)} с ·{' '}
                  {s.metrics.tool_call_count} викликів tools
                </div>
              </li>
            ))}
          </ul>

          {selected && (
            <div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <button
                  onClick={() => evaluate(selected.room)}
                  disabled={busy === selected.room}
                  style={{
                    background: ACCENT,
                    color: '#fff',
                    border: 0,
                    borderRadius: 8,
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  {busy === selected.room ? 'Оцінюю…' : 'Оцінити якість (LLM-суддя)'}
                </button>
              </div>

              {evals[selected.room] && <EvalCard ev={evals[selected.room]} />}

              <h3 style={{ fontWeight: 600, margin: '16px 0 8px' }}>Транскрипт</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.transcript.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: t.role === 'user' ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                    }}
                  >
                    <div style={{ fontSize: 11, opacity: 0.6 }}>
                      {t.role === 'user' ? 'Клієнт' : 'Агент'}
                    </div>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        background:
                          t.role === 'user' ? 'rgba(128,128,128,0.15)' : 'rgba(230,57,70,0.12)',
                      }}
                    >
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontWeight: 600, margin: '16px 0 8px' }}>Виклики tools</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.tool_calls.map((c, i) => (
                  <div key={i} style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    <span style={{ color: c.success ? 'green' : 'crimson' }}>
                      {c.success ? '✓' : '✗'}
                    </span>{' '}
                    {c.name}({JSON.stringify(c.args)})
                  </div>
                ))}
                {selected.tool_calls.length === 0 && <span style={{ opacity: 0.6 }}>—</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(128,128,128,0.25)' }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, opacity: 0.7 }}>{label}</div>
    </div>
  );
}

function EvalCard({ ev }: { ev: Evaluation }) {
  if (ev.error) return <p style={{ color: 'crimson' }}>Помилка оцінювання: {ev.error}</p>;
  const rows: [string, number | undefined][] = [
    ['Правильність tools', ev.tool_correctness],
    ['Природність', ev.naturalness],
    ['Виконання задачі', ev.task_completion],
    ['Загалом', ev.overall],
  ];
  return (
    <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${ACCENT}`, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {rows.map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>
              {v ?? '—'}
              <span style={{ fontSize: 13, opacity: 0.6 }}>/5</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{l}</div>
          </div>
        ))}
      </div>
      {ev.rationale && <p style={{ marginTop: 8, fontSize: 14 }}>{ev.rationale}</p>}
    </div>
  );
}
