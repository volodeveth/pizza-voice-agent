# Веб-фронтенд піцерії

Next.js-фронтенд голосового агента: головна сторінка з меню і голосовим дзвінком
(WebRTC через LiveKit) та сторінка аналітики якості `/analytics`.

Запуск, змінні середовища й деплой описані в [кореневому README](../README.md).

Побудовано на базі відкритого шаблону
[agent-starter-react](https://github.com/livekit-examples/agent-starter-react)
від LiveKit (MIT — див. [LICENSE](LICENSE)): збережено каркас LiveKit-сесії та
компоненти Agents UI, повністю перероблено брендинг, головну сторінку, меню
і додано аналітику (sessions API + LLM-as-judge).
