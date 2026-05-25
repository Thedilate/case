# AI-экосистема T&D «Газпром Нефти» MVP

Платформа обучения и развития с AI-наставником для IT-кластера Газпром Нефти.

## 🚀 Быстрый старт в GitHub Codespaces

1. Нажми зелёную кнопку **<> Code** → вкладка **Codespaces** → **Create codespace on main**
2. Дождись загрузки среды (~2 минуты)
3. В терминале Codespace выполни:
   ```bash
   docker compose up -d
   ```
4. Перейди во вкладку **PORTS** (слева внизу VS Code)
5. Найди порт **3000** — нажми на значок 🌐 справа от него, скопируй ссылку
6. Открой ссылку в браузере — это твой публичный URL!

## 🏠 Локальный запуск

```bash
docker compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🧑‍💻 Демо-пользователи

| Пользователь | Email | Роль |
|---|---|---|
| Иванов И.И. | ivan.ivanov@gazpromneft.ru | DevOps Engineer |
| Петрова Е.С. | elena.petrova@gazpromneft.ru | ML Engineer |
| Смирнов А.Д. | alexey.smirnov@gazpromneft.ru | Junior Backend |
| Кузнецова М.А. | maria.kuznetsova@gazpromneft.ru | Data Engineering Lead |
| Волков Д.П. | dmitry.volkov@gazpromneft.ru | Platform Engineering Manager |

Также доступен вход как гость.

## 🛠 Стек

- **Frontend:** Next.js 14 + Tailwind CSS + Recharts
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **AI:** Хардкод-наставник с markdown-диалогами
