# Фото піци

Сюди кладуть якісні фото піци з дровʼяної печі (royalty-free — Unsplash/Pexels,
ключові слова "wood fired pizza", "margherita pizza dark" — або генерація).

Картки меню та hero працюють і без фото: за замовчуванням рендериться вбудована
SVG-ілюстрація піци (`components/app/pizza-art.tsx`). Щоб підставити справжнє фото:

1. Поклади оптимізований `.webp`/`.jpg` сюди, напр. `margherita.webp`.
2. У `components/app/home-view.tsx` заміни `<PizzaArt />` на `<Image src="/img/margherita.webp" … />`.
