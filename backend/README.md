# D7 CRM — backend (SQLite + Gemini + Telegram)

## Что внутри

- **SQLite** (`data/d7-crm.sqlite`): промпты, сообщения из Telegram, ответы ИИ.
- **Gemini** (`GEMINI_API_KEY`, `GEMINI_MODEL`): разбор дашборда, советы, парсинг TG. Для free tier не используйте `gemini-2.0-flash` (часто quota `limit: 0`); по умолчанию в коде — `gemini-2.5-flash-lite`, при 429 перебираются запасные модели из `GEMINI_FALLBACK_MODELS`.
- **Telegram** (`TELEGRAM_BOT_TOKEN`, long polling): все входящие сообщения пишутся в БД.

## Запуск

```bash
cd backend
cp .env.example .env
# Заполните GEMINI_API_KEY и при необходимости TELEGRAM_BOT_TOKEN
npm install
npm start
```

API по умолчанию: `http://127.0.0.1:3847`.

## Эндпоинты

| Метод | Путь | Описание |
|--------|------|-----------|
| GET | `/api/health` | Статус, есть ли ключи |
| GET | `/api/prompt/main` | Текущий системный промпт |
| PUT | `/api/prompt/main` | Обновить промпт (тело JSON `{ "body": "..." }`; если задан `CRM_API_SECRET`, заголовок `X-CRM-SECRET`) |
| POST | `/api/ai/dashboard` | `{ "userEmail", "role", "filterCtx" }` → сводка по демо-метрикам |
| GET | `/api/advice?email=&role=` | Персональные советы; `&refresh=1` — сгенерировать заново |
| GET | `/api/telegram/recent?limit=30` | Последние сообщения из бота |
| GET | `/api/insights/recent` | Последние ответы ИИ (превью) |
| GET | `/api/reports/finance?limit=40` | Отчёты из Telegram после парсинга (для дашборда) |
| GET | `/api/kpis/live?project=peru2&role=ADMIN` | Демо KPI + метрики из отчётов: **сумма** по `spend`, `revenue`, `fd`, `fdSum`, объёмам; планы и доли — **последний** отчёт (`kpis.js`) |
| GET / POST / DELETE | `/api/channels/bindings` | Привязка `chat_id` Telegram-канала к ключу проекта CRM (`peru2`, …) |

**Каналы:** бот должен быть **админом** в канале. В CRM → «ИИ-аналитик» укажите `chat_id` канала и проект. Посты канала обрабатываются как `channel_post`; при выборе проекта на дашборде подставляются последние значения из `metrics` отчётов.

**Главные ключи (админ, верхний финсрез):** `spend`, `revenue`, `fd` (кол-во FD), `fdSum` (сумма FD в валюте). При выбранном проекте эти поля **без демо**: нет в отчёте — на карточке «—». Синонимы в отчёте (рус/лат) мапятся в `kpis.js`.

В CRM в `localStorage` можно задать базовый URL API: ключ `d7_crm_api_base` (см. подсказку в интерфейсе «ИИ-аналитик»).

## Промпт

Меняйте текст в таблице `prompts` через `PUT /api/prompt/main` или напрямую в SQLite. Дефолтный промпт задаётся при первом старте в `src/db.js`.
