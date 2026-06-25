# CEARCS — Frontend Technical Specification Document
## Version 1.0 | Produced from Full Backend Source Analysis

> **Scope:** This document is derived exclusively from reading every source file in the CEARCS backend.
> No assumptions, invented endpoints, or invented entities have been added.
> All claims are traceable to specific source files.

---

# TABLE OF CONTENTS

1. [Phase 1 — Backend Analysis](#phase-1--backend-analysis)
   - 1.1 Solution Structure
   - 1.2 Entity Analysis
   - 1.3 Enumeration Analysis
   - 1.4 Authentication & Authorization Analysis
   - 1.5 API Endpoint Analysis
   - 1.6 DTO Analysis
   - 1.7 Business Rules Analysis
   - 1.8 Notification System
   - 1.9 Real-Time Communication (SignalR)
   - 1.10 Location Services
   - 1.11 Dashboard Analytics
   - 1.12 Kiosk System Analysis
2. [Phase 2 — Frontend Screen Inventory](#phase-2--frontend-screen-inventory)
3. [Phase 3 — Frontend Architecture](#phase-3--frontend-architecture)
4. [Phase 4 — API Integration Plan](#phase-4--api-integration-plan)
5. [Phase 5 — Gap Analysis](#phase-5--gap-analysis)
6. [Implementation Roadmap](#implementation-roadmap)

---

# PHASE 1 — BACKEND ANALYSIS


## 1.1 Solution Structure

### Projects

| Project | Namespace | Target Framework | Role |
|---|---|---|---|
| `CEARCS.Domain` | `CEARCS.Domain` | net10.0 | Entities, Enums, Domain logic |
| `CEARCS.Application` | `CEARCS.Application` | net10.0 | Services, DTOs, Validators, Interfaces |
| `CEARCS.Infrastructure` | `CEARCS.Infrastructure` | net10.0 | EF Core, SignalR, Firebase, Telegram, Repos |
| `CEARCS.Web` | `CEARCS.Web` | net10.0 | ASP.NET Core API Controllers, Middleware, Startup |

### Dependency Direction
```
CEARCS.Web → CEARCS.Application → CEARCS.Domain
CEARCS.Infrastructure → CEARCS.Application → CEARCS.Domain
```

### Key NuGet Dependencies (from bin output)
- `Microsoft.AspNetCore.Authentication.JwtBearer` — JWT Bearer auth
- `Microsoft.EntityFrameworkCore` + `Npgsql.EntityFrameworkCore.PostgreSQL` — PostgreSQL ORM
- `FluentValidation.AspNetCore` — Request validation
- `FirebaseAdmin` — Firebase Cloud Messaging (push notifications)
- `Telegram.Bot` — Telegram Bot API integration
- `BCrypt.Net-Next` — Password hashing
- `CsvHelper` — CSV upload processing (MatricRecords)
- `Scalar.AspNetCore` — OpenAPI UI (development)
- `Microsoft.AspNetCore.SignalR` — Real-time hub

### Architectural Patterns
- **Clean Architecture** with strict layer separation
- **Repository Pattern** — Generic `IRepository<T>` with expression-based queries
- **Feature Folders** — Application layer organized by feature (Auth, Alerts, Admin, etc.)
- **Options Pattern** — Strongly-typed settings classes (JwtSettings, FirebaseSettings, etc.)
- **Background Service** — `AlertEscalationWorker` (IHostedService) polls every 5 seconds

### Layer Responsibilities

**Domain Layer**
- Houses all entities inheriting from `BaseEntity` (Id, CreatedAt, UpdatedAt)
- Houses all enums (AlertStatus, AlertType, UserRole)
- Zero external dependencies — pure C# classes

**Application Layer**
- Feature service implementations and interfaces
- FluentValidation validators for all request DTOs
- `AlertClusteringService` — spatial deduplication logic
- `CampusBoundaryService` — geo-fence enforcement
- `IAlertHubNotifier` — abstraction over SignalR used by services
- Settings POCOs (JwtSettings, CampusBoundarySettings, etc.)

**Infrastructure Layer**
- `CEARCSDbContext` — EF Core context with 8 DbSets
- Entity configurations (all fluent API, stored in Configurations/)
- Generic `Repository<T>` implementation
- `AlertHub` (SignalR) + `AlertHubNotifier`
- `FirebaseNotificationService` (Firebase push + Telegram)
- `AlertEscalationWorker` (background hosted service)
- `AdminSeeder` — seeds default admin on first startup

**Web / API Layer**
- 5 controllers: Auth, Alert, Admin, DeviceTokens, MatricRecords
- `GlobalExceptionMiddleware` — consistent JSON error envelope
- Rate limiting with 3 named policies
- CORS configured for `http://localhost:3000` and `http://localhost:5173`
- Health checks: PostgreSQL, Firebase, Telegram at `/health` and `/health/detail`
- SignalR hub mounted at `/alertHub`


---

## 1.2 Entity Analysis

### BaseEntity (`CEARCS.Domain.Entities.Common`)
Abstract base class inherited by Student, Admin, EmergencyAlert.

| Property | Type | Required | Notes |
|---|---|---|---|
| `Id` | `Guid` | Yes | Auto-generated `Guid.NewGuid()` |
| `CreatedAt` | `DateTime` | Yes | UTC, auto-set |
| `UpdatedAt` | `DateTime` | Yes | UTC, auto-set; updated via EF SaveChanges hook |

---

### Student (`Students` table)
Represents a registered university student who can submit emergency alerts.

| Property | Type | Required | Max Length | DB Constraint | Notes |
|---|---|---|---|---|---|
| `Id` | `Guid` | Yes | — | PK, uuid | Inherits BaseEntity |
| `MatricNumber` | `string` | Yes | 20 | UNIQUE | Student ID number |
| `FullName` | `string` | Yes | 150 | — | — |
| `Email` | `string` | Yes | 200 | UNIQUE | — |
| `PhoneNumber` | `string` | Yes | 20 | — | — |
| `TelegramUsername` | `string?` | No | 100 | — | Optional Telegram handle |
| `TelegramChatId` | `long?` | No | — | bigint | Required for Telegram notifications |
| `PasswordHash` | `string` | Yes | — | — | BCrypt hashed |
| `IsActive` | `bool` | Yes | — | Default: true | Inactive students cannot log in or create alerts |
| `CreatedAt` | `DateTime` | Yes | — | timestamptz | Inherits BaseEntity |
| `UpdatedAt` | `DateTime` | Yes | — | timestamptz | Inherits BaseEntity |

**Relationships:**
- One Student → Many `EmergencyAlert` (as original reporter) — `Restrict` on delete
- One Student → Many `AlertReporter` (as co-reporter) — `Restrict` on delete
- One Student → Many `DeviceToken` — `Cascade` on delete

**Frontend Usage:**
- Registration screen (create)
- Student login screen (read/authenticate)
- Profile page (read, link Telegram)
- Alert detail page (read — reporter info)
- Admin user management (read, no direct edit endpoint exposed)

---

### Admin (`Admins` table)
Represents a system administrator, faculty member, or kiosk user.

| Property | Type | Required | Max Length | Notes |
|---|---|---|---|---|
| `Id` | `Guid` | Yes | — | PK, uuid |
| `Username` | `string` | Yes | 100 | UNIQUE |
| `PasswordHash` | `string` | Yes | — | BCrypt hashed |
| `Role` | `UserRole` | Yes | — | Stored as string in DB |
| `IsActive` | `bool` | Yes | — | Default: true |
| `CreatedAt` | `DateTime` | Yes | — | timestamptz |
| `UpdatedAt` | `DateTime` | Yes | — | timestamptz |

**Relationships:**
- One Admin → Many `BroadcastAction` — `Restrict` on delete

**Frontend Usage:**
- Admin login screen (read/authenticate)
- Dashboard (read — AdminId embedded in JWT)
- Broadcast action (Admin performs broadcast, AdminId from JWT)
- Audit log (read — actions attributed to AdminId)

---

### EmergencyAlert (`EmergencyAlerts` table)
Core entity representing a reported campus emergency.

| Property | Type | Required | DB Type | Notes |
|---|---|---|---|---|
| `Id` | `Guid` | Yes | uuid | PK |
| `StudentId` | `Guid` | Yes | uuid | FK → Student |
| `AlertType` | `AlertType` | Yes | string | Fire, Medical, Security |
| `Latitude` | `double` | Yes | double precision | GPS latitude |
| `Longitude` | `double` | Yes | double precision | GPS longitude |
| `AlertStatus` | `AlertStatus` | Yes | string | Default: Pending |
| `ConfidenceScore` | `double` | Yes | double precision | Default: 1.0, max 5.0 |
| `AdminResponseDeadline` | `DateTime` | Yes | timestamptz | Now + 60 seconds |
| `LastReportedAt` | `DateTime` | Yes | timestamptz | Updated on each cluster merge |
| `CreatedAt` | `DateTime` | Yes | timestamptz | — |
| `UpdatedAt` | `DateTime` | Yes | timestamptz | — |

**DB Indexes:** StudentId, AlertType, AlertStatus, CreatedAt, (Latitude, Longitude), (AlertStatus, AdminResponseDeadline)

**Relationships:**
- Many-to-One → Student (`Restrict` delete)
- One → Many `AlertReporter` (`Cascade` delete)
- One → Many `BroadcastAction` (`Cascade` delete)

**Frontend Usage:**
- Student: creates alerts, views own alert status
- Admin: views all alerts, acknowledges, resolves, closes
- Dashboard: statistics aggregated from this entity
- Map view: Latitude/Longitude used for map pin


---

### AlertReporter (`AlertReporters` table)
Junction entity tracking which students confirmed/co-reported a specific alert.

| Property | Type | Required | Notes |
|---|---|---|---|
| `Id` | `Guid` | Yes | PK |
| `EmergencyAlertId` | `Guid` | Yes | FK → EmergencyAlert |
| `StudentId` | `Guid` | Yes | FK → Student |
| `ReportedAt` | `DateTime` | Yes | timestamptz |

**DB Constraint:** UNIQUE (EmergencyAlertId, StudentId) — prevents double-reporting.

**Frontend Usage:**
- Alert detail page shows list of reporters with names and timestamps
- Dashboard `ReporterCount` drives confidence display

---

### BroadcastAction (`BroadcastActions` table)
Records each time an admin broadcasts an alert.

| Property | Type | Required | Notes |
|---|---|---|---|
| `Id` | `Guid` | Yes | PK |
| `EmergencyAlertId` | `Guid` | Yes | FK → EmergencyAlert |
| `AdminId` | `Guid` | Yes | FK → Admin |
| `AlertType` | `AlertType` | Yes | string — type at time of broadcast |
| `BroadcastedAt` | `DateTime` | Yes | timestamptz |

**Frontend Usage:**
- Alert detail page could show broadcast history (no dedicated endpoint yet — see Gap Analysis)
- Audit trail references this

---

### MatricRecord (`MatricRecords` table)
Pre-registered student academic records. Used as whitelist for student registration.

| Property | Type | Required | Max Length | Notes |
|---|---|---|---|---|
| `Id` | `Guid` | Yes | — | PK |
| `MatricNumber` | `string` | Yes | 20 | UNIQUE |
| `FullName` | `string` | Yes | 150 | — |
| `Faculty` | `string` | Yes | 150 | — |
| `Department` | `string` | Yes | 150 | — |
| `Level` | `string` | Yes | 10 | e.g. "100", "200" |
| `IsUsed` | `bool` | Yes | — | Default: false; true after student registers |

**Frontend Usage:**
- Admin: upload CSV (create), view all records, view by ID
- Registration: system validates MatricNumber against this table (backend logic, transparent to frontend)

---

### DeviceToken (`DeviceTokens` table)
Firebase FCM push notification tokens per student per device.

| Property | Type | Required | Max Length | Notes |
|---|---|---|---|---|
| `Id` | `Guid` | Yes | — | PK |
| `StudentId` | `Guid` | Yes | — | FK → Student (cascade delete) |
| `Token` | `string` | Yes | 512 | UNIQUE globally |
| `Platform` | `string` | Yes | 20 | "android", "ios", or "web" |
| `CreatedAt` | `DateTime` | Yes | — | timestamptz |

**Frontend Usage:**
- After student login: register device token via POST /api/device-tokens
- On logout: delete token via DELETE /api/device-tokens/{token}

---

### AuditLog (`AuditLogs` table)
Immutable event log for all significant system actions.

| Property | Type | Required | Max Length | Notes |
|---|---|---|---|---|
| `Id` | `Guid` | Yes | — | PK |
| `UserId` | `Guid?` | No | — | Nullable — "System" entries have no user |
| `UserType` | `string` | Yes | 50 | "Student", "Admin", "System" |
| `Action` | `string` | Yes | 100 | See AuditActions constants |
| `EntityType` | `string` | Yes | 100 | "Student", "EmergencyAlert", "MatricRecord" |
| `EntityId` | `Guid?` | No | — | Nullable |
| `Description` | `string?` | No | 1000 | Human-readable description |
| `CreatedAt` | `DateTime` | Yes | — | timestamptz |

**AuditActions constants:** UserRegistered, UserLogin, AlertCreated, AlertMerged, AlertAcknowledged, AlertBroadcasted, AlertAutoEscalated, AlertResolved, AlertClosed, MatricUpload

**Frontend Usage:**
- Admin audit log screen (read-only). No dedicated controller yet — see Gap Analysis.


---

## 1.3 Enumeration Analysis

### `UserRole` — `CEARCS.Domain.Enums.UserRole`

| Value | Integer | Business Meaning | SignalR Group |
|---|---|---|---|
| `Student` | 0 | Registered student — can submit alerts | `Students` |
| `Admin` | 1 | System administrator — manages all alerts and users | `Admins` |
| `Faculty` | 2 | Faculty member — receives Fire and Security alerts | `FacultyKiosks` |
| `Kiosk` | 3 | Generic kiosk terminal — same group as Faculty | `FacultyKiosks` |
| `FireKiosk` | 4 | Fire station kiosk — receives Fire alerts | `FireKiosk` |
| `ClinicKiosk` | 5 | Medical clinic kiosk — receives Medical alerts ONLY | `ClinicKiosk` |

**Important:** All non-Student roles authenticate via `POST /api/auth/admin/login`.
The `Admin` entity stores any of these roles — all are stored in the `Admins` table.

---

### `AlertType` — `CEARCS.Domain.Enums.AlertType`

| Value | Business Meaning | Broadcast Target | FCM + Telegram Sent |
|---|---|---|---|
| `Fire` | Campus fire emergency | FacultyKiosks + FireKiosk + Students | Yes |
| `Medical` | Medical emergency | ClinicKiosk ONLY | No (kiosk only, no campus-wide broadcast) |
| `Security` | Security / campus safety threat | FacultyKiosks + Students | Yes |

---

### `AlertStatus` — `CEARCS.Domain.Enums.AlertStatus`

| Value | Meaning | Who Sets It | Valid Transitions |
|---|---|---|---|
| `Pending` | Alert created, awaiting admin response | System (on create) | → Acknowledged (admin), → AutoEscalated (worker), → Broadcasted (broadcast) |
| `Acknowledged` | Admin has acknowledged, escalation stopped | Admin via POST /acknowledge | → Broadcasted, → Resolved |
| `Broadcasted` | Admin has broadcast to relevant groups | Admin via POST /broadcast | → Resolved |
| `AutoEscalated` | 60-second deadline passed, auto-broadcast fired | Background worker | → Resolved |
| `Resolved` | Incident resolved | Admin via POST /resolve | → Closed |
| `Closed` | Terminal state — archive | Admin via POST /close | Terminal — no further transitions |

**Business Note:** Closing requires the alert to be in `Resolved` state. Resolving cannot be done if already Resolved or Closed.


---

## 1.4 Authentication & Authorization Analysis

### Authentication Type
**JWT Bearer Tokens** — stateless, no cookies, no sessions.

### Token Configuration (from `appsettings.json` + `JwtSettings.cs`)

| Setting | Value |
|---|---|
| Issuer | `CEARCS` |
| Audience | `CEARCS.Clients` |
| Algorithm | HMAC-SHA256 (`HmacSha256`) |
| Expiry | 60 minutes (`ExpiryMinutes: 60`) |
| Clock Skew | `TimeSpan.Zero` — tokens expire exactly at `ExpiresAt`, no grace period |
| Refresh Tokens | **Not implemented** — no refresh endpoint exists |

### JWT Token Structure

**Student Token Claims** (from `AuthService.GenerateJwtToken`):

| Claim Key | Value | Source |
|---|---|---|
| `sub` | Student `Guid` as string | Student.Id |
| `email` | Student email address | Student.Email |
| `matricNumber` | Matric number string | Student.MatricNumber |
| `fullName` | Full name string | Student.FullName |
| `role` | `"Student"` (hardcoded string) | Hardcoded |
| `jti` | Random `Guid` | Guid.NewGuid() |

**Admin/Faculty/Kiosk Token Claims** (from `AdminAuthService.GenerateJwtToken`):

| Claim Key | Value | Source |
|---|---|---|
| `sub` | Admin `Guid` as string | Admin.Id |
| `username` | Admin username | Admin.Username |
| `role` | Role string e.g. `"Admin"`, `"Faculty"`, `"FireKiosk"` | Admin.Role.ToString() |
| `jti` | Random `Guid` | Guid.NewGuid() |

### Role Claim Configuration
The JWT validator is configured with `RoleClaimType = "role"` (plain lowercase). This means the `[Authorize(Roles = "Admin")]` attribute checks the `role` claim in the token directly — not the standard `ClaimTypes.Role`.

### Authorization Policies
No custom policies are defined. Authorization is purely **role-based** using `[Authorize(Roles = "...")]` attributes.

### Token Transport
- HTTP requests: `Authorization: Bearer <token>` header
- SignalR connection: query string parameter `?access_token=<token>` (configured in `JwtBearerEvents.OnMessageReceived`)

### Frontend Auth Flow

**Student Login:**
1. POST `/api/auth/login` with `{ matricNumber, password }`
2. Receive `{ token, fullName, matricNumber, expiresAt }`
3. Store token in memory / localStorage
4. Attach as `Authorization: Bearer <token>` on all subsequent requests
5. Connect to SignalR `/alertHub?access_token=<token>`

**Admin/Faculty/Kiosk Login:**
1. POST `/api/auth/admin/login` with `{ username, password }`
2. Receive `{ token, username, role, expiresAt }`
3. Derive UI experience from `role` claim
4. Same token attachment pattern

### Registration Flow (Student only)
1. POST `/api/auth/register` with full registration payload
2. Backend validates MatricNumber against `MatricRecords` table
3. Returns `201 Created` with `{ message: "Registration successful." }`
4. No token returned — redirect to login after registration

### No Refresh Token
There is no refresh token endpoint. The frontend must handle token expiry by redirecting to login when a `401 Unauthorized` is received on any API call.

---

## 1.5 API Endpoint Analysis

### Base URL
`https://<host>/api` (HTTPS redirect enforced)

### Rate Limiting

| Policy Name | Limit | Window | Applied To |
|---|---|---|---|
| `StudentLogin` | 5 requests | 1 minute per IP | POST /api/auth/login |
| `AdminLogin` | 5 requests | 1 minute per IP | POST /api/auth/admin/login |
| `AlertCreation` | 10 requests | 1 minute per IP | POST /api/alerts |

Rate limit rejections return `429 Too Many Requests` with:
```json
{ "success": false, "message": "Too many requests. Please try again later." }
```

### Error Envelope (Global Exception Middleware)
All errors return a consistent JSON envelope:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "traceId": "0HN...",
  "errors": ["validation error 1", "validation error 2"]
}
```
`errors` array is only present for validation failures.

---

### CONTROLLER: AuthController — `/api/auth`

#### EP-1: Register Student
| Field | Value |
|---|---|
| **Route** | `POST /api/auth/register` |
| **Auth Required** | No |
| **Roles Allowed** | Anonymous |
| **Rate Limit** | None |
| **Request DTO** | `RegisterStudentRequest` |
| **Response** | `201 Created` → `{ message: "Registration successful." }` |
| **Frontend Screens** | Registration Screen |

**Request DTO — `RegisterStudentRequest`:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `matricNumber` | string | Yes | NotEmpty, MaxLength(20) |
| `fullName` | string | Yes | NotEmpty, MaxLength(150) |
| `email` | string | Yes | NotEmpty, EmailAddress format |
| `phoneNumber` | string | Yes | NotEmpty, MaxLength(20) |
| `telegramUsername` | string? | No | Optional |
| `password` | string | Yes | NotEmpty, MinLength(8) |

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure — errors array populated |
| `409 Conflict` | MatricNumber not in system / already registered; or Email already registered |


#### EP-2: Student Login
| Field | Value |
|---|---|
| **Route** | `POST /api/auth/login` |
| **Auth Required** | No |
| **Roles Allowed** | Anonymous |
| **Rate Limit** | `StudentLogin` — 5/min per IP |
| **Request DTO** | `LoginRequest` |
| **Response** | `200 OK` → `LoginResponse` |
| **Frontend Screens** | Student Login Screen |

**Request DTO — `LoginRequest`:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `matricNumber` | string | Yes | NotEmpty |
| `password` | string | Yes | NotEmpty |

**Response DTO — `LoginResponse`:**
| Field | Type | Notes |
|---|---|---|
| `token` | string | JWT Bearer token |
| `fullName` | string | Student's full name |
| `matricNumber` | string | Student's matric number |
| `expiresAt` | DateTime (UTC) | Token expiry timestamp |

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Invalid matric number or password, or account inactive |

---

#### EP-3: Admin / Faculty / Kiosk Login
| Field | Value |
|---|---|
| **Route** | `POST /api/auth/admin/login` |
| **Auth Required** | No |
| **Roles Allowed** | Anonymous |
| **Rate Limit** | `AdminLogin` — 5/min per IP |
| **Request DTO** | `AdminLoginRequest` |
| **Response** | `200 OK` → `AdminLoginResponse` |
| **Frontend Screens** | Admin Login, Faculty Login, Kiosk Login (all share this endpoint) |

**Request DTO — `AdminLoginRequest`:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `username` | string | Yes | NotEmpty |
| `password` | string | Yes | NotEmpty |

**Response DTO — `AdminLoginResponse`:**
| Field | Type | Notes |
|---|---|---|
| `token` | string | JWT Bearer token |
| `username` | string | Admin's username |
| `role` | string | Role string: `"Admin"`, `"Faculty"`, `"Kiosk"`, `"FireKiosk"`, `"ClinicKiosk"` |
| `expiresAt` | DateTime (UTC) | Token expiry timestamp |

**Frontend Logic:** Use the `role` field to determine which UI to render after login.

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Invalid credentials or inactive account |

---

#### EP-4: Link Telegram
| Field | Value |
|---|---|
| **Route** | `POST /api/auth/link-telegram` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Student` only |
| **Rate Limit** | None |
| **Request DTO** | `LinkTelegramRequest` |
| **Response** | `204 No Content` |
| **Frontend Screens** | Student Profile Screen |

**Request DTO — `LinkTelegramRequest`:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `chatId` | long | Yes | Must be > 0 (validated in controller) |

**Business Rule:** The student must have already started a conversation with the Telegram bot to obtain their `chatId` before calling this endpoint.

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | chatId ≤ 0 |
| `401 Unauthorized` | Invalid/missing token |
| `404 Not Found` | Student not found (should not occur in practice) |


---

### CONTROLLER: AlertController — `/api/alerts`

All endpoints require authentication (`[Authorize]` on controller).

#### EP-5: Create Alert
| Field | Value |
|---|---|
| **Route** | `POST /api/alerts` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Student` only |
| **Rate Limit** | `AlertCreation` — 10/min per IP |
| **Request DTO** | `CreateAlertRequest` |
| **Response** | `201 Created` → `AlertResponse` + `Location` header pointing to `GET /api/alerts/{id}` |
| **Frontend Screens** | Emergency Reporting Screen (Fire / Medical / Security) |

**Request DTO — `CreateAlertRequest`:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `alertType` | AlertType (int/string) | Yes | Must be valid enum value (0=Fire, 1=Medical, 2=Security) |
| `latitude` | double | Yes | Between -90 and 90 |
| `longitude` | double | Yes | Between -180 and 180 |

**Response DTO — `AlertResponse`:**
| Field | Type | Notes |
|---|---|---|
| `id` | Guid | Alert ID |
| `studentId` | Guid | Reporting student ID |
| `studentFullName` | string | Reporter's name |
| `alertType` | AlertType | Fire / Medical / Security |
| `latitude` | double | GPS latitude |
| `longitude` | double | GPS longitude |
| `alertStatus` | AlertStatus | Current status |
| `confidenceScore` | double | 1.0 initial, +0.2 per co-reporter, max 5.0 |
| `reporterCount` | int | Total number of students who reported this alert |
| `adminResponseDeadline` | DateTime (UTC) | 60 seconds after creation |
| `lastReportedAt` | DateTime (UTC) | Updated on cluster merge |
| `createdAt` | DateTime (UTC) | Original creation time |

**Business Rules Enforced:**
- Student must be active (`IsActive = true`)
- Location must be within campus boundary (Haversine check against configured center + 500m radius)
- Clustering: if a matching alert (same type, within 50m, within last 5 minutes, Pending/Acknowledged) exists, the student is added as co-reporter and `ConfidenceScore` increases instead of creating a new alert

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure; student inactive; location outside campus |
| `401 Unauthorized` | Missing/invalid token |
| `429 Too Many Requests` | Rate limit exceeded |

---

#### EP-6: Get All Alerts
| Field | Value |
|---|---|
| **Route** | `GET /api/alerts` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Rate Limit** | None |
| **Request** | No body, no query parameters |
| **Response** | `200 OK` → `IReadOnlyList<AlertResponse>` (sorted newest first) |
| **Frontend Screens** | Admin Incident Management Screen |

---

#### EP-7: Get Alert By ID
| Field | Value |
|---|---|
| **Route** | `GET /api/alerts/{id:guid}` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Rate Limit** | None |
| **Response** | `200 OK` → `AlertDetailsResponse` |
| **Frontend Screens** | Admin Alert Detail Screen |

**Response DTO — `AlertDetailsResponse`:**
| Field | Type | Notes |
|---|---|---|
| `id` | Guid | Alert ID |
| `studentId` | Guid | Original reporter ID |
| `studentFullName` | string | Original reporter name |
| `alertType` | AlertType | Fire / Medical / Security |
| `latitude` | double | GPS latitude |
| `longitude` | double | GPS longitude |
| `alertStatus` | AlertStatus | Current status |
| `confidenceScore` | double | Cluster confidence |
| `adminResponseDeadline` | DateTime | Escalation deadline |
| `lastReportedAt` | DateTime | Last co-report time |
| `createdAt` | DateTime | Creation time |
| `reporters` | `AlertReporterDto[]` | Full list of all reporters |

**Nested DTO — `AlertReporterDto`:**
| Field | Type |
|---|---|
| `studentId` | Guid |
| `studentFullName` | string |
| `reportedAt` | DateTime |

**Error Responses:**
| Status | Condition |
|---|---|
| `404 Not Found` | Alert ID does not exist |


#### EP-8: Acknowledge Alert
| Field | Value |
|---|---|
| **Route** | `POST /api/alerts/{id:guid}/acknowledge` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Request** | No body — alert ID from route, admin ID from JWT `sub` claim |
| **Response** | `204 No Content` |
| **SignalR Event Fired** | `AlertAcknowledged` → Group: `Admins` |
| **Frontend Screens** | Admin Alert Detail Screen, Admin Dashboard (action button) |

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Alert is not in `Pending` status |
| `404 Not Found` | Alert not found |

---

#### EP-9: Resolve Alert
| Field | Value |
|---|---|
| **Route** | `POST /api/alerts/{id:guid}/resolve` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Request** | No body |
| **Response** | `204 No Content` |
| **SignalR Event Fired** | `AlertResolved` → Group: `Admins` |
| **Frontend Screens** | Admin Alert Detail Screen |

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Alert already resolved or closed |
| `404 Not Found` | Alert not found |

---

#### EP-10: Close Alert
| Field | Value |
|---|---|
| **Route** | `POST /api/alerts/{id:guid}/close` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Request** | No body |
| **Response** | `204 No Content` |
| **SignalR Event Fired** | `AlertClosed` → Group: `Admins` |
| **Frontend Screens** | Admin Alert Detail Screen |

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Alert is not in `Resolved` state |
| `404 Not Found` | Alert not found |

---

### CONTROLLER: AdminController — `/api/admin`

All endpoints require `[Authorize(Roles = "Admin")]`.

#### EP-11: Broadcast Alert
| Field | Value |
|---|---|
| **Route** | `POST /api/admin/broadcast` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Request DTO** | `BroadcastAlertRequest` |
| **Response** | `204 No Content` |
| **Frontend Screens** | Admin Broadcast Center |

**Request DTO — `BroadcastAlertRequest`:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `alertId` | Guid | Yes | NotEmpty |
| `alertType` | AlertType | Yes | Valid enum value |

**What happens on broadcast (from source):**
- `BroadcastAction` record is created in DB
- Alert status is updated to `Broadcasted`
- SignalR events are routed based on `alertType`:
  - `Fire` → `FireEmergency` to `FacultyKiosks`, `FireKiosk`, `Students`; FCM + Telegram sent
  - `Security` → `SecurityEmergency` to `FacultyKiosks`, `Students`; FCM + Telegram sent
  - `Medical` → `MedicalEmergency` to `ClinicKiosk` ONLY; no FCM/Telegram

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure; alert in wrong state for broadcast |
| `404 Not Found` | Alert or Admin not found |

---

#### EP-12: Get Dashboard
| Field | Value |
|---|---|
| **Route** | `GET /api/admin/dashboard` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Request** | No body |
| **Response** | `200 OK` → `DashboardResponse` |
| **Frontend Screens** | Admin Dashboard Screen |

**Response DTO — `DashboardResponse`:**
| Field | Type | Notes |
|---|---|---|
| `totalAlerts` | int | All-time total |
| `pendingAlerts` | int | Currently Pending |
| `acknowledgedAlerts` | int | Currently Acknowledged |
| `broadcastedAlerts` | int | Currently Broadcasted |
| `autoEscalatedAlerts` | int | Currently AutoEscalated |
| `resolvedAlerts` | int | Currently Resolved |
| `closedAlerts` | int | Currently Closed |
| `fireAlertsToday` | int | Fire alerts created today (UTC) |
| `medicalAlertsToday` | int | Medical alerts created today (UTC) |
| `securityAlertsToday` | int | Security alerts created today (UTC) |
| `activeAlerts` | int | Not Resolved and not Closed |
| `recentAlerts` | `AlertResponse[]` | Last 20 alerts, newest first |


---

### CONTROLLER: DeviceTokensController — `/api/device-tokens`

All endpoints require `[Authorize(Roles = "Student")]`.

#### EP-13: Register Device Token
| Field | Value |
|---|---|
| **Route** | `POST /api/device-tokens` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Student` only |
| **Request DTO** | `RegisterDeviceTokenRequest` |
| **Response** | `204 No Content` |
| **Frontend Screens** | Called silently after student login |

**Request DTO — `RegisterDeviceTokenRequest`:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `token` | string | Yes | NotEmpty, MaxLength(512) |
| `platform` | string | Yes | One of: `"android"`, `"ios"`, `"web"` (case-insensitive) |

**Business Rules:**
- If the token already exists for this student → silently succeed (idempotent)
- If the token exists for a different student → reassign to current student (device changed hands)

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure; student inactive |

---

#### EP-14: Remove Device Token
| Field | Value |
|---|---|
| **Route** | `DELETE /api/device-tokens/{token}` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Student` only |
| **Request** | Token string in URL path |
| **Response** | `204 No Content` |
| **Frontend Screens** | Called on student logout |

**Error Responses:**
| Status | Condition |
|---|---|
| `404 Not Found` | Token not found for this student |

---

### CONTROLLER: MatricRecordsController — `/api/matric-records`

All endpoints require `[Authorize(Roles = "Admin")]`.

#### EP-15: Upload Matric Records CSV
| Field | Value |
|---|---|
| **Route** | `POST /api/matric-records/upload` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Request** | `multipart/form-data` — field name: `file`, must be `.csv` |
| **Max File Size** | 10 MB (configured in FormOptions) |
| **Response** | `200 OK` → `MatricUploadResult` |
| **Frontend Screens** | Admin Matric Records Upload Screen |

**CSV Format (must have header row):**
```
MatricNumber,FullName,Faculty,Department,Level
CSC/2021/001,John Doe,Science,Computer Science,300
```

**Response DTO — `MatricUploadResult`:**
| Field | Type | Notes |
|---|---|---|
| `inserted` | int | New records added |
| `skipped` | int | Duplicates skipped (already exist in DB or in batch) |
| `invalid` | int | Rows that failed parsing |
| `errors` | `string[]` | Per-row error descriptions |

**Error Responses:**
| Status | Condition |
|---|---|
| `400 Bad Request` | No file attached; file is not `.csv` |

---

#### EP-16: Get All Matric Records
| Field | Value |
|---|---|
| **Route** | `GET /api/matric-records` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Response** | `200 OK` → `IReadOnlyList<MatricRecordResponse>` |
| **Frontend Screens** | Admin Matric Records List Screen |

**Response DTO — `MatricRecordResponse`:**
| Field | Type |
|---|---|
| `id` | Guid |
| `matricNumber` | string |
| `fullName` | string |
| `faculty` | string |
| `department` | string |
| `level` | string |
| `isUsed` | bool |

---

#### EP-17: Get Matric Record By ID
| Field | Value |
|---|---|
| **Route** | `GET /api/matric-records/{id:guid}` |
| **Auth Required** | Yes |
| **Roles Allowed** | `Admin` only |
| **Response** | `200 OK` → `MatricRecordResponse` |
| **Frontend Screens** | Admin Matric Record Detail Screen |

**Error Responses:**
| Status | Condition |
|---|---|
| `404 Not Found` | Record not found |

---

### SIGNALR HUB: AlertHub — `/alertHub`

#### EP-18: Connect to AlertHub
| Field | Value |
|---|---|
| **URL** | `wss://<host>/alertHub?access_token=<jwt>` |
| **Auth Required** | Yes — JWT via query string |
| **All Roles** | Student, Admin, Faculty, Kiosk, FireKiosk, ClinicKiosk |

On connection, users are automatically assigned to their SignalR group based on the `role` claim. If `role` is missing or unrecognized, the connection is aborted.

#### EP-19: Hub Method — AcknowledgeAlert (Client → Server)
| Field | Value |
|---|---|
| **Method** | `AcknowledgeAlert(Guid alertId)` |
| **Auth Required** | Yes — `Admin` role only |
| **Effect** | Broadcasts `AlertAcknowledged` event to `Admins` group |

**Note:** This is a client-invokable hub method. The REST endpoint (EP-8) is the authoritative acknowledge — this hub method is a supplementary real-time notification to other admin sessions.


---

### HEALTH CHECK ENDPOINTS (No Auth)

| Route | Response |
|---|---|
| `GET /health` | Simple health status string |
| `GET /health/detail` | JSON `{ status, checks: [{ name, status, description }] }` |

Checks: `postgresql` (db tag), `firebase` (notifications tag), `telegram` (notifications tag).

---

## 1.6 DTO Analysis — Complete Reference

### Request DTOs

| DTO | Fields | Used By |
|---|---|---|
| `RegisterStudentRequest` | matricNumber, fullName, email, phoneNumber, telegramUsername?, password | EP-1 |
| `LoginRequest` | matricNumber, password | EP-2 |
| `AdminLoginRequest` | username, password | EP-3 |
| `LinkTelegramRequest` | chatId (long) | EP-4 |
| `CreateAlertRequest` | alertType, latitude, longitude | EP-5 |
| `BroadcastAlertRequest` | alertId, alertType | EP-11 |
| `RegisterDeviceTokenRequest` | token, platform | EP-13 |

### Response DTOs

| DTO | Fields | Used By |
|---|---|---|
| `LoginResponse` | token, fullName, matricNumber, expiresAt | EP-2 |
| `AdminLoginResponse` | token, username, role, expiresAt | EP-3 |
| `AlertResponse` | id, studentId, studentFullName, alertType, latitude, longitude, alertStatus, confidenceScore, reporterCount, adminResponseDeadline, lastReportedAt, createdAt | EP-5, EP-6, EP-12 |
| `AlertDetailsResponse` | (all AlertResponse fields except reporterCount) + reporters[] | EP-7 |
| `AlertReporterDto` | studentId, studentFullName, reportedAt | Nested in AlertDetailsResponse |
| `DashboardResponse` | totalAlerts, pendingAlerts, acknowledgedAlerts, broadcastedAlerts, autoEscalatedAlerts, resolvedAlerts, closedAlerts, fireAlertsToday, medicalAlertsToday, securityAlertsToday, activeAlerts, recentAlerts[] | EP-12 |
| `MatricRecordResponse` | id, matricNumber, fullName, faculty, department, level, isUsed | EP-15, EP-16, EP-17 |
| `MatricUploadResult` | inserted, skipped, invalid, errors[] | EP-15 |

### Error Response DTO (Global)

| DTO | Fields |
|---|---|
| `ErrorResponse` | success (bool, always false), message (string), traceId (string), errors (string[]?, validation only) |

---

## 1.7 Business Rules Analysis

### Student Registration Rules
1. `MatricNumber` must exist in the `MatricRecords` table and `IsUsed = false`. If not found or already used → `409 Conflict`.
2. `Email` must be globally unique across all students → `409 Conflict` if duplicate.
3. `MatricNumber` must be globally unique across all students → `409 Conflict` if duplicate.
4. After successful registration, `MatricRecord.IsUsed` is set to `true` (consumed, cannot register again).
5. Password must be at least 8 characters; stored as BCrypt hash.
6. `TelegramUsername` is optional at registration; `TelegramChatId` is linked separately via EP-4.

### Student Login Rules
1. Student must exist with matching `MatricNumber`.
2. Password must match BCrypt hash.
3. Student `IsActive` must be `true` — inactive students cannot log in.
4. Token expires exactly 60 minutes from issue (no clock skew).

### Alert Creation Rules
1. Student must be authenticated and `IsActive = true`.
2. GPS coordinates must be within the campus boundary:
   - Center: `Latitude 7.3775, Longitude 3.9470` (from appsettings.json)
   - Radius: `500 meters`
   - Algorithm: Haversine formula
   - Violation → `400 Bad Request` with explicit "outside campus boundary" message.
3. **Clustering logic** (AlertClusteringService):
   - Looks for existing `Pending` or `Acknowledged` alerts of the same `AlertType` created within the last **5 minutes** and within **50 meters**.
   - If found AND student has already reported → silent deduplication (returns existing alert, no new reporter added).
   - If found AND student hasn't reported → student is added as `AlertReporter`, `ConfidenceScore += 0.2` (capped at 5.0), `LastReportedAt` updated.
   - If not found → new `EmergencyAlert` created with `ConfidenceScore = 1.0`, `AdminResponseDeadline = now + 60 seconds`.
4. The originating student is always added as the first `AlertReporter`.
5. Alert is created with status `Pending`.
6. On every create or cluster merge, `NotifyAdminsNewAlertAsync` fires → SignalR `NewEmergencyAlert` event to `Admins` group.

### Alert Escalation Rules (AlertEscalationWorker)
1. Background worker polls every **5 seconds**.
2. Finds all alerts where `AlertStatus = Pending` AND `AdminResponseDeadline ≤ now`.
3. For each overdue alert:
   - Status set to `AutoEscalated`
   - Broadcast routed by type (same routing as manual broadcast)
   - Firebase FCM + Telegram sent for Fire and Security types
   - Medical type: ClinicKiosk SignalR only
4. No audit log entry is written by the worker for auto-escalation (gap identified).

### Alert Lifecycle / Status Transition Rules
1. `Acknowledge` → Only `Pending` alerts can be acknowledged. Stops the escalation countdown in concept (deadline passed = already escalated; acknowledged before deadline = no escalation).
2. `Resolve` → Any status **except** already `Resolved` or `Closed`. Covers Pending, Acknowledged, Broadcasted, AutoEscalated.
3. `Close` → Only `Resolved` alerts. Terminal state — no further changes possible.
4. `Broadcast` → Calls `UpdateAlertStatusAsync` setting status to `Broadcasted`. No status pre-check enforced in broadcast service (gap — can broadcast a closed alert in theory).

### Broadcast Routing Rules
| AlertType | SignalR Groups | FCM + Telegram |
|---|---|---|
| `Fire` | FacultyKiosks, FireKiosk, Students | Yes |
| `Security` | FacultyKiosks, Students | Yes |
| `Medical` | ClinicKiosk | No |

### Device Token Rules
1. Token must be unique globally (enforced by DB unique index).
2. If token is already registered to the same student → idempotent success.
3. If token is already registered to a different student → reassign (device changed hands).
4. Platform must be `"android"`, `"ios"`, or `"web"` (case-insensitive).

### Matric Record Upload Rules
1. File must be `.csv` extension, max 10 MB.
2. Header row is skipped; data starts at row 2.
3. Each row must have at least 5 comma-separated columns.
4. `MatricNumber` and `FullName` are required per row.
5. Duplicate `MatricNumber` in DB → skipped (counted in `skipped`).
6. Duplicate `MatricNumber` within the same batch → skipped.
7. Invalid rows are counted in `invalid` with per-row error messages.

### Kiosk Behavior Rules
1. All kiosk types (Kiosk, FireKiosk, ClinicKiosk) authenticate via `POST /api/auth/admin/login`.
2. `Kiosk` and `Faculty` roles join the same SignalR group `FacultyKiosks`.
3. `FireKiosk` joins `FireKiosk` group — receives only `FireEmergency` events.
4. `ClinicKiosk` joins `ClinicKiosk` group — receives only `MedicalEmergency` events.
5. Kiosk roles have no REST endpoints of their own — they are purely SignalR consumers.
6. No kiosk-specific REST permissions exist — kiosks cannot call any API endpoint once connected (they only receive real-time events).


---

## 1.8 Notification System

### Firebase Cloud Messaging (FCM)
**Implementation:** `FirebaseNotificationService` in Infrastructure layer.

**Initialization:** Firebase SDK is initialized once at service construction using a credentials JSON file (`firebase-adminsdk.json`) and the configured `ProjectId`. If the credentials file is missing or starts with `"REPLACE"`, Firebase is disabled — push notifications silently skipped.

**Push Notification Trigger Conditions:**

| Trigger | AlertType | Recipient |
|---|---|---|
| Admin manually broadcasts | Fire | All active students (all device tokens) |
| Admin manually broadcasts | Security | All active students (all device tokens) |
| Auto-escalation worker fires | Fire | All active students (all device tokens) |
| Auto-escalation worker fires | Security | All active students (all device tokens) |
| Medical alert (any path) | Medical | **NOT sent** — ClinicKiosk only |

**Push Notification Payload Structure:**
```
Title: "🚨 EMERGENCY: {AlertType}"
Body:  "An emergency has been reported on campus. Please follow safety protocols immediately."
Android: Priority=High, sound="default"
iOS (APNS): badge=1, sound="default"
```

**FCM Batching:** Max 500 tokens per multicast call. Larger token lists are automatically batched.

**Token Collection:** All `DeviceToken` records for all `IsActive` students are fetched and sent to as one batch operation.

### Telegram Notifications
**Implementation:** Telegram.Bot SDK, sends via `TelegramChatId` stored on each `Student`.

**Trigger Conditions:** Same as FCM — Fire and Security broadcasts/escalations only.

**Delivery Method:** Individual `SendMessage` per student who has a linked `TelegramChatId`.

**Message Format:**
```
🚨 CAMPUS EMERGENCY ALERT 🚨
Type: {AlertType}
Location: {Latitude:F6}, {Longitude:F6}
Time: {CreatedAt:yyyy-MM-dd HH:mm:ss} UTC
Please follow all safety protocols immediately.
```

**Configuration Guard:** If `BotToken` is missing or starts with `"REPLACE"` → Telegram silently skipped.

**No Email or SMS:** There is no email or SMS integration in the backend. These channels do not exist.

---

## 1.9 Real-Time Communication (SignalR)

### Hub
| Setting | Value |
|---|---|
| **Class** | `AlertHub` (inherits `Hub`) |
| **Mount Point** | `/alertHub` |
| **Auth Required** | Yes — `[Authorize]` on hub class |
| **JWT Transport** | Query string `?access_token=<jwt>` |

### SignalR Groups

| Group Name | Members (by role) | Receives |
|---|---|---|
| `Admins` | Admin | NewEmergencyAlert, AlertAcknowledged, AlertResolved, AlertClosed |
| `Students` | Student | FireEmergency, SecurityEmergency |
| `FacultyKiosks` | Faculty, Kiosk | FireEmergency, SecurityEmergency |
| `FireKiosk` | FireKiosk | FireEmergency |
| `ClinicKiosk` | ClinicKiosk | MedicalEmergency |

Group assignment is automatic on connection in `OnConnectedAsync`. If role is unrecognized, connection is aborted.

### Server → Client Events (events the frontend must listen to)

#### `NewEmergencyAlert`
- **Sent to:** `Admins` group
- **Trigger:** Every time a new alert is created OR an existing alert gains a co-reporter (cluster merge)
- **Payload:** Full `AlertResponse` object
```json
{
  "id": "guid",
  "studentId": "guid",
  "studentFullName": "string",
  "alertType": "Fire|Medical|Security",
  "latitude": 7.3775,
  "longitude": 3.9470,
  "alertStatus": "Pending",
  "confidenceScore": 1.0,
  "reporterCount": 1,
  "adminResponseDeadline": "2026-06-24T10:01:00Z",
  "lastReportedAt": "2026-06-24T10:00:00Z",
  "createdAt": "2026-06-24T10:00:00Z"
}
```

#### `AlertAcknowledged`
- **Sent to:** `Admins` group
- **Trigger:** Admin calls `POST /api/alerts/{id}/acknowledge` OR admin calls hub method `AcknowledgeAlert`
- **Payload:**
```json
{ "alertId": "guid", "adminId": "guid", "acknowledgedAt": "datetime" }
```

#### `AlertResolved`
- **Sent to:** `Admins` group
- **Trigger:** Admin calls `POST /api/alerts/{id}/resolve`
- **Payload:**
```json
{ "alertId": "guid", "adminId": "guid", "resolvedAt": "datetime" }
```

#### `AlertClosed`
- **Sent to:** `Admins` group
- **Trigger:** Admin calls `POST /api/alerts/{id}/close`
- **Payload:**
```json
{ "alertId": "guid", "adminId": "guid", "closedAt": "datetime" }
```

#### `FireEmergency`
- **Sent to:** `FacultyKiosks`, `FireKiosk`, `Students`
- **Trigger:** Admin broadcasts a Fire alert OR auto-escalation fires for Fire alert
- **Payload:**
```json
{
  "alertId": "guid",
  "alertType": "Fire",
  "latitude": 7.3775,
  "longitude": 3.9470,
  "broadcastedAt": "datetime",
  "autoEscalated": true|false
}
```
*Note:* `autoEscalated` field is only present in auto-escalation path, not in manual broadcast path.

#### `SecurityEmergency`
- **Sent to:** `FacultyKiosks`, `Students`
- **Trigger:** Admin broadcasts a Security alert OR auto-escalation fires for Security alert
- **Payload:** Same structure as `FireEmergency` with `"alertType": "Security"`

#### `MedicalEmergency`
- **Sent to:** `ClinicKiosk` only
- **Trigger:** Admin broadcasts a Medical alert OR auto-escalation fires for Medical alert
- **Payload:** Same structure as `FireEmergency` with `"alertType": "Medical"`

### Client → Server Methods

#### `AcknowledgeAlert(alertId: Guid)`
- **Callable by:** `Admin` role only (`[Authorize(Roles = "Admin")]` on hub method)
- **Effect:** Broadcasts `AlertAcknowledged` event to all `Admins` group members
- **Note:** This does NOT persist status to DB — use REST EP-8 for the authoritative acknowledge.


---

## 1.10 Location Services

### GPS Coordinate Storage
Both `latitude` and `longitude` are stored as `double precision` on the `EmergencyAlert` entity. Coordinates are provided by the client in the `CreateAlertRequest`.

### Geo-fence (Campus Boundary)
**Implementation:** `CampusBoundaryService` using Haversine distance formula.

| Setting | Value (from appsettings.json) |
|---|---|
| Center Latitude | `7.3775` |
| Center Longitude | `3.9470` |
| Radius | `500 meters` |
| Algorithm | Haversine (Earth radius = 6,371,000 m) |

The frontend **must** obtain the device's GPS coordinates before calling `POST /api/alerts`. If the coordinates are outside the campus radius, the API returns `400 Bad Request`. The frontend should ideally validate this client-side first to give immediate feedback without a round-trip.

### Alert Clustering (Spatial)
**Implementation:** `AlertClusteringService` — also uses Haversine.

| Parameter | Value |
|---|---|
| Cluster radius | 50 meters |
| Time window | Last 5 minutes |
| Scope | Same `AlertType`, `Pending` or `Acknowledged` status only |

### Map Integration
No server-side mapping library is used. The backend stores raw `latitude`/`longitude` values. The frontend is responsible for all map rendering using the coordinate data from `AlertResponse` and `AlertDetailsResponse`.

**Recommended:** Leaflet + OpenStreetMap (see Phase 3).

**DB Index:** A compound index on `(Latitude, Longitude)` exists on `EmergencyAlerts` for efficient spatial queries.

---

## 1.11 Dashboard Analytics

All data served from `GET /api/admin/dashboard` (`DashboardResponse`).

### Counters Available

| Metric | Field | Visualization Suggestion |
|---|---|---|
| Total alerts all-time | `totalAlerts` | KPI card |
| Active alerts (not resolved/closed) | `activeAlerts` | KPI card with alert color |
| Pending | `pendingAlerts` | KPI card / status bar |
| Acknowledged | `acknowledgedAlerts` | KPI card |
| Broadcasted | `broadcastedAlerts` | KPI card |
| Auto-escalated | `autoEscalatedAlerts` | KPI card (warning color) |
| Resolved | `resolvedAlerts` | KPI card |
| Closed | `closedAlerts` | KPI card |
| Fire today | `fireAlertsToday` | Today's breakdown chart |
| Medical today | `medicalAlertsToday` | Today's breakdown chart |
| Security today | `securityAlertsToday` | Today's breakdown chart |
| Recent 20 alerts | `recentAlerts[]` | Live-feed table |

### Charts Required (derived from available data)
1. **Status Distribution Donut/Pie** — pending, acknowledged, broadcasted, autoEscalated, resolved, closed counts
2. **Today's Alert Types Bar Chart** — fire, medical, security counts for today
3. **Recent Alerts Feed Table** — scrollable list of last 20 with status badges, type icons, time, location
4. **Active Alerts Count Badge** — prominent red badge for activeAlerts (critical indicator)

### What's Not Available (Gap)
- Historical trend data (alerts per day/week) — no time-series endpoint exists
- Per-student alert frequency — no student analytics endpoint
- Response time metrics — AdminResponseDeadline exists but no aggregation endpoint

---

## 1.12 Kiosk System Analysis

### Kiosk Types
Defined by `UserRole` enum and SignalR group assignment:

| Kiosk Type | UserRole Value | SignalR Group | Receives |
|---|---|---|---|
| Generic Kiosk | `Kiosk` | `FacultyKiosks` | FireEmergency, SecurityEmergency |
| Fire Station Kiosk | `FireKiosk` | `FireKiosk` | FireEmergency only |
| Medical Clinic Kiosk | `ClinicKiosk` | `ClinicKiosk` | MedicalEmergency only |
| Faculty Terminal | `Faculty` | `FacultyKiosks` | FireEmergency, SecurityEmergency |

### Kiosk Authentication
All kiosk types use `POST /api/auth/admin/login` with a pre-configured username/password. The response `role` field determines which kiosk UI to render.

### Kiosk Permissions
Kiosks have **no REST API permissions** other than login. They cannot:
- Create alerts
- Acknowledge, resolve, or close alerts
- Access the dashboard
- Read matric records
- Register device tokens

Kiosks operate **purely as SignalR subscribers** — they connect to `/alertHub` and listen for emergency events.

### Kiosk Emergency Mode Behavior
On receiving an emergency event:
1. **FireKiosk** receives `FireEmergency` — should display full-screen fire alert with location data
2. **ClinicKiosk** receives `MedicalEmergency` — should display full-screen medical alert with location
3. **Kiosk/Faculty** receives `FireEmergency` or `SecurityEmergency` — displays appropriate full-screen alert

**No server-driven "kiosk mode changed" event exists** — the kiosk UI state is driven entirely by the incoming SignalR emergency events and local state management.

### Kiosk Workflow
```
1. Kiosk boots → shows idle/standby screen
2. SignalR connection established (JWT from login stored locally)
3. Emergency event received → transition to emergency mode UI
4. Display: AlertType, Location coordinates, BroadcastedAt timestamp
5. No dismiss/acknowledge action available from kiosk (read-only)
6. Kiosk returns to idle after a timeout (frontend-only behavior — no backend signal)
```


---

# PHASE 2 — FRONTEND SCREEN INVENTORY

All screens listed here are derived strictly from the backend capabilities documented above.

---

## 2.1 Student Screens

### S-01: Student Login
**Route:** `/login`
**Purpose:** Authenticate a student and obtain a JWT token.
**API Calls:** `POST /api/auth/login`
**Key UI Elements:**
- MatricNumber input field
- Password input field (with show/hide toggle)
- Login button
- Link to Registration screen
- Rate limit feedback (5 attempts/min — show cooldown)

**Post-login actions:**
- Store token + expiresAt + fullName + matricNumber
- Register device token via `POST /api/device-tokens` (silent background call)
- Connect SignalR to `/alertHub`
- Navigate to Student Dashboard

---

### S-02: Student Registration
**Route:** `/register`
**Purpose:** Create a new student account using a verified matric number.
**API Calls:** `POST /api/auth/register`
**Key UI Elements:**
- MatricNumber input (max 20 chars)
- Full Name input (max 150 chars)
- Email input (email format validation)
- Phone Number input (max 20 chars)
- Telegram Username input (optional, no @ required)
- Password input (min 8 chars)
- Confirm Password input (client-side match validation)
- Register button
- Link back to Login screen

**Post-registration:** Redirect to login with success message. No auto-login.

**Error Handling:**
- Show field-level validation errors from `errors[]` array
- `409 Conflict` → display "Matric number not found or already registered" or "Email already in use"

---

### S-03: Student Dashboard (Home)
**Route:** `/dashboard`
**Purpose:** Central hub for a logged-in student showing their status and the emergency reporting button.
**API Calls:** None on load (all alert creation is event-driven)
**SignalR:** Connected — listens for `FireEmergency`, `SecurityEmergency`

**Key UI Elements:**
- Welcome banner with student name
- Campus status indicator (no backend field — inferred from active alerts if available)
- Large emergency report buttons: Fire 🔥, Medical 🏥, Security 🔒
- Emergency alert banner (triggered by SignalR `FireEmergency` / `SecurityEmergency` events)
- Navigation to Profile

---

### S-04: Fire Alert Reporting
**Route:** `/report/fire` (or modal from dashboard)
**Purpose:** Submit a Fire emergency alert with GPS coordinates.
**API Calls:** `POST /api/alerts`
**Key UI Elements:**
- Prominent "REPORT FIRE" title with flame icon
- GPS coordinate display (auto-captured from browser Geolocation API)
- Location accuracy indicator
- Confirm/Submit button
- Campus map preview with current location pin (Leaflet)
- "Outside campus" error state if coordinates fail geo-fence

**Request payload:** `{ alertType: 0, latitude: <gps>, longitude: <gps> }`

**Post-submission:**
- Show `AlertResponse.confidenceScore` and `reporterCount` to confirm submission
- Display `adminResponseDeadline` as countdown timer (60 seconds)

---

### S-05: Medical Alert Reporting
**Route:** `/report/medical`
**Purpose:** Submit a Medical emergency alert.
**API Calls:** `POST /api/alerts`
**Key UI Elements:** Same as S-04 with Medical theming (red cross icon)
**Request payload:** `{ alertType: 1, latitude: <gps>, longitude: <gps> }`

---

### S-06: Security Alert Reporting
**Route:** `/report/security`
**Purpose:** Submit a Security emergency alert.
**API Calls:** `POST /api/alerts`
**Key UI Elements:** Same as S-04 with Security theming (shield icon)
**Request payload:** `{ alertType: 2, latitude: <gps>, longitude: <gps> }`

---

### S-07: Emergency Broadcast Receiver (Student)
**Route:** Overlay/modal on top of any student screen
**Purpose:** Display incoming Fire or Security emergency to student in real-time.
**API Calls:** None — purely SignalR driven
**Trigger Events:** `FireEmergency`, `SecurityEmergency` from SignalR

**Key UI Elements:**
- Full-screen alert overlay with high-contrast red/orange background
- Large animated emergency icon
- AlertType and timestamp
- Location coordinates (displayed as text; optionally shown on map)
- `autoEscalated` badge if applicable
- Safety protocol instruction text
- Dismiss button (client-side only — no API call)

---

### S-08: Student Profile
**Route:** `/profile`
**Purpose:** View profile information and link Telegram for notifications.
**API Calls:** `POST /api/auth/link-telegram`
**Key UI Elements:**
- Display: Full Name, Matric Number, Email, Phone Number
- Telegram status: "Not linked" / "Linked as @username"
- "Link Telegram" section: instructions to message the bot, ChatId input, Link button
- Logout button (calls `DELETE /api/device-tokens/{token}` then clears local state)

**Note:** No profile edit endpoint exists in the backend — all fields are read-only display.


---

## 2.2 Admin Screens

### A-01: Admin Login
**Route:** `/admin/login`
**Purpose:** Authenticate admin and derive role-based UI routing.
**API Calls:** `POST /api/auth/admin/login`
**Key UI Elements:**
- Username input
- Password input
- Login button
- Rate limit feedback (5 attempts/min)

**Post-login:** Read `role` from `AdminLoginResponse` and route:
- `Admin` → Admin Dashboard (A-02)
- `Faculty` → Faculty Portal (handled as Kiosk variant, see K-screens)
- `Kiosk` / `FireKiosk` / `ClinicKiosk` → respective Kiosk screens

---

### A-02: Admin Dashboard
**Route:** `/admin/dashboard`
**Purpose:** Command center overview of all campus emergency activity.
**API Calls:** `GET /api/admin/dashboard`
**SignalR:** Connected — listens for `NewEmergencyAlert`, `AlertAcknowledged`, `AlertResolved`, `AlertClosed`

**Key UI Elements:**
- KPI cards: Total, Active (highlighted), Pending, Acknowledged, Broadcasted, AutoEscalated, Resolved, Closed
- Today's breakdown: Fire / Medical / Security count cards with type icons
- Status distribution donut chart
- Today's alert type bar chart
- Recent 20 alerts live feed table (columns: Type icon, Reporter, Status badge, Location, Confidence, Time, Actions)
- Real-time update: `NewEmergencyAlert` → insert at top of feed, increment counters
- Real-time update: `AlertAcknowledged/Resolved/Closed` → update status in feed

---

### A-03: Incident Management (All Alerts)
**Route:** `/admin/incidents`
**Purpose:** Full paginated list of all emergency alerts with filtering.
**API Calls:** `GET /api/alerts`
**SignalR:** `NewEmergencyAlert`, `AlertAcknowledged`, `AlertResolved`, `AlertClosed`

**Key UI Elements:**
- Filterable/sortable table: ID, Type, Reporter, Status, Confidence, Location, Deadline, Created
- Filter by: AlertType (All/Fire/Medical/Security), AlertStatus, Date range
- Sort by: CreatedAt (default desc), ConfidenceScore, AlertStatus
- Row click → navigate to Alert Detail (A-04)
- Status badge color coding:
  - Pending → Yellow/Amber
  - Acknowledged → Blue
  - Broadcasted → Orange
  - AutoEscalated → Red (with warning icon)
  - Resolved → Green
  - Closed → Gray
- Real-time row updates via SignalR events

---

### A-04: Alert Detail
**Route:** `/admin/incidents/:id`
**Purpose:** Full details of a single alert with all action controls.
**API Calls:** `GET /api/alerts/:id`, `POST /api/alerts/:id/acknowledge`, `POST /api/alerts/:id/resolve`, `POST /api/alerts/:id/close`, `POST /api/admin/broadcast`

**Key UI Elements:**
- Alert type header with color/icon
- Status badge with transition history (from status field only — no history endpoint)
- Location map (Leaflet) with pin at alert coordinates
- Reporter card: original reporter name, matric number, time
- Co-reporters list: table of all `AlertReporterDto` entries
- Confidence score display (1.0–5.0 with visual bar)
- Admin Response Deadline countdown (if still Pending)
- **Action buttons** (shown based on current status):
  - `Pending` → [Acknowledge] [Broadcast]
  - `Acknowledged` → [Broadcast] [Resolve]
  - `Broadcasted` → [Resolve]
  - `AutoEscalated` → [Resolve]
  - `Resolved` → [Close]
  - `Closed` → No actions (read-only)
- Broadcast form (when Broadcast button clicked): AlertType selector (pre-filled), Confirm button

---

### A-05: Broadcast Center
**Route:** `/admin/broadcast`
**Purpose:** Dedicated screen to initiate emergency broadcasts.
**API Calls:** `POST /api/admin/broadcast`, `GET /api/alerts` (to select from active alerts)

**Key UI Elements:**
- Active alert selector (dropdown/list of non-resolved/closed alerts)
- AlertType selector (pre-filled from selected alert, but editable)
- Broadcast routing preview:
  - Fire → shows "FacultyKiosks + FireKiosk + Students + FCM/Telegram"
  - Security → shows "FacultyKiosks + Students + FCM/Telegram"
  - Medical → shows "ClinicKiosk only — no FCM/Telegram"
- Confirm broadcast button
- Recent broadcast history (from `recentAlerts` in dashboard — no dedicated broadcast history endpoint)

---

### A-06: Matric Records Management
**Route:** `/admin/matric-records`
**Purpose:** Upload and manage the student whitelist.
**API Calls:** `POST /api/matric-records/upload`, `GET /api/matric-records`

**Key UI Elements:**
- CSV upload zone (drag-and-drop or file picker, `.csv` only, max 10 MB)
- CSV format template/example display
- Upload progress indicator
- Upload result summary: Inserted / Skipped / Invalid counts
- Error list (per-row errors if any)
- Records table: MatricNumber, FullName, Faculty, Department, Level, IsUsed badge
- Filter by IsUsed (Available / Used / All)
- Click row → Matric Record Detail (A-07)

---

### A-07: Matric Record Detail
**Route:** `/admin/matric-records/:id`
**Purpose:** View a single matric record.
**API Calls:** `GET /api/matric-records/:id`

**Key UI Elements:**
- All fields displayed: MatricNumber, FullName, Faculty, Department, Level
- IsUsed status badge (green "Registered" / gray "Available")
- Back button

**Note:** No edit or delete endpoint exists — read-only screen.

---

### A-08: Audit Log Viewer
**Route:** `/admin/audit`
**Purpose:** View system-wide audit trail of all significant actions.
**API Calls:** None yet — **no audit log endpoint exists** (see Gap Analysis)
**Status:** Blocked — requires backend implementation

**Planned UI Elements (for when endpoint exists):**
- Table: Timestamp, UserType, Action, EntityType, EntityId, Description
- Filter by: Action type, UserType, Date range
- Chronological order (newest first)


---

## 2.3 Kiosk Screens

All kiosk screens authenticate via A-01 (shared admin login endpoint). After login, the `role` value routes to the correct kiosk UI. Kiosks are read-only SignalR subscribers.

### K-01: Kiosk Standby Screen (All Types)
**Route:** `/kiosk/standby`
**Purpose:** Idle state shown when no emergency is active.
**API Calls:** None
**SignalR:** Connected and listening

**Key UI Elements:**
- Kiosk type identifier (FireKiosk / ClinicKiosk / Kiosk)
- Campus name / location identifier
- Current time display (large, digital clock format)
- "ALL CLEAR" status indicator (green)
- System health indicator (SignalR connected status)
- No user interaction required

---

### K-02: FireKiosk Emergency Screen
**Route:** `/kiosk/emergency` (rendered over standby)
**Purpose:** Full-screen fire emergency alert display.
**Trigger:** SignalR `FireEmergency` event received by `FireKiosk` group
**API Calls:** None

**Key UI Elements:**
- Full-screen red/orange background with flashing animation
- Large "🔥 FIRE EMERGENCY" heading
- Alert location coordinates
- Time of broadcast / escalation
- `autoEscalated` indicator if applicable
- Evacuation protocol instruction text (static UI content)
- Audio alert capability (browser API — no backend involvement)
- Return to standby: after configurable timeout (frontend-only logic)

---

### K-03: ClinicKiosk Emergency Screen
**Route:** `/kiosk/emergency` (rendered over standby)
**Purpose:** Full-screen medical emergency alert display.
**Trigger:** SignalR `MedicalEmergency` event received by `ClinicKiosk` group

**Key UI Elements:**
- Full-screen red/white background with medical cross
- Large "🏥 MEDICAL EMERGENCY" heading
- Alert location coordinates
- Time of event
- Medical response protocol instructions (static content)
- Return to standby: after configurable timeout

---

### K-04: Faculty / Generic Kiosk Emergency Screen
**Route:** `/kiosk/emergency`
**Purpose:** Full-screen emergency alert for Faculty and generic Kiosk roles.
**Triggers:**
- `FireEmergency` → shows fire alert UI
- `SecurityEmergency` → shows security alert UI
**API Calls:** None

**Key UI Elements:**
- Dynamic UI based on event type (Fire vs Security)
- Fire: orange/red theme, evacuation instructions
- Security: dark/red theme, lockdown instructions
- Location and timestamp
- Return to standby after timeout

---

### Kiosk Workflow Summary
```
Boot
 └─ POST /api/auth/admin/login
     └─ role = "FireKiosk" / "ClinicKiosk" / "Kiosk" / "Faculty"
         └─ Connect SignalR /alertHub?access_token=<jwt>
             └─ Show K-01 (Standby)
                 └─ On SignalR event received:
                     └─ Show K-02 / K-03 / K-04 (Emergency mode)
                         └─ Timeout → return to K-01 (Standby)
```

---

# PHASE 3 — FRONTEND ARCHITECTURE

## 3.1 Recommended Stack

| Technology | Version (latest stable) | Justification |
|---|---|---|
| **React** | 18.x | Component model maps cleanly to distinct role-based UIs; massive ecosystem for emergency UI patterns |
| **TypeScript** | 5.x | Type safety critical for emergency systems; all backend DTOs can be strongly typed on frontend |
| **Vite** | 5.x | Fast HMR for development; PWA plugin available; smaller bundle than CRA |
| **Tailwind CSS** | 3.x | Utility-first enables rapid emergency UI styling; color utilities map directly to alert status colors |
| **React Router v6** | 6.x | Nested routes support role-based layouts; protected route wrappers; no extra setup complexity |
| **TanStack Query** | 5.x | Handles API caching, refetching, background sync; `invalidateQueries` on SignalR events keeps dashboard fresh |
| **Zustand** | 4.x | Lightweight global state for auth token, role, SignalR connection status, active emergencies; no boilerplate vs Redux |
| **@microsoft/signalr** | latest | Official Microsoft SignalR client; handles reconnection, hub methods, group events; required for `/alertHub` |
| **Leaflet + react-leaflet** | 4.x | OpenStreetMap rendering; free, no API key required; handles GPS pin display for alert locations |
| **Vite PWA Plugin** | latest | Required for mobile students; enables offline capability, install prompt, push notification permission |

## 3.2 Architecture Justifications

**Why TanStack Query over raw fetch/useEffect:**
The dashboard polls `GET /api/admin/dashboard` and the incidents list polls `GET /api/alerts`. TanStack Query's `staleTime`, `refetchOnWindowFocus`, and `invalidateQueries` triggered from SignalR events provides a coherent data sync strategy without manual loading/error state management.

**Why Zustand over Context API:**
Emergency state (active alert overlay, SignalR connection status) needs to be accessible from deeply nested components without prop drilling. Zustand's minimal API (a store with slices) avoids the performance pitfalls of Context re-renders in real-time UIs.

**Why Leaflet over Google Maps:**
No API key required. Campus coordinates are already known (7.3775, 3.9470). OpenStreetMap tiles are free and sufficient for a 500m campus radius. The backend stores raw lat/lng — Leaflet renders it directly.

**Why PWA:**
Students are primary mobile users submitting GPS alerts. PWA enables: geolocation access, push notification permission (required for FCM web tokens), home screen installation, and offline fallback page.

**Why React Router v6 (not TanStack Router):**
The role-based routing requirements (Student / Admin / Kiosk layouts) are well-served by nested routes + protected route wrappers. No file-based routing complexity needed at this scale.


---

# PHASE 4 — API INTEGRATION PLAN

## 4.1 Folder Structure

```
src/
├── api/                          # All API integration code
│   ├── client.ts                 # Axios instance with interceptors
│   ├── auth.api.ts               # EP-1, EP-2, EP-3, EP-4
│   ├── alerts.api.ts             # EP-5 through EP-10
│   ├── admin.api.ts              # EP-11, EP-12
│   ├── deviceTokens.api.ts       # EP-13, EP-14
│   └── matricRecords.api.ts      # EP-15, EP-16, EP-17
│
├── hooks/                        # TanStack Query hooks
│   ├── useLogin.ts
│   ├── useRegister.ts
│   ├── useAlerts.ts
│   ├── useAlertDetail.ts
│   ├── useDashboard.ts
│   ├── useBroadcast.ts
│   └── useMatricRecords.ts
│
├── realtime/                     # SignalR
│   ├── hubConnection.ts          # Connection factory + singleton
│   ├── useAlertHub.ts            # React hook wrapping hub events
│   └── hubEvents.ts              # Event name constants
│
├── store/                        # Zustand stores
│   ├── authStore.ts              # token, role, user info, expiry
│   ├── alertStore.ts             # active emergency overlay state
│   └── connectionStore.ts        # SignalR connection status
│
├── types/                        # TypeScript types mirroring backend DTOs
│   ├── auth.types.ts
│   ├── alert.types.ts
│   ├── admin.types.ts
│   ├── matricRecord.types.ts
│   └── enums.ts                  # AlertType, AlertStatus, UserRole
│
├── router/                       # Route definitions
│   ├── index.tsx                 # Root router
│   ├── ProtectedRoute.tsx        # Auth guard
│   ├── RoleRoute.tsx             # Role-based guard
│   └── routes.ts                 # Route path constants
│
├── layouts/                      # Role-based layout shells
│   ├── StudentLayout.tsx
│   ├── AdminLayout.tsx
│   └── KioskLayout.tsx
│
├── pages/                        # One folder per screen
│   ├── auth/
│   │   ├── StudentLoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── AdminLoginPage.tsx
│   ├── student/
│   │   ├── DashboardPage.tsx
│   │   ├── ReportFirePage.tsx
│   │   ├── ReportMedicalPage.tsx
│   │   ├── ReportSecurityPage.tsx
│   │   └── ProfilePage.tsx
│   ├── admin/
│   │   ├── DashboardPage.tsx
│   │   ├── IncidentsPage.tsx
│   │   ├── IncidentDetailPage.tsx
│   │   ├── BroadcastPage.tsx
│   │   ├── MatricRecordsPage.tsx
│   │   ├── MatricRecordDetailPage.tsx
│   │   └── AuditLogPage.tsx      # Blocked until backend endpoint added
│   └── kiosk/
│       ├── StandbyPage.tsx
│       └── EmergencyPage.tsx
│
├── components/                   # Reusable UI components
│   ├── alerts/
│   │   ├── AlertStatusBadge.tsx
│   │   ├── AlertTypeIcon.tsx
│   │   ├── ConfidenceBar.tsx
│   │   ├── CountdownTimer.tsx
│   │   └── EmergencyOverlay.tsx
│   ├── map/
│   │   └── AlertMap.tsx
│   ├── dashboard/
│   │   ├── KpiCard.tsx
│   │   ├── StatusDonutChart.tsx
│   │   └── RecentAlertsFeed.tsx
│   └── common/
│       ├── ErrorMessage.tsx
│       └── LoadingSpinner.tsx
│
└── utils/
    ├── geolocation.ts            # Browser GPS wrapper
    ├── campusBoundary.ts         # Client-side Haversine geo-fence check
    ├── tokenUtils.ts             # JWT decode, expiry check
    └── dateUtils.ts              # UTC formatting helpers
```

---

## 4.2 Route Structure

```
/                           → redirect based on auth state
/login                      → S-01 Student Login
/register                   → S-02 Student Registration
/admin/login                → A-01 Admin/Kiosk Login

/* Protected: role=Student */
/dashboard                  → S-03 Student Dashboard
/report/fire                → S-04 Fire Reporting
/report/medical             → S-05 Medical Reporting
/report/security            → S-06 Security Reporting
/profile                    → S-08 Student Profile

/* Protected: role=Admin */
/admin/dashboard            → A-02 Admin Dashboard
/admin/incidents            → A-03 Incident Management
/admin/incidents/:id        → A-04 Alert Detail
/admin/broadcast            → A-05 Broadcast Center
/admin/matric-records       → A-06 Matric Records
/admin/matric-records/:id   → A-07 Matric Record Detail
/admin/audit                → A-08 Audit Log (blocked)

/* Protected: role=Kiosk|FireKiosk|ClinicKiosk|Faculty */
/kiosk/standby              → K-01 Standby
/kiosk/emergency            → K-02/03/04 Emergency (conditional render by type)
```

---

## 4.3 State Management Design

### `authStore` (Zustand)
```typescript
interface AuthState {
  token: string | null
  role: string | null          // "Student" | "Admin" | "Faculty" | "Kiosk" | "FireKiosk" | "ClinicKiosk"
  userId: string | null        // from JWT sub claim
  fullName: string | null      // Student only
  username: string | null      // Admin only
  matricNumber: string | null  // Student only
  expiresAt: Date | null
  deviceToken: string | null   // FCM token for logout cleanup
  isAuthenticated: boolean
  login: (response: LoginResponse | AdminLoginResponse) => void
  logout: () => void
}
```

### `alertStore` (Zustand)
```typescript
interface AlertState {
  activeEmergency: EmergencyEvent | null   // Current overlay event (FireEmergency etc.)
  setEmergency: (event: EmergencyEvent) => void
  clearEmergency: () => void
}
```

### `connectionStore` (Zustand)
```typescript
interface ConnectionState {
  isConnected: boolean
  connectionError: string | null
  setConnected: (status: boolean) => void
  setError: (error: string | null) => void
}
```

---

## 4.4 API Client Design

```typescript
// src/api/client.ts
// Axios instance with:
// - baseURL from environment variable
// - Authorization header injected from authStore token
// - 401 interceptor → clear auth store → redirect to login
// - Response envelope unwrapping (ErrorResponse shape)
```

**Key behaviors:**
- All requests attach `Authorization: Bearer <token>` automatically
- On `401` response → call `authStore.logout()` + redirect to `/login`
- On `429` → surface "Too many requests" toast without logging out
- On `400` with `errors[]` → map to field-level form errors

---

## 4.5 Authentication Flow

```
Student:
  POST /api/auth/login
  → store token (authStore)
  → decode JWT: sub, role, matricNumber, fullName, expiresAt
  → POST /api/device-tokens (FCM token, platform)
  → connect SignalR /alertHub?access_token=<token>
  → navigate /dashboard

Admin/Kiosk:
  POST /api/auth/admin/login
  → store token (authStore)
  → decode JWT: sub, role, username
  → connect SignalR /alertHub?access_token=<token>
  → route by role:
    Admin → /admin/dashboard
    Faculty|Kiosk → /kiosk/standby
    FireKiosk → /kiosk/standby
    ClinicKiosk → /kiosk/standby

Logout:
  DELETE /api/device-tokens/{deviceToken}  (Student only)
  → disconnect SignalR
  → authStore.logout()
  → navigate /login
```

---

## 4.6 Protected Route Strategy

```typescript
// ProtectedRoute: checks authStore.isAuthenticated
// If not authenticated → redirect to /login

// RoleRoute: checks authStore.role against allowed roles[]
// If wrong role → redirect to role-appropriate home
// Roles: "Student" → /dashboard | "Admin" → /admin/dashboard | Kiosk roles → /kiosk/standby
```

**Token expiry check:** On each protected route render, compare `expiresAt` with `Date.now()`. If expired → `authStore.logout()` → redirect to login.

---

## 4.7 Error Handling Strategy

| Error Type | Behavior |
|---|---|
| `400 Bad Request` with `errors[]` | Map array to form field errors (React Hook Form + FluentValidation messages) |
| `400 Bad Request` with `message` only | Show toast/alert with `message` |
| `401 Unauthorized` | Interceptor clears auth + redirects to login |
| `404 Not Found` | Show "not found" inline message or redirect |
| `409 Conflict` | Show conflict message on registration form |
| `429 Too Many Requests` | Show countdown toast ("Try again in X seconds") |
| `500 Server Error` | Show generic error with `traceId` for support |
| Network error | Show "Cannot reach server" banner |
| SignalR disconnect | Show reconnecting indicator; auto-reconnect via hub configuration |

---

## 4.8 Notification Strategy (FCM Web Push)

```
1. On student login:
   → request Notification permission (browser API)
   → if granted: get FCM web token (Firebase JS SDK)
   → POST /api/device-tokens { token: fcmToken, platform: "web" }

2. On incoming push notification (service worker):
   → display browser notification with title + body from FCM payload

3. On logout:
   → DELETE /api/device-tokens/{fcmToken}
   → FCM token removed from server
```

---

## 4.9 Real-Time Strategy (SignalR)

```typescript
// src/realtime/hubConnection.ts
// HubConnectionBuilder with:
//   .withUrl("/alertHub", { accessTokenFactory: () => authStore.token })
//   .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
//   .build()

// Connection lifecycle:
//   connect() → called after login
//   disconnect() → called on logout
//   on reconnecting → set connectionStore.setConnected(false)
//   on reconnected → set connectionStore.setConnected(true) + invalidate queries
//   on close → set connectionStore error
```

**Event Handlers per role:**

| Role | Events Handled | Action |
|---|---|---|
| Student | `FireEmergency`, `SecurityEmergency` | Show EmergencyOverlay, play audio |
| Admin | `NewEmergencyAlert` | Add to feed, increment KPIs, show toast |
| Admin | `AlertAcknowledged`, `AlertResolved`, `AlertClosed` | Update status in list + detail queries |
| Kiosk/Faculty | `FireEmergency`, `SecurityEmergency` | Navigate to /kiosk/emergency |
| FireKiosk | `FireEmergency` | Navigate to /kiosk/emergency (fire mode) |
| ClinicKiosk | `MedicalEmergency` | Navigate to /kiosk/emergency (medical mode) |


---

# PHASE 5 — GAP ANALYSIS

## 5.1 Backend Features Fully Implemented

| Feature | Evidence |
|---|---|
| Student registration with matric whitelist validation | `AuthService.RegisterStudentAsync` |
| Student JWT login | `AuthService.LoginAsync` |
| Admin/Faculty/Kiosk JWT login | `AdminAuthService.LoginAsync` |
| Telegram ChatId linking | `AuthService.LinkTelegramAsync` |
| Create emergency alert with geo-fence validation | `AlertService.CreateAlertAsync` |
| Alert clustering (spatial + temporal deduplication) | `AlertClusteringService.TryClusterAsync` |
| Get all alerts (admin) | `AlertService.GetAllAlertsAsync` |
| Get alert by ID with full reporter list | `AlertService.GetAlertByIdAsync` |
| Acknowledge alert (Pending → Acknowledged) | `AlertService.AcknowledgeAlertAsync` |
| Resolve alert | `AlertService.ResolveAlertAsync` |
| Close alert (Resolved → Closed, terminal) | `AlertService.CloseAlertAsync` |
| Admin dashboard with all KPI counters + recent 20 | `AdminDashboardService.GetDashboardAsync` |
| Admin manual broadcast with routing rules | `AdminBroadcastService.BroadcastAsync` |
| Auto-escalation worker (60s deadline, poll 5s) | `AlertEscalationWorker` |
| Firebase FCM push notifications (batched) | `FirebaseNotificationService.SendPushNotificationAsync` |
| Telegram per-student notifications via ChatId | `FirebaseNotificationService.SendTelegramByChatIdAsync` |
| SignalR real-time hub with role-based groups | `AlertHub` + `AlertHubNotifier` |
| Device token registration / removal | `DeviceTokenService` |
| Matric record CSV upload with dedup + error reporting | `MatricRecordService.UploadFromCsvAsync` |
| Matric record list and detail | `MatricRecordService.GetAllAsync`, `GetByIdAsync` |
| Audit logging for all key actions | `AuditService` + `AuditActions` constants |
| Rate limiting (3 policies) | `RateLimitingExtensions` |
| Global exception middleware with consistent error envelope | `GlobalExceptionMiddleware` |
| Health checks (PostgreSQL, Firebase, Telegram) | `FirebaseHealthCheck`, `TelegramHealthCheck` |
| Admin seeding on startup | `AdminSeeder` |

---

## 5.2 Backend Features Partially Implemented

| Feature | What Exists | What's Missing | Impact |
|---|---|---|---|
| **Audit Logging** | Data is written to `AuditLogs` table correctly for all actions | No controller or endpoint to read audit logs | Admin Audit Log screen (A-08) is completely blocked |
| **Telegram notifications** | `SendTelegramByChatIdAsync` works correctly | `SendTelegramMessageAsync(username)` is a no-op stub (logs warning, sends nothing) — username-based delivery is intentionally disabled | No gap for frontend, but Telegram only works if `TelegramChatId` is linked |
| **Broadcast state validation** | Alert status is set to `Broadcasted` | No pre-broadcast status check — can technically broadcast a `Resolved` or `Closed` alert | Admin UI should disable broadcast button for terminal-state alerts |
| **Auto-escalation audit** | Worker escalates correctly | No `AuditActions.AlertAutoEscalated` log is written by the worker | Audit trail will have gaps for auto-escalated events |
| **Dashboard historical data** | Today's counts (fireAlertsToday etc.) available | No daily/weekly time-series data | Charts limited to current-state snapshots; no trend charts possible |

---

## 5.3 Missing Backend Features

| Missing Feature | Required For | Risk Level |
|---|---|---|
| **GET /api/admin/audit** — Read audit logs endpoint | Admin Audit Log screen (A-08) | High — entire screen blocked |
| **GET /api/admin/students** — List all registered students | Admin could not view or manage student accounts | Medium — no user management possible |
| **DELETE /api/admin/students/:id / PATCH IsActive** — Deactivate student | Admin cannot suspend abusive students | Medium |
| **GET /api/admin/students/:id** — Student profile for admin | Alert detail shows name but admin cannot drill into student | Low |
| **Refresh token endpoint** | Students lose session after 60 minutes | High — UX friction; emergency situation during token expiry is dangerous |
| **POST /api/admin/accounts** — Create new admin/faculty/kiosk accounts | Admin cannot create additional admin users via API | High — currently only seeded admin exists |
| **DELETE /api/admin/accounts/:id** — Remove admin | No account management | Medium |
| **GET /api/alerts?studentId=** — Filter alerts by student | Student viewing own alert history | Medium |
| **Historical analytics endpoint** — Alerts per day/week | Dashboard trend charts | Low for MVP |
| **GET /api/admin/broadcast-history** — Broadcast log | Broadcast audit trail per alert | Low |
| **Student profile update endpoint** — PATCH /api/students/me | Student cannot update email/phone | Low |

---

## 5.4 Risks

| Risk | Severity | Description |
|---|---|---|
| **No refresh token** | Critical | JWT expires after 60 min with no renewal path. A student reporting an emergency after token expiry will receive `401` on the alert creation call. Resolution: add refresh token endpoint, or extend expiry to 24h for students. |
| **No student alert history endpoint** | High | Students cannot view their own submitted alerts. The only way to see alert data is via admin endpoints — students have no self-service history. |
| **Broadcast can be called on any alert status** | Medium | No guard prevents broadcasting a `Closed` alert via `POST /api/admin/broadcast`. Frontend must compensate by disabling the broadcast action. |
| **Geo-fence is hardcoded** | Medium | Campus center coordinates (7.3775, 3.9470) are in `appsettings.json`. If deployed to a different campus, they must be reconfigured — no admin UI exists for this. |
| **No admin account management API** | High | The only way to create additional admin/kiosk/faculty accounts is via direct DB access or the seeder. Frontend cannot expose account creation. |
| **SignalR `AcknowledgeAlert` hub method does not persist to DB** | Medium | Calling the hub method only broadcasts to other admin sessions — it does not call `AlertService.AcknowledgeAlertAsync`. Frontend must always call the REST endpoint for persistence. |
| **Medical alert: no student notification** | Low-Medium | Medical alerts are intentionally sent only to ClinicKiosk. Students are not notified of medical emergencies. This is a design decision but worth surfacing for client confirmation. |
| **Auto-escalation does not write audit log** | Low | Auto-escalated events will not appear in the audit trail. |

---

## 5.5 Technical Debt

| Item | Location | Description |
|---|---|---|
| `INotificationService.SendTelegramMessageAsync(username)` | `FirebaseNotificationService` | The username-based overload is a stub that does nothing and logs a warning. Should either be implemented or removed from the interface. |
| N+1 query pattern in Dashboard | `AdminDashboardService.GetDashboardAsync` | Fetches all alerts then loops, calling `GetAsync(studentId)` and `GetAllBySpecAsync(reporterId)` per alert. For 20 recent alerts = 40+ DB calls. Needs a join/projection query. |
| N+1 query pattern in GetAllAlerts | `AlertService.GetAllAlertsAsync` | Same pattern — one `GetAsync` + one `GetAllBySpecAsync` per alert in the full list. Will degrade at scale. |
| No pagination on `GET /api/alerts` | `AlertController.GetAllAlerts` | Returns all alerts with no page/limit parameters. Will degrade with large datasets. |
| No pagination on `GET /api/matric-records` | `MatricRecordsController.GetAll` | Same issue. |
| `AlertClusteringService` is not injected as interface | `AlertService` constructor | `AlertClusteringService` is concrete class, not an interface — cannot be mocked in tests or swapped. |

---

## 5.6 Frontend Blockers

| Screen | Blocker | Resolution Required |
|---|---|---|
| A-08 Audit Log Viewer | No `GET /api/admin/audit` endpoint | Backend must add audit log read endpoint |
| Student Alert History | No `GET /api/alerts?studentId` or student-scoped endpoint | Backend must add student-scoped alert history |
| Admin User Management | No student/admin CRUD endpoints | Backend must add user management endpoints |
| Admin Account Creation | No `POST /api/admin/accounts` | Backend must add admin account management |
| Dashboard Trend Charts | No time-series data endpoint | Backend must add analytics endpoint or frontend uses stored state |
| 60-min session handling | No refresh token | Either backend adds refresh, or frontend prompts re-login gracefully with emergency UX safeguard |


---

# IMPLEMENTATION ROADMAP

## Sprint 1 — Foundation (Week 1–2)
**Goal:** Working auth flows, routing skeleton, SignalR connected.

| Task | Type | Screens |
|---|---|---|
| Setup Vite + React + TypeScript + Tailwind | Setup | — |
| Configure Axios client with interceptors | Setup | — |
| Define all TypeScript types (DTOs + enums) | Setup | — |
| Implement Zustand auth store | Setup | — |
| Implement protected route + role route guards | Setup | — |
| Student Login screen | Frontend | S-01 |
| Student Registration screen | Frontend | S-02 |
| Admin / Kiosk Login screen | Frontend | A-01 |
| JWT decode + role-based post-login routing | Frontend | All |
| SignalR hub connection factory + auto-reconnect | Frontend | — |

---

## Sprint 2 — Student Core (Week 3–4)
**Goal:** Students can submit all three alert types from a mobile browser.

| Task | Type | Screens |
|---|---|---|
| Browser Geolocation wrapper (GPS capture) | Frontend | — |
| Client-side campus geo-fence check (Haversine) | Frontend | — |
| Student Dashboard with emergency buttons | Frontend | S-03 |
| Fire Alert Reporting with map preview | Frontend | S-04 |
| Medical Alert Reporting | Frontend | S-05 |
| Security Alert Reporting | Frontend | S-06 |
| Emergency broadcast overlay (SignalR driven) | Frontend | S-07 |
| FCM web push token registration | Frontend | — |
| Student Profile + Telegram linking | Frontend | S-08 |
| PWA manifest + service worker | Frontend | — |

---

## Sprint 3 — Admin Core (Week 5–6)
**Goal:** Admin can monitor, acknowledge, broadcast, and resolve incidents.

| Task | Type | Screens |
|---|---|---|
| Admin Dashboard with KPI cards | Frontend | A-02 |
| Status donut chart + today's type bar chart | Frontend | A-02 |
| Recent alerts live feed with SignalR updates | Frontend | A-02 |
| Incident Management list with filters | Frontend | A-03 |
| Alert Detail with action buttons + state machine | Frontend | A-04 |
| Leaflet map in Alert Detail | Frontend | A-04 |
| Reporter list table in Alert Detail | Frontend | A-04 |
| Countdown timer for AdminResponseDeadline | Frontend | A-04 |
| Broadcast Center screen | Frontend | A-05 |
| Broadcast routing preview UI | Frontend | A-05 |

---

## Sprint 4 — Admin Management + Kiosk (Week 7–8)
**Goal:** Matric record management live; all kiosk types functional.

| Task | Type | Screens |
|---|---|---|
| Matric Records upload (CSV drag-and-drop) | Frontend | A-06 |
| Upload result summary display | Frontend | A-06 |
| Matric Records list + IsUsed filter | Frontend | A-06 |
| Matric Record detail | Frontend | A-07 |
| Kiosk standby screen (all types) | Frontend | K-01 |
| FireKiosk emergency screen | Frontend | K-02 |
| ClinicKiosk emergency screen | Frontend | K-03 |
| Faculty / Generic Kiosk emergency screen | Frontend | K-04 |
| Kiosk audio alert (browser Web Audio API) | Frontend | K-02/03/04 |

---

## Sprint 5 — Hardening + Backend Gap Resolution (Week 9–10)
**Goal:** Resolve blockers; harden the full application.

| Task | Type | Dependency |
|---|---|---|
| Backend: Add `GET /api/admin/audit` endpoint | **Backend** | A-08 unblocked |
| Backend: Add refresh token endpoint | **Backend** | Session continuity |
| Backend: Add admin account management endpoints | **Backend** | Admin account creation |
| Backend: Add student alert history endpoint | **Backend** | Student history screen |
| Audit Log viewer screen (after backend endpoint) | Frontend | A-08 |
| Token expiry detection + graceful re-login prompt | Frontend | All |
| 429 rate limit toast with countdown | Frontend | All |
| Full error boundary implementation | Frontend | All |
| PWA offline fallback page | Frontend | All |
| Fix N+1 queries in dashboard + alert service | **Backend** | Performance |
| Add pagination to GET /api/alerts | **Backend** | Scale |
| E2E smoke tests for critical auth + alert flows | Testing | — |

---

## Type Reference Sheet (for frontend TypeScript)

```typescript
// enums.ts
export enum AlertType { Fire = 0, Medical = 1, Security = 2 }
export enum AlertStatus {
  Pending = "Pending", Acknowledged = "Acknowledged", Broadcasted = "Broadcasted",
  AutoEscalated = "AutoEscalated", Resolved = "Resolved", Closed = "Closed"
}
export enum UserRole {
  Student = "Student", Admin = "Admin", Faculty = "Faculty",
  Kiosk = "Kiosk", FireKiosk = "FireKiosk", ClinicKiosk = "ClinicKiosk"
}

// alert.types.ts
export interface AlertResponse {
  id: string; studentId: string; studentFullName: string;
  alertType: AlertType; latitude: number; longitude: number;
  alertStatus: AlertStatus; confidenceScore: number; reporterCount: number;
  adminResponseDeadline: string; lastReportedAt: string; createdAt: string;
}
export interface AlertReporterDto { studentId: string; studentFullName: string; reportedAt: string; }
export interface AlertDetailsResponse extends Omit<AlertResponse, 'reporterCount'> {
  reporters: AlertReporterDto[];
}
export interface CreateAlertRequest { alertType: AlertType; latitude: number; longitude: number; }

// admin.types.ts
export interface DashboardResponse {
  totalAlerts: number; pendingAlerts: number; acknowledgedAlerts: number;
  broadcastedAlerts: number; autoEscalatedAlerts: number; resolvedAlerts: number;
  closedAlerts: number; fireAlertsToday: number; medicalAlertsToday: number;
  securityAlertsToday: number; activeAlerts: number; recentAlerts: AlertResponse[];
}
export interface BroadcastAlertRequest { alertId: string; alertType: AlertType; }

// auth.types.ts
export interface LoginResponse { token: string; fullName: string; matricNumber: string; expiresAt: string; }
export interface AdminLoginResponse { token: string; username: string; role: string; expiresAt: string; }
export interface RegisterStudentRequest {
  matricNumber: string; fullName: string; email: string;
  phoneNumber: string; telegramUsername?: string; password: string;
}

// matricRecord.types.ts
export interface MatricRecordResponse {
  id: string; matricNumber: string; fullName: string;
  faculty: string; department: string; level: string; isUsed: boolean;
}
export interface MatricUploadResult { inserted: number; skipped: number; invalid: number; errors: string[]; }
```

---

## Campus Boundary Constants (for client-side validation)

```typescript
// utils/campusBoundary.ts
export const CAMPUS_CENTER = { lat: 7.3775, lng: 3.9470 };
export const CAMPUS_RADIUS_METERS = 500;

// Haversine implementation on frontend mirrors backend CampusBoundaryService
```

---

*Document End — Version 1.0*
*All content derived from direct source code analysis of CEARCS backend repository.*
*No assumptions or invented content.*
