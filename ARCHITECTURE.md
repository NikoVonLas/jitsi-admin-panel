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
Он удаляет заголовок `Server` и добавляет базовые anti-sniffing, anti-framing,
referrer и permissions-policy заголовки для панели.
Адрес сайта Caddy вычисляется Compose из раздельных `APP_SCHEME` и `APP_FQDN`;
при нестандартном внутреннем bind его можно переопределить через
`CADDY_ADDRESS`, не ломая публичные ссылки и OIDC callback URL.

## Services

### api-adm (port 8000)

Auth gateway и control plane. Единственный сервис с публичными (без токена)
маршрутами: `/auth/config`, `/auth/local/*`, `/oidc/redirect`, а также строго
определёнными POST callback/logout-маршрутами OIDC. Все остальные маршруты
требуют `is_superadmin = true`.

Также только api-adm:

- инициализирует базовую схему на пустой БД и запускает миграции при старте
  (`migrateTo*()` + `metadata.database_version`)
- при отсутствии OIDC-провайдеров может создать первый из `OIDC_*` env
- запускает housekeeping (каждые 10 мин) и cronjob email-напоминаний (каждые 30 сек)

api-pri и api-pub при старте проверяют версию БД и завершаются с ошибкой,
если она не совпадает с константой `DB_VERSION` в `config.ts`.

Каждый API перед подключением к БД валидирует обязательные runtime-параметры.
Общий JWT-secret передаётся только api-adm/api-pri, SMTP-пароль — только
api-adm, а api-pub получает лишь параметры БД и язык. Compose включает
`no-new-privileges` для всех контейнеров приложения и не запускает Caddy до
успешных healthcheck всех API.

### api-pri (port 8001)

Основной рабочий сервис. Все маршруты требуют валидный JWT в httpOnly-cookie
`token`. Покрывает домены, комнаты, встречи, расписания, профили и настройки.
Недоступный из продукта legacy-контур contacts/invites/phones/intercom удалён;
пользователи создаются локальной регистрацией или JIT-входом через OIDC.

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

**OIDC:** api-adm создаёт подписанную одноразовую auth-транзакцию в
HttpOnly-cookie (state, provider, safe next, nonce, PKCE verifier) → SPA
редиректит на провайдер с PKCE S256 → колбэк `/oidc/validate` передаёт только
code и state → api-adm проверяет транзакцию, подпись ID/access token через
JWKS, issuer, audience, expiry, nonce и совпадение `sub` с userinfo → создаёт
или обновляет identity → тот же HS256 JWT в cookie. Идентификатор identity
строится из пары `(issuer, sub)`, поэтому одинаковые `sub` разных провайдеров
не пересекаются.

SPA хранит только несекретный session-marker после успешного local/OIDC
входа. JWT панели, ID token и access token в Web Storage не попадают.

Для Keycloak-only установки первый OIDC-провайдер создаётся из `OIDC_*` env,
если таблица провайдеров пуста. Дальше записи управляются через UI и имеют
приоритет над env. Пользователи создаются в Keycloak; Admin REST API Keycloak
не используется. Локальные identity/profile создаются JIT при первом входе.

Суперадмин-флаг: для local auth — единственный победитель атомарной регистрации
первого пользователя;
для OIDC — роль `SUPERADMIN_ROLE` из `realm_access.roles` токена провайдера.

При `AUTH_LOCAL=false` api-adm не стартует без активного OIDC-провайдера, а
последний активный провайдер нельзя отключить или удалить.

api-pri верифицирует cookie на каждом запросе; api-pub cookie игнорирует.

## Database Layer

Общий pool (`@db/postgres`) создаётся при загрузке модуля в каждом процессе
(`DB_POOL_SIZE=8`). ORM нет — только параметризованный SQL.

Все DB-функции живут в `api/lib/database/`, по одному файлу на сущность.
Хендлеры вызывают DB-функции, сырой SQL в хендлерах запрещён.

