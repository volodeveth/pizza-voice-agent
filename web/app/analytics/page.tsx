'use client';

import { useEffect, useState } from 'react';
import type { SessionRecord } from '@/lib/sessions';

type Evaluation = {
  tool_correctness?: number;
  naturalness?: number;
  task_completion?: number;
  overall?: number;
  rationale?: string;
  error?: string;
};

const ANALYTICS_PASSWORD = 'qwerty12345';
const UNLOCK_KEY = 'analytics-unlocked';

export default function AnalyticsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === '1');
    setChecked(true);
  }, []);

  // Чекаємо першого клієнтського рендеру, щоб уникнути миготіння гейту/SSR-розбіжності.
  if (!checked) return <main className="bg-coal min-h-svh" />;

  if (!unlocked) {
    return (
      <PasswordGate
        onUnlock={() => {
          sessionStorage.setItem(UNLOCK_KEY, '1');
          setUnlocked(true);
        }}
      />
    );
  }

  return <Dashboard />;
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value === ANALYTICS_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
    }
  }

  return (
    <main className="bg-coal text-cream flex min-h-svh items-center justify-center px-5 pt-24 pb-16">
      <form
        onSubmit={submit}
        className="border-char/70 bg-surface w-full max-w-sm rounded-2xl border p-7"
      >
        <span className="ember-glow ember-breathe mb-5 block size-4 rounded-full" aria-hidden />
        <p className="text-ember font-mono text-xs font-bold tracking-[0.22em] uppercase">
          Доступ за паролем
        </p>
        <h1 className="font-display text-cream mt-2 text-2xl font-bold tracking-tight">
          Аналітика
        </h1>
        <p className="text-ash mt-2 text-sm">Введіть пароль, щоб переглянути дані сесій.</p>

        <label htmlFor="analytics-password" className="sr-only">
          Пароль
        </label>
        <input
          id="analytics-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Пароль"
          className="border-char bg-coal text-cream placeholder:text-ash/60 focus-visible:border-ember focus-visible:ring-ember/30 mt-5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus-visible:ring-2"
        />

        {error && (
          <p className="text-tomato mt-2 text-sm" role="alert">
            Невірний пароль. Спробуйте ще раз.
          </p>
        )}

        <button
          type="submit"
          className="bg-ember text-coal hover:bg-flame focus-visible:ring-flame focus-visible:ring-offset-coal mt-5 w-full rounded-full px-5 py-2.5 font-mono text-xs font-bold tracking-wider uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Увійти
        </button>
      </form>
    </main>
  );
}

function Dashboard() {
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
    <main className="bg-coal text-cream min-h-svh px-5 pt-24 pb-16 md:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-ember font-mono text-xs font-bold tracking-[0.22em] uppercase">
          MEO · метрики · оцінка · спостереження
        </p>
        <h1 className="font-display text-cream mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Якість агента
        </h1>

        <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Сесій" value={String(total)} />
          <Stat label="Середня тривалість" value={`${avgDuration} с`} />
          <Stat label="Успішність tools" value={avgSuccess == null ? '—' : `${avgSuccess}%`} />
        </section>

        {loading ? (
          <p className="text-ash mt-10">Завантаження…</p>
        ) : total === 0 ? (
          <p className="text-ash mt-10">
            Поки немає сесій. Поговоріть з агентом — записи зʼявляться тут.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-[340px_1fr]">
            <ul className="flex flex-col gap-2">
              {sessions.map((s) => {
                const isActive = selected === s;
                return (
                  <li key={s.room + s.started_at}>
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        isActive
                          ? 'border-ember bg-ember/10'
                          : 'border-char/70 bg-surface hover:border-ember/50'
                      }`}
                    >
                      <div className="text-cream font-mono text-sm font-bold">{s.room}</div>
                      <div className="text-ash mt-1 text-xs">
                        {new Date(s.started_at).toLocaleString('uk-UA')} ·{' '}
                        {s.duration_sec.toFixed(0)} с · {s.metrics.tool_call_count} викликів
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {selected && (
              <div>
                <button
                  type="button"
                  onClick={() => evaluate(selected.room)}
                  disabled={busy === selected.room}
                  className="bg-ember text-coal hover:bg-flame focus-visible:ring-flame focus-visible:ring-offset-coal rounded-full px-5 py-2.5 font-mono text-xs font-bold tracking-wider uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {busy === selected.room ? 'Оцінюю…' : 'Оцінити якість (LLM-суддя)'}
                </button>

                {evals[selected.room] && <EvalCard ev={evals[selected.room]} />}

                <SectionLabel>Транскрипт</SectionLabel>
                <div className="flex flex-col gap-2">
                  {selected.transcript.map((t, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] ${t.role === 'user' ? 'self-start' : 'self-end'}`}
                    >
                      <div className="text-ash mb-1 font-mono text-[10px] tracking-wider uppercase">
                        {t.role === 'user' ? 'Клієнт' : 'Агент'}
                      </div>
                      <div
                        className={`rounded-xl px-3 py-2 text-sm ${
                          t.role === 'user' ? 'bg-surface text-cream' : 'bg-ember/12 text-cream'
                        }`}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))}
                </div>

                <SectionLabel>Виклики tools</SectionLabel>
                <div className="flex flex-col gap-1.5">
                  {selected.tool_calls.map((c, i) => (
                    <div key={i} className="font-mono text-[13px]">
                      <span className={c.success ? 'text-basil' : 'text-tomato'}>
                        {c.success ? '✓' : '✗'}
                      </span>{' '}
                      <span className="text-cream">{c.name}</span>
                      <span className="text-ash">({JSON.stringify(c.args)})</span>
                    </div>
                  ))}
                  {selected.tool_calls.length === 0 && <span className="text-ash">—</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-char/70 bg-surface rounded-2xl border p-5">
      <div className="font-display text-cream text-3xl font-bold">{value}</div>
      <div className="text-ash mt-1 font-mono text-[11px] tracking-wider uppercase">{label}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-ash mt-8 mb-3 font-mono text-xs font-bold tracking-[0.18em] uppercase">
      {children}
    </h3>
  );
}

/** Ember-гейдж: заповнення жаром 0–5 — той самий мотив, що й кнопка дзвінка. */
function EmberGauge({ label, value }: { label: string; value?: number }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(5, value)) / 5;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-ash font-mono text-[11px] tracking-wider uppercase">{label}</span>
        <span className="text-ember font-mono text-sm font-bold">
          {value ?? '—'}
          <span className="text-ash text-[11px]">/5</span>
        </span>
      </div>
      <div className="bg-char/60 mt-1.5 h-1.5 overflow-hidden rounded-full">
        <div className="ember-glow h-full rounded-full" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

function EvalCard({ ev }: { ev: Evaluation }) {
  if (ev.error) return <p className="text-tomato mt-4 text-sm">Помилка оцінювання: {ev.error}</p>;
  const rows: [string, number | undefined][] = [
    ['Правильність tools', ev.tool_correctness],
    ['Природність', ev.naturalness],
    ['Виконання задачі', ev.task_completion],
    ['Загалом', ev.overall],
  ];
  return (
    <div className="border-ember/50 bg-surface mt-4 rounded-2xl border p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rows.map(([l, v]) => (
          <EmberGauge key={l} label={l} value={v} />
        ))}
      </div>
      {ev.rationale && <p className="text-cream/90 mt-4 text-sm leading-relaxed">{ev.rationale}</p>}
    </div>
  );
}
