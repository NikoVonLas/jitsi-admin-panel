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

Caddy — единственная точка входа. Все три API недоступны снаружи Docker-сети.

## Services

### api-adm (port 8000)
Auth gateway и control plane. Единственный сервис с публичными (без токена)
маршрутами: `/auth/config`, `/auth/local/login`, `/oidc/redirect`. Все
остальные маршруты требуют `is_superadmin = true`.

Также только api-adm:
- инициализирует базовую схему на пустой БД и запускает миграции при старте
  (`migrateTo*()` + `metadata.database_version`)
- при отсутствии OIDC-провайдеров может создать первый из `OIDC_*` env
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
`api/database/02-create-jitsi-tables.sql`: в development compose её может
применить Docker init, а на чистом production volume её применяет api-adm.
Дальнейшие миграции выполняются тем же api-adm. Остальные API ждут его
healthcheck, поэтому не стартуют посреди миграции.

## Auth Flow

**Local:** `POST /api/adm/auth/local/login` → PBKDF2-верификация пароля →
HS256 JWT (`API_SECRET`) → `Set-Cookie: token=...; HttpOnly; Path=/api`.

**OIDC:** SPA получает `auth_url` → редирект на провайдер → колбэк на
`/oidc/validate` → api-adm обменивает code на токен, достаёт `sub`, создаёт
или обновляет identity → тот же HS256 JWT в cookie.

Для Keycloak-only установки первый OIDC-провайдер создаётся из `OIDC_*` env,
если таблица провайдеров пуста. Дальше записи управляются через UI и имеют
приоритет над env. Пользователи создаются в Keycloak; Admin REST API Keycloak
не используется. Локальные identity/profile создаются JIT при первом входе.

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

Базовая схема хранится в `api/database/02-create-jitsi-tables.sql`. Версионные
миграции реализованы функциями `migrateTo*()` в `api/lib/adm/migration.ts`;
существующие миграции не изменяются, новая схема добавляется следующей версией.

## Jitsi Token Generation

Ссылки на встречи и комнаты генерируются server-side в `lib/common/helper.ts`
через Web Crypto API:
- Self-hosted: HS256/HS512, symmetric key из `domain_attr.app_secret`

Хост получает `moderator: true`, гость — `moderator: false`.

## Email Reminders

Cronjob в api-adm раз в 30 секунд выбирает встречи, начинающиеся примерно
через 30 минут, и отправляет владельцу ссылку `/jm/:meetingId`. Эта публичная
страница позволяет открыть moderator URL из активной сессии либо войти по
host key. SMTP берётся из настроек БД с fallback на `MAILER_*` env api-adm.

## Key Decisions

| Решение | Обоснование |
|---------|-------------|
| Три отдельных API-процесса | Изоляция уровней доступа: pub без auth, pri с auth, adm с superadmin |
| Один origin через Caddy | cookie работает на все три API, CORS не нужен |
| POST для всех read-операций | Единообразие; body для pagination/фильтров без query-string |
| Без фреймворка (ручной роутинг) | Минимум зависимостей, Deno-first подход |
| httpOnly cookie + SameSite=Lax | CSRF-митигация без отдельного токена |
