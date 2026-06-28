from datetime import datetime, timezone

from recorder import build_record


def test_build_record_shapes_session():
    started = datetime(2026, 6, 28, 12, 0, 0, tzinfo=timezone.utc)
    ended = datetime(2026, 6, 28, 12, 0, 30, tzinfo=timezone.utc)
    transcript = [
        {"role": "user", "text": "Покажи піци"},
        {"role": "assistant", "text": "Є Маргарита, Пепероні..."},
    ]
    tool_calls = [
        {"name": "get_menu", "args": {"category": "pizza"}, "result": {"ok": True}, "success": True},
        {"name": "create_order", "args": {}, "result": {"success": False}, "success": False},
    ]
    rec = build_record("room-1", started, ended, transcript, tool_calls, {"llm_tokens": 100})

    assert rec["room"] == "room-1"
    assert rec["duration_sec"] == 30.0
    assert rec["transcript"] == transcript
    assert rec["metrics"]["tool_call_count"] == 2
    assert rec["metrics"]["tool_success_rate"] == 0.5
    assert rec["usage"] == {"llm_tokens": 100}
