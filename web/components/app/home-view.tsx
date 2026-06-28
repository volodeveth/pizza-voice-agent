import { PizzaArt } from '@/components/app/pizza-art';
import { type MenuItem, PIZZAS } from '@/lib/menu';

const PIZZA_VARIANT: Record<string, React.ComponentProps<typeof PizzaArt>['variant']> = {
  pz1: 'margherita',
  pz2: 'pepperoni',
  pz3: 'cheese',
  pz5: 'bbq',
  pz4: 'hawaiian',
};

const STEPS = [
  {
    n: '01',
    title: 'Скажи, що хочеш',
    text: 'Натисни на вуглик і просто говори — «дві Маргарити й колу».',
  },
  {
    n: '02',
    title: 'Агент усе оформить',
    text: 'Підкаже меню й ціни, перепитає адресу, підтвердить суму вголос.',
  },
  {
    n: '03',
    title: 'Печемо і веземо',
    text: 'Назве номер замовлення та орієнтовний час. Готово — чекай кур’єра.',
  },
];

interface HomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const HomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & HomeViewProps) => {
  return (
    <div ref={ref} className="bg-coal text-cream">
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-28 pb-16 md:min-h-svh md:grid-cols-[1.1fr_1fr] md:gap-6 md:px-10 md:pt-32 md:pb-24">
        {/* світіння печі за героєм */}
        <div
          aria-hidden
          className="ember-aura pointer-events-none absolute top-1/2 right-[5%] -z-10 size-[460px] -translate-y-1/2 rounded-full blur-2xl md:right-[12%]"
        />

        <div className="flex flex-col items-start">
          <p className="text-ember font-mono text-xs font-bold tracking-[0.22em] uppercase">
            Живе меню голосом
          </p>
          <h1 className="font-display text-cream mt-5 text-5xl leading-[0.95] font-extrabold tracking-tight text-balance md:text-7xl">
            Гаряча піца —<br />
            просто скажи.
          </h1>
          <p className="text-ash mt-6 max-w-md text-base leading-relaxed md:text-lg">
            Дровʼяна піцерія за рогом. Не шукай форму замовлення — натисни на вуглик і замов голосом
            за хвилину.
          </p>

          {/* Signature: живий вуглик — кнопка дзвінка */}
          <div className="mt-10 flex flex-col items-start gap-3">
            <button
              type="button"
              onClick={onStartCall}
              aria-label={startButtonText}
              className="group focus-visible:ring-flame focus-visible:ring-offset-coal relative flex size-32 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-4 md:size-36"
            >
              <span className="ember-glow ember-breathe absolute inset-0 rounded-full transition-transform duration-300 group-hover:scale-105 group-active:scale-95" />
              <span className="text-coal relative flex flex-col items-center">
                <MicIcon className="size-7 md:size-8" />
                <span className="font-display mt-1 text-sm font-bold tracking-wide md:text-base">
                  {startButtonText}
                </span>
              </span>
            </button>
            <span className="text-ash/80 pl-1 font-mono text-[11px] tracking-wider">
              мікрофон • українською • без застосунку
            </span>
          </div>
        </div>

        {/* фото/ілюстрація піци — bleed праворуч */}
        <div className="relative hidden items-center justify-center md:flex">
          <div className="ember-aura absolute inset-0 -z-10 rounded-full blur-3xl" aria-hidden />
          <PizzaArt
            variant="margherita"
            className="w-[min(38vw,460px)] drop-shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
          />
        </div>
      </section>

      {/* ───────────────────────── МЕНЮ ───────────────────────── */}
      <section id="menu" className="border-char/60 bg-coal scroll-mt-24 border-t">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-ember font-mono text-xs font-bold tracking-[0.22em] uppercase">
                Меню
              </p>
              <h2 className="font-display text-cream mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                З дровʼяної печі
              </h2>
            </div>
            <p className="text-ash hidden max-w-xs text-right text-sm md:block">
              Замовлення оформлює голосовий агент — ціни й наявність живі.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PIZZAS.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </ul>
        </div>
      </section>

      {/* ─────────────────────── ЯК ЦЕ ПРАЦЮЄ ─────────────────────── */}
      <section className="border-char/60 bg-surface/40 border-t">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
          <p className="text-ember font-mono text-xs font-bold tracking-[0.22em] uppercase">
            Як це працює
          </p>
          <ol className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((s) => (
              <li key={s.n} className="flex flex-col">
                <span className="text-ember/90 font-mono text-2xl font-bold">{s.n}</span>
                <span className="border-char/60 mt-3 block w-10 border-t" aria-hidden />
                <h3 className="font-display text-cream mt-4 text-xl font-bold">{s.title}</h3>
                <p className="text-ash mt-2 text-sm leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-char/60 text-ash border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-5 py-10 text-center md:px-10">
          <span className="ember-glow mb-2 block size-2.5 rounded-full" aria-hidden />
          <p className="font-mono text-[11px] tracking-wider">Піцерія • голосове замовлення</p>
        </div>
      </footer>
    </div>
  );
};

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <li
      className={`border-char/70 bg-surface group relative flex flex-col overflow-hidden rounded-2xl border p-5 transition-colors ${
        item.available ? 'hover:border-ember/60' : 'opacity-70'
      }`}
    >
      <div className="relative mb-4 flex items-center justify-center">
        <div aria-hidden className="ember-aura absolute size-28 rounded-full opacity-60 blur-xl" />
        <PizzaArt
          variant={PIZZA_VARIANT[item.id]}
          className={`size-28 transition-transform duration-300 ${
            item.available ? 'group-hover:scale-105' : 'grayscale'
          }`}
        />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-cream text-lg font-bold">{item.name}</h3>
        <span className="text-ember font-mono text-base font-bold whitespace-nowrap">
          {item.price} ₴
        </span>
      </div>
      <p className="text-ash mt-1.5 text-sm leading-snug">{item.description}</p>

      <div className="mt-4">
        {item.available ? (
          <span className="text-basil inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase">
            <span className="bg-basil size-1.5 rounded-full" aria-hidden />В наявності
          </span>
        ) : (
          <span className="text-ash inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase">
            <span className="bg-ash size-1.5 rounded-full" aria-hidden />
            Тимчасово немає
          </span>
        )}
      </div>
    </li>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" fill="currentColor" />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
