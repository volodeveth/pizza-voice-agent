# 🍕 Голосовий агент для піцерії

Голосовий AI-помічник піцерії на **LiveKit Agents** + **OpenAI Realtime API**. Веде
природний голосовий діалог українською: показує меню, розповідає про страви, оформлює та
відстежує замовлення — викликаючи реальні функції через function calling. Додатково має
сторінку **аналітики якості (MEO)** з оцінкою діалогів LLM-суддею.

> Тестове завдання на позицію AI Engineer. Повне ТЗ — [`ТЗ AI Engineer.md`](ТЗ%20AI%20Engineer.md).

## ✨ Можливості

- 🎙️ **Голосовий діалог** мова-в-мову через OpenAI Realtime (`gpt-realtime-mini`)
- 🛠️ **4 tools** з [`agent/fake_api.py`](agent/fake_api.py): меню, деталі страви, оформлення та статус замовлення
- 🗣️ Природні короткі репліки українською, без markdown
- 🌐 **Брендований веб-фронтенд** (LiveKit Next.js starter) з візуалізатором голосу й транскриптом
- 📊 **Сторінка аналітики `/analytics`**: метрики, транскрипти, виклики tools і оцінка якості LLM-суддею

## 🏗️ Архітектура

```
Браузер (Next.js, брендований «Піцерія»)
   │  WebRTC (аудіо)
   ▼
LiveKit Cloud (SFU-кімната)
   │
   ▼
Agent Worker (Python, LiveKit Agents)
   └─ AgentSession
        ├─ OpenAI RealtimeModel("gpt-realtime-mini")   ← мова-в-мову
        ├─ 4× @function_tool  ──►  fake_api.py
        └─ SessionRecorder ──► data/sessions/*.json
                                  │
                                  ▼
                  Next.js /api (sessions + LLM-as-judge)
                                  │
                                  ▼
                        Сторінка /analytics (MEO)
```

## 📁 Структура

```
.
├─ agent/                 # Python-воркер
│  ├─ agent.py            # Assistant (4 tools) + Realtime-сесія + entrypoint
│  ├─ recorder.py         # запис сесій (транскрипт/tools/метрики) → JSON
│  ├─ fake_api.py         # надані mock-дані та функції (БЕЗ ЗМІН)
│  ├─ tests/              # юніт-тести (pytest)
│  └─ requirements.txt
├─ web/                   # Next.js фронтенд (LiveKit starter) + /analytics
├─ data/sessions/         # JSON-записи реальних сесій (gitignored)
└─ docs/                  # специфікація та план реалізації
```

## ⚙️ Передумови

