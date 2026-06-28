/**
 * Меню для вітрини сайту. Дзеркалить піци з `agent/fake_api.py` (джерело правди —
 * Python-агент; тут лише презентаційна копія для головної). Замовлення оформлює
 * голосовий агент через fake_api, тож ця копія читається лише для показу карток.
 */
export type MenuItem = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  description: string;
};

export const PIZZAS: MenuItem[] = [
  {
    id: 'pz1',
    name: 'Маргарита',
    price: 189,
    available: true,
    description: 'Томатний соус, моцарела, свіжий базилік',
  },
  {
    id: 'pz2',
    name: 'Пепероні',
    price: 229,
    available: true,
    description: 'Томатний соус, моцарела, пепероні',
  },
  {
    id: 'pz3',
    name: 'Чотири сири',
    price: 259,
    available: true,
    description: 'Моцарела, горгонзола, пармезан, чеддер',
  },
  {
    id: 'pz5',
    name: 'Барбекю з куркою',
    price: 249,
    available: true,
    description: 'Соус BBQ, моцарела, куряче філе, червона цибуля',
  },
  {
    id: 'pz4',
    name: 'Гавайська',
    price: 219,
    available: false,
    description: 'Томатний соус, моцарела, шинка, ананас',
  },
];
