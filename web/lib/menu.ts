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
    price: 179,
    available: true,
    description: 'Соус із томатів сан-марцано, фіор ді латте, свіжий базилік',
  },
  {
    id: 'pz2',
    name: 'Пепероні',
    price: 235,
    available: true,
    description: 'Подвійна пепероні, моцарела, томатний соус, орегано',
  },
  {
    id: 'pz3',
    name: 'Кватро Формаджі',
    price: 269,
    available: true,
    description: 'Моцарела, дор блю, пармезан, емменталь на вершковій основі',
  },
  {
    id: 'pz5',
    name: 'Діабло',
    price: 245,
    available: true,
    description: 'Салямі пікант, халапеньйо, моцарела, гострий соус чилі',
  },
  {
    id: 'pz4',
    name: 'Прошуто е Фунгі',
    price: 255,
    available: false,
    description: 'Прошуто котто, печериці, моцарела, томатний соус',
  },
];
