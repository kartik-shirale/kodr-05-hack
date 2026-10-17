# Platform Features Specification

> **AI-Powered Online Examination & Proctoring Platform**  

---

## 📋 Executive Overview

This platform is an enterprise-grade, end-to-end online examination system featuring **automated AI vision proctoring**, **anti-cheat question randomization**, **real-time teacher monitoring**, and **forensic audit review**. It eliminates cheating vectors through multimodal computer vision (head pose, face count, phone detection, tab switches) paired with an automated warning and session termination engine.

---

## 👩‍🏫 1. Teacher & Instructor Features

### 1.1 Authentication & Account Security
- **Self-Service Registration & Login:** Dedicated teacher authentication pipeline with email and secure password.
- **Brute-Force Protection:** Temporary account lockout after 5 consecutive failed login attempts (`lockedUntil`).
- **Device Session Management:** Refresh token family rotation with automated theft detection and revocation.

### 1.2 Test Creation & Configuration
- **Lifecycle Management:** Draft mode for creating and editing tests; one-click publish validation.
- **Scheduling & Timing:** Strict test start time (`startsAt`), custom duration (5 to 480 minutes), and automatic expiry.
- **Multiple Question Sets (Anti-Collusion):**
  - Ability to create multiple sets (e.g., *Set A*, *Set B*).
  - Students are assigned sets round-robin automatically upon enrollment.
  - Prevents peer-to-peer answer sharing during concurrent exam sessions.
- **Rich MCQ Question Builder:**
  - Add multiple-choice questions with 2 to 6 options per question.
  - Configurable marks and question ordering.
  - Strict server-side storage of correct answer indices (students never receive answer keys).

### 1.3 Warning & Violation Policy Controls
- **Configurable Enforcement Modes:**
  - **Warnings Enabled / Silent Ingest:** Toggle between active student warnings and silent telemetry recording.
  - **Customizable Warning Quota:** Limit allowable infractions (1 to 5 warnings).
  - **Automated Termination:** Optional auto-submit triggering immediately if a student exceeds the warning threshold.
- **Anti-Tampering Locks:** Test policies and questions are strictly locked once the test start time arrives.

### 1.4 Student & Participant Management
- **Bulk Import Options:**
  - Paste name and email lists with automatic delimiter detection (comma, tab, semicolon).
  - CSV file upload with real-time browser validation.
- **Automated Credential Generation:**
  - Unique, secure passwords generated per student and stored hashed.
  - Prevents students from needing pre-existing accounts.
- **Automated Email Dispatch:**
  - One-click bulk credential dispatch via EmailJS (with dev console fallback).
  - Includes scheduled start time, test duration, generated password, and private join URL.
  - Delivery tracking with status indicators (`credentialsSentAt`, `emailError`).
- **Individual Credential Resend:** Re-generate a fresh password, invalidate active sessions, and re-dispatch on demand.

### 1.5 Live Exam Monitoring & Analytics
- **Real-Time Proctoring Dashboard:**
  - 20-second automatic polling with live monitoring status indicator.
  - Filter sessions by Risk Tier (`LOW`, `MEDIUM`, `HIGH`) and Status (`NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`).
  - Sort participants by risk score, submission time, or student name.
- **Participant Metrics:** Total violations, warning count, score, and individual event breakdowns (pending, valid, false alarm).

### 1.6 Fine-Grained Detection Rule Tuning
- **Customizable AI Detection Rules:**
  - Adjust detection parameters for `NO_FACE`, `MULTIPLE_FACES`, `LOOKING_AWAY`, `PHONE_DETECTED`, and `TAB_SWITCH`.
  - Configure duration thresholds (`afterSec`) required before an observation is counted.
  - Set warning cooldown intervals (`warningCooldownSec`) to prevent duplicate warnings.
  - Configure yaw angle thresholds and ignore-looking-down filters for gaze tracking.
  - Customize risk score weights and risk thresholds (`levels.medium`, `levels.high`).
- **False-Alarm Rate Analytics:** Visual feedback on historical false-alarm rates per rule to assist instructors in calibrating sensitivity.

### 1.7 Forensic Audit & Session Review
- **Chronological Timeline View:** Complete record of all infractions captured during the exam with exact millisecond timestamps.
- **Encrypted Snapshot Inspector:**
  - Private, authenticated image viewer displaying webcam snapshots captured during violations.
  - Metadata inspection (AI confidence, head angle, face counts, notes).
- **Human-in-the-Loop Validation:**
  - Instructors can review events and mark them as `VALID`, `FALSE_ALARM`, or `PENDING`.
  - Dynamic score recalculation: Marking an event as `FALSE_ALARM` immediately lowers the student's risk score and recalculates risk tier.
- **Submission & Answer Sheet Audit:** Review student responses question-by-question against correct answers, total scores, and end reasons.

---

## 👨‍🎓 2. Student & Exam Room Features

### 2.1 Frictionless Authentication
- **Direct Test Access:** Quick join via dedicated test URLs (`/join/[testId]`).
- **Dedicated Credential Login:** Students log in using their email and assigned test password.
- **Time Window Verification:** Prevents entry prior to publishing or after exam completion.

### 2.2 Pre-Exam Lobby
- **Clock Synchronization:** Computes server-time offset to ensure synchronized countdowns regardless of local system clocks.
- **Policy Disclosure:** Transparent display of exam rules, maximum warnings allowed, and termination conditions.
- **Legal & Academic Consent:** Explicit consent checkbox required before starting.
- **Pre-Flight Hardware Check:** In-browser webcam stream test to verify camera functionality and lighting before starting.