Большинство DB-функций принимают `isSuperAdmin: boolean` — при `true`
фильтр владельца (`AND identity_id = $1`) снимается на уровне SQL.

Базовая схема хранится в `api/database/02-create-jitsi-tables.sql`. Версионные
миграции реализованы функциями `migrateTo*()` в `api/lib/adm/migration.ts`.
Новые изменения добавляются следующей версией; upgrade-path проверяется на
отдельной временной PostgreSQL-базе с сохранением существующих данных.

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
Успешная доставка фиксируется в `meeting_session.reminder_sent_at`; неуспешная
остаётся в очереди до конца окна и повторяется после рестарта процесса.

Daily-расписания с `rep_end_type=forever` хранят скользящий горизонт сессий на
365 дней. Housekeeping пополняет его идемпотентно перед удалением завершённых
сессий; уникальность `(meeting_schedule_id, started_at)` исключает дубликаты.

## End-to-End Test Stack

`docker-compose.e2e.yml` поднимает изолированный одноразовый контур: чистый
PostgreSQL volume, все четыре сервиса панели, SMTP-сервер Mailpit и полный Jitsi Meet
(`prosody`, `jicofo`, `jvb`, `jitsi-web`). В режиме `keycloak` к нему
добавляется настоящий Keycloak с импортируемым realm; пользователи создаются
только в Keycloak, без Admin REST API.

Playwright проходит формы панели, создаёт token-auth домен и комнату, входит
модератором по сгенерированному JWT и подключает анонимного участника во втором
browser context. Успех подтверждается одновременно состоянием конференции в
обоих клиентах и REST-статистикой JVB (`1` конференция, `2` участника). Тот же
сценарий создаёт встречу на окно напоминания, дожидается cronjob и проверяет
реально принятое SMTP-письмо, включая адресата, тему и ссылку. Таким образом
тест покрывает цепочки panel UI → API → PostgreSQL → JWT → Prosody / Jicofo /
JVB и API → cronjob → SMTP, а не только HTTP-доступность контейнеров.

## Release Promotion

Release запускается стабильным semver-тегом `vX.Y.Z`, указывающим на commit из
`main`. Четыре application-образа (`api-adm`, `api-pri`, `api-pub`, `web`)
сначала публикуются в GHCR только с immutable-тегом версии. Две параллельные
job поднимают эти скачанные образы в полном E2E-контуре с local auth и Keycloak;
повторной локальной сборки application-образов на этом этапе нет.

`latest` является promotion-указателем, а не результатом каждой отдельной
сборки. Он обновляется для всех четырёх образов только после успешных E2E.
Перед обновлением workflow сохраняет предыдущие manifest digest и при частичном
сбое promotion восстанавливает прежний набор. Если кандидат не собрался или не
прошёл E2E, promotion job не запускается и production остаётся на прошлой
версии. После promotion создаётся GitHub Release.

`docker-compose.prod.yml` принимает единый `IMAGE_TAG`: по умолчанию `latest`,
а конкретный `vX.Y.Z` фиксирует воспроизводимый deploy или rollback. Сам deploy
на сервер не входит в workflow, поскольку репозиторий не содержит deployment
target или credentials; rollback здесь относится к стабильному набору в GHCR.

## Key Decisions

| Решение                         | Обоснование                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| Три отдельных API-процесса      | Изоляция уровней доступа: pub без auth, pri с auth, adm с superadmin |
| Один origin через Caddy         | cookie работает на все три API, CORS не нужен                        |
| POST для всех read-операций     | Единообразие; body для pagination/фильтров без query-string          |
| Без фреймворка (ручной роутинг) | Минимум зависимостей, Deno-first подход                              |
| httpOnly cookie + SameSite=Lax  | CSRF-митигация без отдельного токена                                 |
| Без legacy invite/intercom flow | Контур не имел create-flow; identities создаются local/OIDC          |
