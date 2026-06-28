from __future__ import annotations

import logging
from typing import Any

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import openai

import fake_api

load_dotenv()
logger = logging.getLogger("pizza-agent")

INSTRUCTIONS = """Ти — привітний голосовий помічник піцерії.
Спілкуйся українською, природно й коротко, як жива людина по телефону.
Не використовуй markdown, переліки, зірочки чи інші спецсимволи — лише звичайна усна мова.
Твоя мета — допомогти клієнту: показати меню, розповісти про страви, оформити та відстежити замовлення.
Збирай дані для замовлення по черзі: спочатку позиції, потім ім'я, телефон і адресу.
Перед оформленням стисло підтверди склад замовлення і суму.
Після оформлення обов'язково назви номер замовлення і орієнтовний час.
Якщо позиція недоступна або замовлення не знайдено — спокійно й ввічливо повідом про це та запропонуй варіант."""


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=INSTRUCTIONS)

    @function_tool()
    async def get_menu(
        self, context: RunContext, category: str | None = None
    ) -> list[dict[str, Any]]:
        """Показати меню піцерії повністю або за категорією.

        Args:
            category: одна з 'pizza', 'drinks', 'desserts'; не вказуй для всього меню.
        """
        logger.info("get_menu(category=%s)", category)
        return fake_api.get_menu(category)

    @function_tool()
    async def get_item_details(
        self, context: RunContext, item_id: str
    ) -> dict[str, Any]:
        """Повна інформація про позицію меню: склад, ціна, розмір, наявність.

        Args:
            item_id: ідентифікатор позиції, наприклад 'pz1'.
        """
        logger.info("get_item_details(item_id=%s)", item_id)
        return fake_api.get_item_details(item_id)

    @function_tool()
    async def create_order(
        self,
        context: RunContext,
        items: list[dict[str, Any]],
        customer_name: str,
        phone: str,
        address: str,
    ) -> dict[str, Any]:
        """Оформити замовлення.

        Args:
            items: список позицій у форматі [{"id": "pz1", "quantity": 2}, ...].
            customer_name: ім'я клієнта.
            phone: контактний телефон.
            address: адреса доставки.
        """
        logger.info("create_order(items=%s, name=%s)", items, customer_name)
        return fake_api.create_order(items, customer_name, phone, address)

    @function_tool()
    async def get_order_status(
        self, context: RunContext, order_id: str
    ) -> dict[str, Any]:
        """Перевірити статус замовлення за номером.

        Args:
            order_id: номер замовлення, наприклад 'ORD-101'.
        """
        logger.info("get_order_status(order_id=%s)", order_id)
        return fake_api.get_order_status(order_id)


async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect()

    session = AgentSession(
        llm=openai.realtime.RealtimeModel(model="gpt-realtime-mini", voice="marin"),
    )

    await session.start(agent=Assistant(), room=ctx.room)

    await session.generate_reply(
        instructions=(
            "Привітайся українською, коротко відрекомендуйся помічником піцерії "
            "та запитай, чим можеш допомогти."
        )
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
