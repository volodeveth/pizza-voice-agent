'use client';

import Link from 'next/link';

interface SiteHeaderProps {
  companyName: string;
}

export function SiteHeader({ companyName }: SiteHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-5 py-4 md:px-10 md:py-5">
      <div className="from-coal/85 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b to-transparent" />

      <Link
        href="/"
        className="group flex items-center gap-2.5"
        aria-label={`${companyName} — на головну`}
      >
        <span className="ember-glow ember-breathe block size-3.5 rounded-full" aria-hidden />
        <span className="font-display text-cream text-lg font-bold tracking-tight">
          {companyName}
        </span>
      </Link>

      <nav className="flex items-center gap-1 font-mono text-[11px] font-bold tracking-[0.18em] uppercase md:gap-2 md:text-xs">
        <Link
          href="/#menu"
          className="text-ash hover:text-cream rounded-full px-3 py-2 transition-colors"
        >
          Меню
        </Link>
        <Link
          href="/analytics"
          className="text-ash hover:text-ember rounded-full px-3 py-2 transition-colors"
        >
          Аналітика
        </Link>
      </nav>
    </header>
  );
}
