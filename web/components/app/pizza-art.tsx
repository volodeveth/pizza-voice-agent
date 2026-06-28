/**
 * Вбудована SVG-ілюстрація піци з дровʼяної печі (top-down): обвуглена скоринка,
 * розплавлена моцарела, томат, базилік. Самодостатня — не залежить від фото-активів.
 * Підставити справжнє фото можна за інструкцією в `public/img/README.md`.
 */
interface PizzaArtProps {
  className?: string;
  /** Варіант начинки для різноманіття карток. */
  variant?: 'margherita' | 'pepperoni' | 'cheese' | 'bbq' | 'hawaiian';
}

const TOPPINGS: Record<NonNullable<PizzaArtProps['variant']>, React.ReactNode> = {
  margherita: (
    <>
      <circle cx="78" cy="86" r="7" fill="#E63946" opacity="0.9" />
      <circle cx="128" cy="74" r="6" fill="#E63946" opacity="0.85" />
      <circle cx="118" cy="128" r="7" fill="#E63946" opacity="0.9" />
      <path d="M92 110c6-10 18-10 22 0-8 6-16 6-22 0z" fill="#7FB069" />
      <path d="M132 104c5-8 15-8 18 0-7 5-13 5-18 0z" fill="#7FB069" />
      <path d="M70 118c5-8 15-8 18 0-7 5-13 5-18 0z" fill="#7FB069" />
    </>
  ),
  pepperoni: (
    <>
      <circle cx="74" cy="80" r="11" fill="#C0392B" />
      <circle cx="126" cy="72" r="11" fill="#C0392B" />
      <circle cx="100" cy="108" r="11" fill="#C0392B" />
      <circle cx="72" cy="128" r="10" fill="#C0392B" />
      <circle cx="132" cy="124" r="10" fill="#C0392B" />
      <circle cx="74" cy="80" r="11" fill="#E63946" opacity="0.35" />
      <circle cx="126" cy="72" r="11" fill="#E63946" opacity="0.35" />
    </>
  ),
  cheese: (
    <>
      <path d="M70 78l14 6-4 14-14-4z" fill="#FFB347" opacity="0.9" />
      <path d="M118 70l16 4-2 14-16-2z" fill="#FFD27A" opacity="0.9" />
      <path d="M94 112l16 4-2 14-16-2z" fill="#FFB347" opacity="0.85" />
      <path d="M66 116l12 6-4 12-12-4z" fill="#FFD27A" opacity="0.85" />
    </>
  ),
  bbq: (
    <>
      <ellipse cx="80" cy="84" rx="10" ry="7" fill="#D98A4A" />
      <ellipse cx="124" cy="78" rx="10" ry="7" fill="#D98A4A" />
      <ellipse cx="104" cy="116" rx="10" ry="7" fill="#D98A4A" />
      <path d="M70 120c8-3 16-3 24 0" stroke="#7A2408" strokeWidth="3" fill="none" />
      <path d="M112 96c8-3 16-3 24 0" stroke="#7A2408" strokeWidth="3" fill="none" />
      <circle cx="92" cy="92" r="4" fill="#9B59B6" opacity="0.6" />
    </>
  ),
  hawaiian: (
    <>
      <rect
        x="70"
        y="76"
        width="14"
        height="14"
        rx="3"
        fill="#FFD27A"
        transform="rotate(20 77 83)"
      />
      <rect
        x="118"
        y="70"
        width="14"
        height="14"
        rx="3"
        fill="#FFD27A"
        transform="rotate(-15 125 77)"
      />
      <rect
        x="96"
        y="112"
        width="14"
        height="14"
        rx="3"
        fill="#FFD27A"
        transform="rotate(10 103 119)"
      />
      <circle cx="86" cy="118" r="6" fill="#E8A0A0" />
      <circle cx="128" cy="106" r="6" fill="#E8A0A0" />
    </>
  ),
};

export function PizzaArt({ className, variant = 'margherita' }: PizzaArtProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Піца з дровʼяної печі"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`crust-${variant}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#E8B873" />
          <stop offset="70%" stopColor="#C98A45" />
          <stop offset="100%" stopColor="#8A5524" />
        </radialGradient>
        <radialGradient id={`cheese-${variant}`} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#F7E2A8" />
          <stop offset="100%" stopColor="#E9C56E" />
        </radialGradient>
      </defs>

      {/* обвуглена скоринка */}
      <circle cx="100" cy="100" r="92" fill={`url(#crust-${variant})`} />
      {/* плями чару на бортику */}
      <circle cx="38" cy="70" r="9" fill="#5A3416" opacity="0.55" />
      <circle cx="160" cy="58" r="7" fill="#5A3416" opacity="0.5" />
      <circle cx="172" cy="132" r="8" fill="#5A3416" opacity="0.5" />
      <circle cx="56" cy="166" r="7" fill="#5A3416" opacity="0.45" />

      {/* соус + сир */}
      <circle cx="100" cy="100" r="74" fill="#B4321F" />
      <circle cx="100" cy="100" r="70" fill={`url(#cheese-${variant})`} />

      {TOPPINGS[variant]}
    </svg>
  );
}
