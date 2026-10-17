# Routes: Backend API + Frontend Pages

Matches `schema.prisma` (Teacher, Participant, RefreshToken, Test, QuestionSet, Question, ExamSession, Answer, Event).

## Conventions

- Base path: `/api/v1`. JSON only (except the event upload, which is multipart).
- Success: `{ "data": ..., "meta"?: {...} }`. Error: `{ "error": { "code", "message", "details"? } }`.
- Auth: httpOnly cookies `access_token` (about 15 min) and `refresh_token`. The JWT carries `{ sub, role: TEACHER | STUDENT }`. A student token's `sub` is the `participantId`, so student routes need no `testId`.
- Every route validates `params`, `query` and `body` with zod.
- Pagination: `?page=1&limit=20` (limit max 100). Response `meta: { page, limit, total }`.
- Time: all timestamps are ISO 8601 UTC. The server is the authority for time.

Auth column: **public**, **T** = teacher, **S** = student. Teacher routes also check that the test belongs to that teacher.

---

# PART 1: BACKEND ROUTES

## 1. Health

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/health` (no `/api/v1` prefix) | public | `{ status: "ok" }` |

## 2. Auth

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/teacher/register` | public | `{ name, email, password (min 8) }` | 201 `{ id, name, email, role }`, sets cookies. 409 `EMAIL_TAKEN` |
| POST | `/auth/teacher/login` | public | `{ email, password }` | 200 `{ id, name, email, role }`, sets cookies. 401 `INVALID_CREDENTIALS`, 423 `ACCOUNT_LOCKED` |
| POST | `/auth/student/login` | public | `{ testId (uuid), email, password }` | 200 `{ participantId, name, email, role, testId }`, sets cookies. 401, 423, 403 `TEST_NOT_PUBLISHED`, 403 `TEST_ENDED` |
| POST | `/auth/refresh` | refresh cookie | none | 200, rotates both cookies. 401 `INVALID_REFRESH` (reuse revokes the whole token family) |
| POST | `/auth/logout` | any | none | 204, revokes the refresh token, clears cookies |
| GET | `/auth/me` | T or S | none | Teacher: `{ id, name, email, role }`. Student: `{ participantId, name, email, role, testId }` |
| POST | `/auth/teacher/forgot-password` | public | `{ email }` | 200 always (do not reveal whether the email exists). Emails a reset link |
| POST | `/auth/teacher/reset-password` | public | `{ token, newPassword }` | 200. 400 `INVALID_OR_EXPIRED_TOKEN`. Revokes all refresh tokens of that teacher |

Rate-limit every `/auth/*` login and forgot-password route (for example 10 per 15 min per IP). Lock after 5 failed logins (`failedLogins`, `lockedUntil`).

## 3. Teacher: Tests

| Method | Path | Auth | Params / Query / Body | Response |
|---|---|---|---|---|
| POST | `/tests` | T | Body below | 201 full test. Service sets default `rulesConfig` |
| GET | `/tests` | T | Query `status?` (DRAFT/PUBLISHED), `page`, `limit` | List: `{ id, title, startsAt, durationMinutes, status, participantCount, submittedCount }` |
| GET | `/tests/:testId` | T | Param `testId` (uuid) | Full test with sets, questions (with `correctIndex`), policy, `rulesConfig` |
| PUT | `/tests/:testId` | T | Same body as create | 200. Draft only, otherwise 409 `TEST_LOCKED`. Replaces sets and questions |
| DELETE | `/tests/:testId` | T | none | 204. Draft only |
| POST | `/tests/:testId/publish` | T | none | 200. Checks: at least 1 set with at least 1 question, at least 1 participant, `startsAt` in the future. Else 422 `NOT_READY` with `details` listing what is missing |

Create / update body:

```json
{
  "title": "Physics Midterm",
  "description": "Chapters 1-4",
  "startsAt": "2026-11-02T09:00:00Z",
  "durationMinutes": 60,
  "warningsEnabled": true,
  "maxWarnings": 2,
  "autoSubmitOnLimit": true,
  "sets": [
    {
      "name": "Set A",
      "questions": [
        { "text": "…", "options": ["a","b","c","d"], "correctIndex": 1, "marks": 1, "order": 1 }
      ]
    }
  ]
}
```

