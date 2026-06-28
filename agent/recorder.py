from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def build_record(
    room: str,
    started_at: datetime,
    ended_at: datetime,
    transcript: list[dict[str, Any]],
    tool_calls: list[dict[str, Any]],
    usage: dict[str, Any],
) -> dict[str, Any]:
    count = len(tool_calls)
    successes = sum(1 for c in tool_calls if c.get("success"))
    return {
        "room": room,
        "started_at": started_at.isoformat(),
        "ended_at": ended_at.isoformat(),
        "duration_sec": (ended_at - started_at).total_seconds(),
        "transcript": transcript,
        "tool_calls": tool_calls,
        "usage": usage,
        "metrics": {
            "tool_call_count": count,
            "tool_success_rate": (successes / count) if count else None,
        },
    }


class SessionRecorder:
    def __init__(self, room: str) -> None:
        self.room = room
        self.started_at = datetime.now(timezone.utc)
        self.transcript: list[dict[str, Any]] = []
        self.tool_calls: list[dict[str, Any]] = []
        self.usage: dict[str, Any] = {}

    def add_turn(self, role: str, text: str) -> None:
        if text:
            self.transcript.append({"role": role, "text": text})

    def add_tool_call(self, name: str, args: dict[str, Any], result: Any) -> None:
        success = not (isinstance(result, dict) and result.get("success") is False)
        self.tool_calls.append(
            {"name": name, "args": args, "result": result, "success": success}
        )

    def set_usage(self, usage: dict[str, Any]) -> None:
        self.usage = usage

    def save(self, directory: str | Path) -> Path:
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)
        ended_at = datetime.now(timezone.utc)
        record = build_record(
            self.room, self.started_at, ended_at, self.transcript, self.tool_calls, self.usage
        )
        ts = ended_at.strftime("%Y%m%dT%H%M%S")
        # room name may contain characters illegal in filenames — sanitize
        safe_room = "".join(c if c.isalnum() or c in "-_" else "_" for c in self.room) or "room"
        path = directory / f"{safe_room}-{ts}.json"
        path.write_text(
            json.dumps(record, ensure_ascii=False, indent=2, default=str), encoding="utf-8"
        )
        return path

    def save_to_db(self, database_url: str) -> None:
        """Записати сесію у спільне сховище Postgres (для аналітики на проді).

        Викликається на завершенні сесії, якщо задано DATABASE_URL. Upsert за (room, started_at),
        тож повторний запис тієї ж сесії безпечний.
        """
        import psycopg
        from psycopg.types.json import Jsonb

        ended_at = datetime.now(timezone.utc)
        record = build_record(
            self.room, self.started_at, ended_at, self.transcript, self.tool_calls, self.usage
        )
        with psycopg.connect(database_url) as conn:
            conn.execute(
                """
                INSERT INTO sessions
                  (room, started_at, ended_at, duration_sec, transcript, tool_calls, usage, metrics)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (room, started_at) DO UPDATE SET
                  ended_at     = EXCLUDED.ended_at,
                  duration_sec = EXCLUDED.duration_sec,
                  transcript   = EXCLUDED.transcript,
                  tool_calls   = EXCLUDED.tool_calls,
                  usage        = EXCLUDED.usage,
                  metrics      = EXCLUDED.metrics
                """,
                (
                    self.room,
                    self.started_at,
                    ended_at,
                    record["duration_sec"],
                    Jsonb(record["transcript"]),
                    Jsonb(record["tool_calls"]),
                    Jsonb(record["usage"]),
                    Jsonb(record["metrics"]),
                ),
            )
