# D7 CRM (рабочий дашборд)

**Продакшен-интерфейс:** `simple_working.html` (тёмная тема, KPI из отчётов Telegram, фильтры, админ).

**НЕ использовать для продакшена:** старый React/MUI демо в папке `src/` (синий экран «CRM Арбитраж», заявки, ссылки) — это legacy-шаблон. Запуск: `npm run start:react-legacy-demo` (порт 3000).

## Как это должно работать на сервере

Поднимается **Node-приложение из `backend/`**: оно отдаёт API `/api/*` и статику с корня репозитория, главная страница — `simple_working.html`.

```bash
npm install
npm start
```

По умолчанию порт `3847` (или `PORT` из окружения). Открой: `http://<хост>:<PORT>/`

Переменные окружения — см. `backend/.env.example` (`GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `SQLITE_PATH` и т.д.).

## Локально

```bash
npm install
npm run dev
```

## Почему на хостинге показывалось «левое» демо

Если в настройках деплоя была команда **`npm start`** из старого `package.json`, запускался **react-scripts** (CRA) — синий интерфейс. Сейчас **`npm start`** запускает **backend** и отдаёт нужный UI.

Перезалей репозиторий и пересобери/перезапусти сервис с обновлённым `package.json`.

## Структура

- `simple_working.html` — основной фронт
- `backend/src/server.js` — Express, статика, API
- `backend/src/bot.js` — Telegram-бот
- `src/` — устаревший React-демо (не для продакшена D7 CRM)
