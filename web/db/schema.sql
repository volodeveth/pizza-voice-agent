-- Спільне сховище сесій голосового агента (аналітика MEO).
-- Воркер (Python) пише сюди на завершенні сесії; сторінка /analytics читає.
-- Застосувати один раз після створення Vercel Postgres (Neon):
--   psql "$DATABASE_URL" -f web/db/schema.sql   (або через скрипт деплою).

CREATE TABLE IF NOT EXISTS sessions (
  room          TEXT             NOT NULL,
  started_at    TIMESTAMPTZ      NOT NULL,
  ended_at      TIMESTAMPTZ      NOT NULL,
  duration_sec  DOUBLE PRECISION NOT NULL DEFAULT 0,
  transcript    JSONB            NOT NULL DEFAULT '[]'::jsonb,
  tool_calls    JSONB            NOT NULL DEFAULT '[]'::jsonb,
  usage         JSONB            NOT NULL DEFAULT '{}'::jsonb,
  metrics       JSONB            NOT NULL DEFAULT '{}'::jsonb,
  evaluation    JSONB,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
  PRIMARY KEY (room, started_at)
);

CREATE INDEX IF NOT EXISTS sessions_started_at_idx ON sessions (started_at DESC);