Validation: 2 to 6 options per question, `correctIndex` inside the options, `maxWarnings` 1 to 5, `durationMinutes` 5 to 480, `startsAt` in the future, unique set names, unique `order` per set.

## 4. Teacher: Participants (students)

| Method | Path | Auth | Params / Body | Response |
|---|---|---|---|---|
| POST | `/tests/:testId/participants` | T | Body `{ students: [{ name, email }] }` (max 500) | 201 `{ created: n, skipped: [{ email, reason }] }`. Generates a password per student, stores the hash, assigns sets round-robin. Skips duplicate emails |
| GET | `/tests/:testId/participants` | T | Query `page`, `limit`, `search?` | `{ id, name, email, set: {id,name}, credentialsSentAt, emailError }` |
| DELETE | `/tests/:testId/participants/:participantId` | T | none | 204. Only before the test starts and with no session |
| POST | `/tests/:testId/participants/send-credentials` | T | none | 202 `{ sent, failed }`. Test must be published. Sends the plain password, start time and join link only to participants whose `credentialsSentAt` is null. Failures go to `emailError` |
| POST | `/tests/:testId/participants/:participantId/resend` | T | none | 200. Generates a new password, invalidates the old one, revokes refresh tokens, re-emails |

Join link in the email: `{FRONTEND_URL}/join/{testId}`. Never put the password in a URL.

## 5. Teacher: Results and Review

| Method | Path | Auth | Params / Query | Response |
|---|---|---|---|---|
| GET | `/tests/:testId/sessions` | T | Query `risk?` (LOW/MEDIUM/HIGH), `status?` (NOT_STARTED/IN_PROGRESS/SUBMITTED/AUTO_SUBMITTED), `sort?` (`risk:desc` default, `name:asc`, `score:desc`), `page`, `limit` | One row per participant: `{ participantId, name, email, examSessionId?, status, endReason?, score?, riskLevel?, riskScore?, warningCount?, events: { total, pending, valid, falseAlarm } }` |
| GET | `/sessions/:examSessionId` | T | none | `{ session: { id, status, endReason, startedAt, endsAt, submittedAt, warningCount, score, riskScore, riskLevel }, participant: { name, email, set }, events: [{ id, type, occurredAt, durationMs, weight, countedAsWarning, warningNumber, review, hasSnapshot, meta }], answers: [{ questionId, selectedIndex, correct }] }` (events ordered by `occurredAt`) |
| GET | `/events/:eventId/snapshot` | T | none | JPEG bytes (`image/jpeg`). Private, teacher-owned only |
| PATCH | `/events/:eventId/review` | T | Body `{ review: "VALID" \| "FALSE_ALARM" \| "PENDING" }` | 200 `{ event, session: { riskScore, riskLevel } }`. Recomputes risk (events marked FALSE_ALARM are excluded) |

