"""Mock-API піцерії: меню, замовлення і статуси в пам'яті процесу.

Імітує бекенд закладу для голосового агента: чотири функції, які агент
викликає через function calling. Дані скидаються при перезапуску воркера.
"""

from __future__ import annotations

from itertools import count
from typing import Any

MENU: list[dict[str, Any]] = [
    # Піци
    {"id": "pz1", "name": "Маргарита", "category": "pizza", "price": 179, "available": True,
     "description": "Соус із томатів сан-марцано, фіор ді латте, свіжий базилік", "size_cm": 30},
    {"id": "pz2", "name": "Пепероні", "category": "pizza", "price": 235, "available": True,
     "description": "Подвійна пепероні, моцарела, томатний соус, орегано", "size_cm": 30},
    {"id": "pz3", "name": "Кватро Формаджі", "category": "pizza", "price": 269, "available": True,
     "description": "Моцарела, дор блю, пармезан, емменталь на вершковій основі", "size_cm": 30},
    {"id": "pz4", "name": "Прошуто е Фунгі", "category": "pizza", "price": 255, "available": False,
     "description": "Прошуто котто, печериці, моцарела, томатний соус", "size_cm": 30},
    {"id": "pz5", "name": "Діабло", "category": "pizza", "price": 245, "available": True,
     "description": "Салямі пікант, халапеньйо, моцарела, гострий соус чилі", "size_cm": 30},
    # Напої
    {"id": "dr1", "name": "Лимонад домашній 0.4л", "category": "drinks", "price": 55, "available": True,
     "description": "Лимонад власного приготування з м'ятою", "size_cm": None},
    {"id": "dr2", "name": "Сік апельсиновий 0.3л", "category": "drinks", "price": 45, "available": True,
     "description": "Свіжовичавлений апельсиновий сік", "size_cm": None},
    {"id": "dr3", "name": "Вода мінеральна 0.5л", "category": "drinks", "price": 25, "available": True,
     "description": "Негазована мінеральна вода", "size_cm": None},
    # Десерти
    {"id": "ds1", "name": "Тірамісу", "category": "desserts", "price": 95, "available": True,
     "description": "Домашній тірамісу з маскарпоне та еспресо", "size_cm": None},
    {"id": "ds2", "name": "Панакота", "category": "desserts", "price": 85, "available": True,
     "description": "Вершкова панакота з малиновим соусом", "size_cm": None},
]

ORDERS: dict[str, dict[str, Any]] = {
    "ORD-101": {
        "id": "ORD-101",
        "customer_name": "Тарас Мельник",
        "phone": "+380671234501",
        "address": "вул. Виноградна, 3, кв. 7",
        "items": [
            {"id": "pz5", "name": "Діабло", "quantity": 1, "price": 245},
            {"id": "dr1", "name": "Лимонад домашній 0.4л", "quantity": 2, "price": 55},
        ],
        "total": 355,
        "status": "cooking",
        "status_label": "Готується",
    },
    "ORD-102": {
        "id": "ORD-102",
        "customer_name": "Ірина Ковальчук",
        "phone": "+380509876543",
        "address": "просп. Соборний, 21, кв. 44",
        "items": [
            {"id": "pz1", "name": "Маргарита", "quantity": 2, "price": 179},
        ],
        "total": 358,
        "status": "delivering",
        "status_label": "Їде до вас",
    },
}

_order_ids = count(103)

_CATEGORY_ALIASES: dict[str, str] = {
    "піца": "pizza",
    "піци": "pizza",
    "пицца": "pizza",
    "напій": "drinks",
    "напої": "drinks",
    "десерт": "desserts",
    "десерти": "desserts",
}


def _find_item(item_id: str) -> dict[str, Any] | None:
    return next((i for i in MENU if i["id"] == item_id), None)


def get_menu(category: str | None = None) -> list[dict[str, Any]]:
    """Повертає меню. Якщо передано category — фільтрує за категорією."""
    items = MENU
    if category:
        normalized = _CATEGORY_ALIASES.get(category.lower(), category.lower())
        items = [i for i in items if i["category"] == normalized]
    return [
        {"id": i["id"], "name": i["name"], "price": i["price"],
         "available": i["available"], "category": i["category"]}
        for i in items
    ]


def get_item_details(item_id: str) -> dict[str, Any]:
    """Повна інформація про позицію меню: склад, ціна, розмір, наявність."""
    item = _find_item(item_id)
    if item is None:
        return {"success": False, "error": "Позицію не знайдено"}
    return {"success": True, **item}


def create_order(
    items: list[dict[str, Any]],  # [{"id": "pz1", "quantity": 2}, ...]
    customer_name: str,
    phone: str,
    address: str,
) -> dict[str, Any]:
    """Оформлює замовлення. items — список {id, quantity}."""
    order_items: list[dict[str, Any]] = []
    total = 0

    for entry in items:
        item = _find_item(entry["id"])
        if item is None:
            return {"success": False, "error": f"Позицію {entry['id']} не знайдено"}
        if not item["available"]:
            return {"success": False, "error": f"«{item['name']}» зараз недоступна"}
        qty = entry.get("quantity", 1)
        order_items.append(
            {"id": item["id"], "name": item["name"], "quantity": qty, "price": item["price"]}
        )
        total += item["price"] * qty

    order_id = f"ORD-{next(_order_ids)}"
    ORDERS[order_id] = {
        "id": order_id,
        "customer_name": customer_name,
        "phone": phone,
        "address": address,
        "items": order_items,
        "total": total,
        "status": "accepted",
        "status_label": "Прийнято",
    }

    return {
        "success": True,
        "order_id": order_id,
        "items": [f"{i['name']} x{i['quantity']}" for i in order_items],
        "total": total,
        "estimated_minutes": 40,
    }


def get_order_status(order_id: str) -> dict[str, Any]:
    """Перевірка статусу замовлення за номером."""
    order = ORDERS.get(order_id)
    if order is None:
        return {"success": False, "error": "Замовлення не знайдено"}
    return {
        "success": True,
        "order_id": order_id,
        "status": order["status_label"],
        "items": [f"{i['name']} x{i['quantity']}" for i in order["items"]],
        "total": order["total"],
    }
