# Образ воркера для LiveKit Cloud Agents.
# `lk agent create` використає цей Dockerfile (якщо він є) замість згенерованого за замовчуванням.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Залежності окремим шаром — для кешування збірки
COPY requirements.txt .
RUN pip install -r requirements.txt

# Код воркера (без секретів — див. .dockerignore)
COPY . .

# Продакшн-режим: воркер під'єднується до LiveKit Cloud і чекає на кімнати.
CMD ["python", "agent.py", "start"]