## 6. Teacher: Tuning and Warning Policy

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/tests/:testId/rules` | T | none | `{ policy: { warningsEnabled, maxWarnings, autoSubmitOnLimit }, rules: <rulesConfig>, stats: { NO_FACE: { total, pending, valid, falseAlarm, falseAlarmRate, sessionsAffected }, ... }, locked }` |
| PUT | `/tests/:testId/rules` | T | `{ policy: {...}, rules: <rulesConfig> }` | 200. Only before `startsAt`, otherwise 409 `TEST_LOCKED` |

`falseAlarmRate = falseAlarm / (valid + falseAlarm)`, counting reviewed events only. Include `reviewedCount` so the teacher knows how reliable the rate is.

`rulesConfig` shape:

```json
{
  "warningCooldownSec": 15,
  "NO_FACE":        { "enabled": true, "afterSec": 3, "weight": 3, "warn": false },
  "MULTIPLE_FACES": { "enabled": true, "afterSec": 2, "weight": 4, "warn": true },
  "LOOKING_AWAY":   { "enabled": true, "afterSec": 5, "yawDeg": 35, "ignoreLookingDown": true, "weight": 1, "warn": false },
  "PHONE_DETECTED": { "enabled": true, "minConfidence": 0.6, "afterSec": 2, "weight": 5, "warn": true },
  "TAB_SWITCH":     { "enabled": true, "weight": 2, "warn": true },
  "levels":         { "medium": 10, "high": 25 }
}
```

## 7. Student: Exam

All student routes require role STUDENT and act on the logged-in participant's own test and session.

| Method | Path | Body | Response / Errors |
|---|---|---|---|
| GET | `/exam/info` | none | `{ test: { title, description, startsAt, durationMinutes }, participant: { name, email }, policy: { warningsEnabled, maxWarnings, autoSubmitOnLimit }, serverTime, consentGiven, sessionStatus (null or status), canStart }` |
| POST | `/exam/consent` | `{ accepted: true }` | 200 (sets `consentAt` once, kept in the pending state until start). 403 `TEST_NOT_STARTED` is not applied here, so consent can happen in the lobby |
| POST | `/exam/start` | none | 200 (idempotent: a refresh returns the same session). `{ session: { id, endsAt, warningCount }, serverTime, test: { title, durationMinutes }, policy, rules: <client thresholds only>, questions: [{ id, text, options, marks, order }], answers: [{ questionId, selectedIndex }] }`. Errors: 403 `CONSENT_REQUIRED`, 403 `TEST_NOT_STARTED`, 403 `TEST_ENDED`, 409 `ALREADY_SUBMITTED` |
| GET | `/exam/status` | none | `{ serverTime, endsAt, status, warningCount, answers: [...] }` (resync after reconnect) |
| PUT | `/exam/answers/:questionId` | `{ selectedIndex }` | 200 `{ questionId, selectedIndex, savedAt }`. 409 `SESSION_ENDED` after `endsAt` plus 5s grace. 400 if the question is not in the student's set |
| POST | `/exam/events` | multipart: `type`, `occurredAt`, `durationMs?`, `meta?` (JSON string), `snapshot?` (JPEG, max 50 KB) | 201 `{ eventId, warning: { counted, number, max, remaining, terminated } \| null }`. `warning` is null when `warningsEnabled` is false. 409 `SESSION_ENDED` |
| POST | `/exam/submit` | none | 200 `{ status: "SUBMITTED", submittedAt }`. Grades on the server. Idempotent |

`correctIndex` is never sent to students. Students never see their score unless you add a setting later.

### Event ingest rules (server)

1. Session must be `IN_PROGRESS` and before `endsAt`.
2. Look up the rule in `rulesConfig`. If it is disabled, store nothing.
3. Store the event with `weight` from the rule and save the snapshot.
4. Count a warning only if: `warningsEnabled`, the rule has `warn: true`, and the same type has no counted warning within `warningCooldownSec`.
5. If counted: `warningCount++`, set `event.countedAsWarning` and `warningNumber`.
6. If `warningCount > maxWarnings` and `autoSubmitOnLimit`: finalize with `AUTO_SUBMITTED` and `endReason = WARNING_LIMIT`, return `terminated: true`.
7. Update `riskScore` and `riskLevel`.

### Background jobs (no HTTP routes)

| Job | Schedule | Action |
|---|---|---|
| `finalize-expired-sessions` | every minute | Sessions `IN_PROGRESS` with `endsAt` in the past: grade, set `AUTO_SUBMITTED`, `endReason = TIME_UP` |
| `cleanup-auth-tokens` | daily | Delete expired `RefreshToken` and used/expired `PasswordResetToken` rows |
| `cleanup-snapshots` | daily | Delete snapshots older than N days |

## 8. Backend Error Codes

| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | zod failure |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `INVALID_REFRESH` | auth failures |
| 403 | `FORBIDDEN`, `CONSENT_REQUIRED`, `TEST_NOT_STARTED`, `TEST_ENDED`, `TEST_NOT_PUBLISHED` | permission or time window |
| 404 | `NOT_FOUND` | missing or not owned |
| 409 | `EMAIL_TAKEN`, `TEST_LOCKED`, `ALREADY_SUBMITTED`, `SESSION_ENDED` | state conflicts |
| 422 | `NOT_READY` | publish checks failed |
| 423 | `ACCOUNT_LOCKED` | too many failed logins |
| 429 | `RATE_LIMITED` | rate limit |
| 502/504 | `UPSTREAM_ERROR` | email provider failure |

---

# PART 2: FRONTEND ROUTES

12 pages. Route protection in `proxy.ts` only checks that the cookie exists and redirects to the right login. Each protected layout then calls `GET /auth/me` and redirects if the role is wrong.

## 1. Page Map

| # | Route | Role | Rendering |
|---|---|---|---|
| 1 | `/register` | public | client form |
| 2 | `/login` | public | client form |
| 3 | `/forgot-password` | public | client form |
| 4 | `/reset-password?token=` | public | client form |
| 5 | `/dashboard` | T | server page + client filters |
| 6 | `/tests/new` | T | client form |
| 7 | `/tests/[testId]/edit` | T | server fetch + client form |
| 8 | `/tests/[testId]` | T | tabs: Students, Sessions, Tuning |
| 9 | `/tests/[testId]/sessions/[examSessionId]` | T | server page + client review controls |
| 10 | `/join/[testId]` | public (student login) | client form |
| 11 | `/exam/lobby` | S | client |
| 12 | `/exam/room` | S | client (all detection and timer logic) |
| 13 | `/exam/done` | S | server |

Student exam routes need no `testId` in the path because the token holds the participant, so `/exam/*` is used. That makes 13 route files, but the Students/Sessions/Tuning tabs share one route, and `new` and `edit` share one form component.

## 2. Page Details: Params and Data

### `/register`, `/login`, `/forgot-password`, `/reset-password`
- Mutations: `POST /auth/teacher/register`, `POST /auth/teacher/login`, `POST /auth/teacher/forgot-password`, `POST /auth/teacher/reset-password`.
- `searchParams`: `token` (string, required on reset), `next?` on login (only allow same-origin paths).
- On success: redirect to `/dashboard`.

### `/dashboard`
- `searchParams` (zod): `status?: DRAFT|PUBLISHED`, `page?: number`.
- Fetch (server): `GET /tests?status=&page=&limit=`.
- Shows test cards or table, "New test" button, empty state.

### `/tests/new` and `/tests/[testId]/edit`
- Params: `testId` (uuid) on edit.
- Fetch (edit, server): `GET /tests/:testId`. If `status` is PUBLISHED, show read-only with a notice.
- Mutations: `POST /tests`, `PUT /tests/:testId`, `DELETE /tests/:testId`.
- One `TestForm` component: test details, warning policy (toggle, `maxWarnings`, auto-submit checkbox), sets and MCQ editor (`useFieldArray`). Zod schema mirrors the backend body.

### `/tests/[testId]`
- Params: `testId`. `searchParams`: `tab?: students|sessions|rules` (default `students`).
- Fetch (server, header): `GET /tests/:testId` (title, status, start time, counts).
- **Students tab**
  - Fetch: `GET /tests/:testId/participants?page=&search=`.
  - Mutations: `POST /tests/:testId/participants` (paste or CSV, parsed and zod-checked in the browser), `DELETE .../:participantId`, `POST .../send-credentials`, `POST .../:participantId/resend`, `POST /tests/:testId/publish`.
  - Shows email status per student (sent, failed with `emailError`).
- **Sessions tab**
  - `searchParams`: `risk?`, `status?`, `sort?`, `page?`.
  - Fetch: `GET /tests/:testId/sessions?risk=&status=&sort=&page=`.
  - Row links to `/tests/[testId]/sessions/[examSessionId]` when `examSessionId` exists.
  - While the test is running, poll every 15 to 30 seconds with TanStack Query `refetchInterval`.
- **Tuning tab**
  - Fetch: `GET /tests/:testId/rules`.
  - Mutation: `PUT /tests/:testId/rules`.
  - Shows per-rule alarm counts and false-alarm rate, enabled / threshold / weight / "counts as warning" controls, and the warning policy. Disabled when `locked` is true.

### `/tests/[testId]/sessions/[examSessionId]`
- Params: `testId`, `examSessionId` (both uuid). `searchParams`: `event?` (uuid, scrolls to and highlights that event).
- Fetch: `GET /sessions/:examSessionId`.
- Snapshots: `<img src="{API_URL}/events/{eventId}/snapshot">` with `credentials` via an authenticated image fetch (or a same-origin proxy), only for events with `hasSnapshot`.
- Mutation: `PATCH /events/:eventId/review` with optimistic update. On success update that event and the session's `riskScore` and `riskLevel`.
- UI: timeline with warning badges ("Warning 1"), Valid and False alarm buttons, answers summary, score.

### `/join/[testId]`
- Params: `testId` (uuid).
- Mutation: `POST /auth/student/login { testId, email, password }`.
- On success redirect to `/exam/lobby`. Show the right message for `TEST_NOT_PUBLISHED`, `TEST_ENDED`, `ACCOUNT_LOCKED`.

### `/exam/lobby`
- Fetch: `GET /exam/info`. Use `serverTime` to compute the clock offset for the countdown.
- Shows rules and policy in plain words ("You will get 2 warnings. A further violation will end your exam"), consent checkbox, camera permission and live camera check (local only, nothing uploaded).
- Mutation: `POST /exam/consent`.
- When `canStart` becomes true, enable "Start exam". Redirect to `/exam/room` after `POST /exam/start` succeeds. If `sessionStatus` is `IN_PROGRESS`, redirect straight to `/exam/room`. If submitted, redirect to `/exam/done`.

### `/exam/room`
- Fetch/mutate on load: `POST /exam/start` (idempotent) gives questions, answers, `endsAt`, policy, rules.
- On reconnect or tab focus: `GET /exam/status`.
- Mutations: `PUT /exam/answers/:questionId` (on every selection, debounced and retried), `POST /exam/events` (multipart), `POST /exam/submit`.
- Client logic:
  - Countdown from `endsAt - (serverTime - Date.now())`. Show the banner at 5 minutes left. Auto call `/exam/submit` at 0.
  - Detection loop in a Web Worker at about 2 to 3 fps. Only snapshots (not video) are uploaded when an event fires.
  - Tab leave via `visibilitychange` and `blur`.
  - On an event response with `warning.counted`, show a blocking warning dialog ("Warning 1 of 2"). If `warning.terminated`, redirect to `/exam/done`.
  - Event queue with retry when offline.

### `/exam/done`
- Fetch: `GET /exam/status` to show submitted or ended-for-violations message and time.
- No answers or score shown unless you add a setting later.

## 3. Frontend Files per Feature

```
features/
  auth/        api.ts  schemas.ts  hooks/use-login.ts use-register.ts use-me.ts
  tests/       api.ts  schemas.ts  keys.ts  hooks/use-tests.ts use-test.ts use-save-test.ts use-publish-test.ts
  participants/api.ts  schemas.ts  keys.ts  hooks/use-participants.ts use-add-participants.ts use-send-credentials.ts use-resend.ts
  sessions/    api.ts  schemas.ts  keys.ts  hooks/use-sessions.ts use-session.ts use-review-event.ts
  rules/       api.ts  schemas.ts  keys.ts  hooks/use-rules.ts use-save-rules.ts
  exam/        api.ts  schemas.ts  keys.ts
               hooks/use-exam-info.ts use-start-exam.ts use-countdown.ts use-autosave-answer.ts
                     use-event-queue.ts use-proctoring.ts use-tab-visibility.ts
               components/ camera-check.tsx question-view.tsx warning-dialog.tsx timer.tsx
```

## 4. Query Keys

```ts
testKeys     = { all: ["tests"], list: (p) => [...all, "list", p], detail: (id) => [...all, "detail", id] }
participantKeys = { list: (testId, p) => ["participants", testId, p] }
sessionKeys  = { list: (testId, p) => ["sessions", testId, p], detail: (id) => ["session", id] }
ruleKeys     = { detail: (testId) => ["rules", testId] }
examKeys     = { info: ["exam", "info"], status: ["exam", "status"] }
```

Invalidate: saving a test invalidates `testKeys`. Adding or deleting participants invalidates `participantKeys.list` and `testKeys.detail`. Reviewing an event updates `sessionKeys.detail` and invalidates `sessionKeys.list` and `ruleKeys.detail` (stats change).

## 5. API Client Behavior

- Every call goes through `lib/api-client.ts` with `credentials: "include"` and zod-parses the response.
- On 401: call `POST /auth/refresh` once, then retry the original request. If refresh fails, redirect (teacher to `/login`, student to `/join/{testId}`).
- On 403 `ACCOUNT_LOCKED` / 423: show the lock message.
- Server components forward the incoming cookies to the Node API (`await cookies()`).
- `/exam/events` uses `FormData`, not JSON.

## 6. Navigation Flow

```
Teacher:  /register → /dashboard → /tests/new → /tests/[id] (Students → publish → send credentials)
          → /tests/[id]?tab=sessions → /tests/[id]/sessions/[sessionId]
          → /tests/[id]?tab=rules

Student:  email link → /join/[testId] → /exam/lobby → /exam/room → /exam/done
```
