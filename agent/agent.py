from __future__ import annotations

import dataclasses
import logging
from pathlib import Path
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
from recorder import SessionRecorder

load_dotenv()
logger = logging.getLogger("pizza-agent")

SESSIONS_DIR = Path(__file__).resolve().parent.parent / "data" / "sessions"

INSTRUCTIONS = """Ти — привітний голосовий помічник піцерії.
Спілкуйся українською, природно й коротко, як жива людина по телефону.

ФОРМАТ МОВЛЕННЯ (найважливіше): ти говориш уголос, а не пишеш текст.
Ніколи не нумеруй пункти (1., 2., 3.), не став переносів рядків, не роби списків,
не використовуй markdown, зірочки чи інші спецсимволи. Коли перелічуєш страви —
називай їх в одному звичайному реченні через кому, як у живій розмові.
Наприклад: «Є Маргарита за 189, Пепероні за 229 і Чотири сири за 259 гривень».
Не зачитуй усе меню підряд — назви кілька варіантів і запитай, що цікавить.

Твоя мета — допомогти клієнту: показати меню, розповісти про страви, оформити та відстежити замовлення.
Збирай дані для замовлення по черзі: спочатку позиції, потім ім'я, телефон і адресу.
Перед оформленням стисло підтверди склад замовлення і суму.
Після оформлення обов'язково назви номер замовлення і орієнтовний час.
Якщо позиція недоступна або замовлення не знайдено — спокійно й ввічливо повідом про це та запропонуй варіант."""


class Assistant(Agent):
    def __init__(self, recorder: SessionRecorder) -> None:
        super().__init__(instructions=INSTRUCTIONS)
        self._recorder = recorder

    @function_tool()
    async def get_menu(
        self, context: RunContext, category: str | None = None
    ) -> list[dict[str, Any]]:
        """Показати меню піцерії повністю або за категорією.

        Args:
            category: одна з 'pizza', 'drinks', 'desserts'; не вказуй для всього меню.
        """
        logger.info("get_menu(category=%s)", category)
        result = fake_api.get_menu(category)
        self._recorder.add_tool_call("get_menu", {"category": category}, result)
        return result

    @function_tool()
    async def get_item_details(
        self, context: RunContext, item_id: str
    ) -> dict[str, Any]:
        """Повна інформація про позицію меню: склад, ціна, розмір, наявність.

        Args:
            item_id: ідентифікатор позиції, наприклад 'pz1'.
        """
        logger.info("get_item_details(item_id=%s)", item_id)
        result = fake_api.get_item_details(item_id)
        self._recorder.add_tool_call("get_item_details", {"item_id": item_id}, result)
        return result

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
        result = fake_api.create_order(items, customer_name, phone, address)
        self._recorder.add_tool_call(
            "create_order",
            {"items": items, "customer_name": customer_name, "phone": phone, "address": address},
            result,
        )
        return result

    @function_tool()
    async def get_order_status(
        self, context: RunContext, order_id: str
    ) -> dict[str, Any]:
        """Перевірити статус замовлення за номером.

        Args:
            order_id: номер замовлення, наприклад 'ORD-101'.
        """
        logger.info("get_order_status(order_id=%s)", order_id)
        result = fake_api.get_order_status(order_id)
        self._recorder.add_tool_call("get_order_status", {"order_id": order_id}, result)
        return result


def _to_plain(obj: Any) -> Any:
    """Best-effort conversion of usage objects (dataclasses / pydantic models)
    into JSON-friendly primitives, so token metrics are stored structured."""
    if hasattr(obj, "model_dump"):
        try:
            return obj.model_dump()
        except Exception:
            return str(obj)
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {f.name: _to_plain(getattr(obj, f.name)) for f in dataclasses.fields(obj)}
    if isinstance(obj, (list, tuple)):
        return [_to_plain(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _to_plain(v) for k, v in obj.items()}
    return obj


async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect()

    recorder = SessionRecorder(room=ctx.room.name)

    session = AgentSession(
        llm=openai.realtime.RealtimeModel(model="gpt-realtime-mini", voice="marin"),
    )

    @session.on("conversation_item_added")
    def _on_item(ev) -> None:
        try:
            item = getattr(ev, "item", ev)
            role = getattr(item, "role", "unknown")
            text = getattr(item, "text_content", None) or ""
            if not isinstance(text, str):
                text = str(text)
            recorder.add_turn(role, text)
        except Exception:
            logger.exception("transcript handler failed")

    @session.on("session_usage_updated")
    def _on_usage(ev) -> None:
        try:
            usage = getattr(ev, "usage", ev)
            recorder.set_usage(_to_plain(usage))
        except Exception:
            logger.exception("usage handler failed")

    _saved = False

    @session.on("close")
    def _on_close(ev) -> None:
        # Persist on session close — the reliable hook across console/dev/start
        # (job-level shutdown callbacks do not fire on Ctrl+C in console mode).
        nonlocal _saved
        if _saved:
            return
        _saved = True
        try:
            path = recorder.save(SESSIONS_DIR)
            logger.info("session saved: %s", path)
        except Exception:
            logger.exception("failed to save session record")

    await session.start(agent=Assistant(recorder), room=ctx.room)

    await session.generate_reply(
        instructions=(
            "Привітайся українською, коротко відрекомендуйся помічником піцерії "
            "та запитай, чим можеш допомогти."
        )
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