### 2.3 Interactive Exam Room
- **Continuous Question Navigation:**
  - Clean question viewer with options selection and mark indicators.
  - Real-time progress tracker showing answered vs. unanswered questions.
  - Responsive layout optimized for focus and accessibility.
- **Resilient Auto-Save:**
  - Instant background answer synchronization (`PUT /exam/answers/:questionId`) upon every selection.
  - Visual status feedback (`saved`, `saving`, `error`).
- **Synchronized Countdown & Alerts:**
  - Real-time timer countdown to the exact test end timestamp.
  - Warning banner when 5 minutes remain.
  - Automatic test finalization and submission when time expires.
- **Explicit Final Submission:** Modal confirmation showing total answered questions before submitting.

### 2.4 Active In-Exam Anti-Cheating & Warnings
- **Tab & Window Visibility Tracking:** Instant logging of `visibilitychange` and window `blur` events when the student navigates away.
- **Webcam Snapshot Sampling:** Periodic webcam snapshot capture (every 1 to 5 seconds) sent for AI vision verification.
- **Modal Warning Dialogs:**
  - Blocking overlay modal displayed immediately upon an infraction counted as a warning.
  - Displays current warning index (e.g., *"Warning 1 of 2"*) and clear instructions to return to compliance.
- **Automated Expulsion:** Instant redirection to completion screen if the warning limit is exceeded.
- **Developer Simulator:** Built-in simulation tool for testing infractions (`NO_FACE`, `MULTIPLE_FACES`, `LOOKING_AWAY`, `PHONE_DETECTED`, `TAB_SWITCH`) in development environments.

### 2.5 Exam Completion (`/exam/done`)
- **Submission Confirmation:** Displays submission timestamp and reason (`SUBMITTED_BY_STUDENT`, `TIME_UP`, or `WARNING_LIMIT`).
- **Security-First Score Masking:** Raw scores and question solutions are withheld to preserve test integrity.

---

## 🤖 3. AI Proctoring Engine & Computer Vision

### 3.1 Multimodal Vision Pipeline
- **AI-Powered Image Analysis:** Integrated with OpenRouter / Google Gemini Vision via Vercel AI SDK (`experimental_decide` and `generateObject`).
- **Pre-Processing Optimization:** `sharp` image pipeline rotates, normalizes, and resizes frames to 768x768 JPEG at 72% quality to optimize network bandwidth and model inference latency.

### 3.2 Detection Criteria & Logic
| Violation Type | Detection Mechanism | Configurable Thresholds |
|---|---|---|
| **NO_FACE** | Identifies absence of any recognizable human face in frame | `afterSec`, `weight`, `warn` |
| **MULTIPLE_FACES** | Detects two or more distinct individuals in the camera feed | `afterSec`, `weight`, `warn` |
| **LOOKING_AWAY** | Analyzes head orientation (yaw/pitch: left, right, up, down) away from the screen | `afterSec`, `yawDeg`, `ignoreLookingDown`, `weight`, `warn` |
| **PHONE_DETECTED** | Recognizes handheld mobile devices, smartphones, and tablets | `minConfidence`, `afterSec`, `weight`, `warn` |
| **TAB_SWITCH** | Monitors browser visibility state and window blur events | `weight`, `warn` |

### 3.3 Temporal Consistency & Cooldown Filters
- **Sustained Duration Filter:** Requires an anomaly to persist continuously for `afterSec` before triggering an event, eliminating accidental flickers or sneezes.
- **Cooldown Throttling:** Enforces `warningCooldownSec` to ensure repetitive anomalies do not exhaust a student's warnings within seconds.
- **Dynamic Risk Categorization:** Calculates a cumulative risk score:
  - `LOW`: Score below medium threshold (default < 10)
  - `MEDIUM`: Score between medium and high threshold (default 10 - 24)
  - `HIGH`: Score meeting or exceeding high threshold (default ≥ 25)

---

## ⚙️ 4. Automated Background Jobs

The backend runs lightweight, periodic worker tasks to keep the system resilient without manual operator intervention:

1. **`finalize-expired-sessions` (Every 60s):**
   - Automatically detects active sessions whose `endsAt` timestamp has passed.
   - Computes final student scores based on their assigned question set.
   - Marks sessions as `AUTO_SUBMITTED` with reason `TIME_UP`.
2. **`cleanup-auth-tokens` (Daily):**
   - Purges expired `RefreshToken` entries.
   - Cleans up used and expired `PasswordResetToken` records.
3. **`cleanup-snapshots` (Daily):**
   - Removes event snapshot image files older than 30 days from storage to conserve disk space and satisfy data retention privacy requirements.

---

## 🔒 5. Security & Architecture Specifications

- **Token Rotation & Family Revocation:** Refresh tokens rotate on every refresh call; reuse of an invalidated refresh token triggers family revocation to prevent token theft.
- **Role-Based Access Control (RBAC):** Middleware isolation between `TEACHER` and `STUDENT` contexts.
- **HTTP-Only Cookies:** Access and refresh tokens stored in secure, HTTP-only cookies to mitigate XSS exposure.
- **Server-Authoritative Time:** All countdowns, session boundaries, and timestamps are generated and validated on the server.
- **Private Media Storage:** Snapshot files are not publicly accessible; served exclusively through authenticated, teacher-authorized streaming endpoints.
- **Monorepo Structure:**
  - `apps/web`: Next.js 16 (React 19, Tailwind CSS, TanStack Query, shadcn/ui)
  - `apps/api`: Express 5 with TypeScript and Prisma 8 ORM
  - `apps/flask-api`: Python 3.11+ Flask service
  - `Turborepo`: Cached builds, pipeline orchestration, and linting
