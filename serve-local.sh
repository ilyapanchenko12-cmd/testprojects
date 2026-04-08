#!/usr/bin/env bash
# Локальный просмотр CRM (статика). Порт по умолчанию 5174.
set -e
cd "$(dirname "$0")"
PORT="${1:-5174}"
echo ""
echo "  D7 CRM — локальный сервер (статика)"
echo "  Открой: http://localhost:${PORT}/  → simple_working.html"
echo "  ИИ и бот: во втором терминале — cd backend && cp .env.example .env && npm install && npm start"
echo "  Остановка: Ctrl+C"
echo ""
exec python3 -m http.server "$PORT"