- Python 3.12, Node.js 20+ (рекомендовано 24), `pnpm`
- Ключ **OpenAI** з доступом до Realtime API
- Безкоштовний проєкт **LiveKit Cloud** (https://cloud.livekit.io) — для веб/хмарного режиму

## 🚀 Запуск агента

```bash
cd agent
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # Windows
cp .env.example .env        # і заповніть значення (див. нижче)
```

`agent/.env`:

```
OPENAI_API_KEY=sk-...
LIVEKIT_URL=wss://<your-project>.livekit.cloud
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=...
```

**Локальний тест у терміналі** (потрібен лише `OPENAI_API_KEY`, мікрофон і динаміки):

```bash
.venv\Scripts\python agent.py console
```

**Підключення до LiveKit Cloud** (для веб-демо):

```bash
.venv\Scripts\python agent.py dev
```

## 🌐 Веб-фронтенд

```bash
cd web
pnpm install
cp .env.example .env.local   # впишіть LIVEKIT_URL/KEY/SECRET та OPENAI_API_KEY
pnpm dev                     # http://localhost:3000
```

Запустіть одночасно `agent.py dev` (агент) і `pnpm dev` (фронтенд), відкрийте
http://localhost:3000 і почніть розмову.

## 📊 Аналітика якості (MEO)

Сторінка **http://localhost:3000/analytics** показує на даних реальних сесій:

- зведені метрики: к-ть сесій, середня тривалість, успішність викликів tools;
- список сесій із транскриптом та викликами tools;
- **оцінку якості LLM-суддею** (правильність tools, природність, виконання задачі) з поясненням.

Дані беруться з `data/sessions/*.json`, які агент пише на кожній розмові.

## 🌍 Деплой (live)

Система має **дві runtime-частини**, які деплояться окремо й працюють разом:

| Частина | Куди | Чому |
|---|---|---|
| `web/` (Next.js) | **Vercel** | serverless — натив для Next, автодеплой з GitHub |
| `agent/` (Python-воркер) | **LiveKit Cloud Agents** | потрібен довгоживучий процес, не serverless |

### 1. Веб-фронтенд → Vercel

1. **Import Project** → обери GitHub-репо `pizza-voice-agent`.
2. **Root Directory: `web`** (важливо — це монорепо; Next.js визначиться автоматично).
3. Додай **Environment Variables**:

   ```
   LIVEKIT_URL=wss://<your-project>.livekit.cloud
   LIVEKIT_API_KEY=API...
   LIVEKIT_API_SECRET=...
   OPENAI_API_KEY=sk-...          # для LLM-судді на /analytics
   # CALLS_DISABLED=1             # (необов'язково) вимкнути голосове демо без редеплою
   ```

4. **Deploy.** Далі кожен push у `main` → автодеплой.

### 2. Агент-воркер → LiveKit Cloud Agents

Потрібен [LiveKit CLI](https://docs.livekit.io/home/cli/cli-setup/) (`lk`):

```bash
lk cloud auth                      # автентифікація у твоєму LiveKit-проєкті
cd agent
lk agent create --secrets-file .env .   # збере образ з Dockerfile і задеплоїть
lk agent status                    # стан
lk agent logs                      # живі логи
```

`lk agent create` реєструє агента, передає секрети з `.env` (зокрема `OPENAI_API_KEY`) у
сховище секретів LiveKit (не в образ — `.env` у `.dockerignore`), збирає образ за
[`agent/Dockerfile`](agent/Dockerfile) і запускає воркер у режимі `start`. Він створить
`agent/livekit.toml` з ID агента — закомітьте його. Наступні деплої — `lk agent deploy`.

> Якщо `.env` містить рядки-коментарі — `lk agent create` може спіткнутись; тоді передай
> ключ явно: `--secrets OPENAI_API_KEY=sk-...`. Змінні `LIVEKIT_*` на Cloud Agents
> інжектуються платформою автоматично.

### Відомі нюанси live-деплою

- **Токен-роут `/api/token` публічний** (видає LiveKit-токен без автентифікації — це і є демо).
  Будь-хто з посиланням може витрачати твої LiveKit/OpenAI-хвилини. Постав **ліміти витрат**
  у LiveKit Cloud і OpenAI; швидкий вимикач — env `CALLS_DISABLED=1`.
- **Аналітика на Vercel буде порожня:** `data/sessions/*.json` пише воркер на своїй файловій
  системі (LiveKit Cloud), а serverless-функції Vercel її не бачать. Локально аналітика
  працює повноцінно. Для live-аналітики потрібне спільне сховище (БД / Vercel Blob) — поза
  межами демо.

## ✅ Тести

```bash
cd agent
.venv\Scripts\python -m pytest -v
```

Юніт-тести покривають контракт даних tools (`fake_api`) і складання запису сесії
(`recorder.build_record`). Голосовий цикл перевіряється вживу через `console`-режим.

## 🔒 Безпека

Репозиторій публічний. Реальні ключі тримаються **лише** у `agent/.env` та `web/.env.local`
(обидва в `.gitignore`); у репо — лише `*.env.example` з порожніми значеннями. На деплої ключі
живуть у змінних оточення Vercel і в сховищі секретів LiveKit (через `--secrets-file`), не в коді.

Голосовий токен-роут `/api/token` навмисно публічний (це демо без логіну) — див. «Відомі нюанси
live-деплою» вище щодо лімітів витрат і вимикача `CALLS_DISABLED`. Сторінка `/analytics`
прихована клієнтським паролем (демо-захист, не криптографічний).

## 🧰 Стек

LiveKit Agents 1.6 · OpenAI Realtime API (`gpt-realtime-mini`) · Python 3.12 · pytest ·
Next.js (App Router) · TypeScript · OpenAI (LLM-as-judge).
