# Architecture

## Service Map

```
                ┌─────────────────────────────────────────┐
                │          Docker network: intranet        │
                │                                          │
Browser ──443───► web (Caddy) ──/api/adm/──► api-adm:8000 │
                │      │      ──/api/pri/──► api-pri:8001  │
                │      │      ──/api/pub/──► api-pub:8002  │
                │      │                        │          │
                │      └── / (SPA fallback)     ▼          │
                │                           db:5432         │
                └─────────────────────────────────────────┘
```

nginx — единственная точка входа. Все три API недоступны снаружи Docker-сети.

## Services

### api-adm (port 8000)
Auth gateway и control plane. Единственный сервис с публичными (без токена)
маршрутами: `/auth/config`, `/auth/local/login`, `/oidc/redirect`. Все
остальные маршруты требуют `is_superadmin = true`.

Также только api-adm:
- запускает DB-миграции при старте (`migrateTo*()` + `metadata.database_version`)
- запускает housekeeping (каждые 10 мин) и cronjob email-напоминаний (каждые 30 сек)

api-pri и api-pub при старте проверяют версию БД и завершаются с ошибкой,
если она не совпадает с константой `DB_VERSION` в `config.ts`.

### api-pri (port 8001)
Основной рабочий сервис. Все маршруты требуют валидный JWT в httpOnly-cookie
`token`. Покрывает: домены, комнаты, встречи, расписания, профили, контакты,
настройки, intercom.

Единственный GET-маршрут — SSE-поток `/api/pri/intercom/stream`: polling БД
каждые 2.5 сек, push уведомлений клиенту.

### api-pub (port 8002)
Полностью публичный сервис, без аутентификации. Отдаёт файлы (аватары,
фавиконки, логотипы), iCal-файлы по токену, публичную информацию о встречах
и комнатах для гостевых join-страниц.

### web (ports 80/443)
Caddy с собранным React 19 + Vite SPA. Обслуживает статику и выступает
обратным прокси для всех `/api/*` маршрутов — благодаря этому браузер видит
один origin и cookie работает на все три API. TLS-сертификат выпускается
автоматически через Let's Encrypt по значению `APP_FQDN`.

### db
PostgreSQL 17. Схема инициализируется через
`api/database/02-create-jitsi-tables.sql` (Docker init), дальнейшие миграции
применяются кодом api-adm.

## Auth Flow

**Local:** `POST /api/adm/auth/local/login` → PBKDF2-верификация пароля →
HS256 JWT (`API_SECRET`) → `Set-Cookie: token=...; HttpOnly; Path=/api`.

**OIDC:** SPA получает `auth_url` → редирект на провайдер → колбэк на
`/oidc/validate` → api-adm обменивает code на токен, достаёт `sub`, создаёт
или обновляет identity → тот же HS256 JWT в cookie.

Суперадмин-флаг: для local auth — первый зарегистрированный пользователь;
для OIDC — роль `SUPERADMIN_ROLE` из `realm_access.roles` токена провайдера.

api-pri верифицирует cookie на каждом запросе; api-pub cookie игнорирует.

## Database Layer

Общий pool (`@db/postgres`) создаётся при загрузке модуля в каждом процессе
(`DB_POOL_SIZE=8`). ORM нет — только параметризованный SQL.

Все DB-функции живут в `api/lib/database/`, по одному файлу на сущность.
Хендлеры вызывают DB-функции, сырой SQL в хендлерах запрещён.

Большинство DB-функций принимают `isSuperAdmin: boolean` — при `true`
фильтр владельца (`AND identity_id = $1`) снимается на уровне SQL.

Миграции — пронумерованные SQL-файлы в `api/database/`. Существующие файлы
не редактируются — только добавление нового.

## Jitsi Token Generation

Ссылки на встречи и комнаты генерируются server-side в `lib/common/helper.ts`
через Web Crypto API:
- Self-hosted: HS256/HS512, symmetric key из `domain_attr.app_secret`
- JaaS (8x8.vc): RS256/RS512, RSA private key из `domain_attr.jaas_key`

Хост получает `moderator: true`, гость — `moderator: false`.

## Key Decisions

| Решение | Обоснование |
|---------|-------------|
| Три отдельных API-процесса | Изоляция уровней доступа: pub без auth, pri с auth, adm с superadmin |
| Один origin через Caddy | cookie работает на все три API, CORS не нужен |
| POST для всех read-операций | Единообразие; body для pagination/фильтров без query-string |
| Без фреймворка (ручной роутинг) | Минимум зависимостей, Deno-first подход |
| httpOnly cookie + SameSite=Lax | CSRF-митигация без отдельного токена |
