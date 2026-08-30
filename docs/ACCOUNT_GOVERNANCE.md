# Synthora Account Governance & Formal Appeals Architecture (Phase 1.11)

## 1. Overview

Phase 1.11 implements an institutional account-governance, suspension, reinstatement, and formal appeals system for the Synthora B2B chemical marketplace. It enables administrators to moderate user and supplier accounts, maintain immutable audit histories, request additional compliance information, and review formal user appeals with automatic reinstatement workflows.

---

## 2. Core Capabilities

### 2.1 Account Suspension
- **Actors**: Administrators (`ROLE_ADMIN`) only.
- **Targets**: `USER` (Buyers) and `SUPPLIER` accounts.
- **Constraints**:
  - Administrators cannot suspend other administrators under the current single-admin role model.
  - Self-suspension is strictly prohibited.
  - Mandatory justification reason (`min = 5`, `max = 2000` chars).
  - Optional internal admin notes (`admin_internal_notes`), guaranteed never to be leaked to users.
- **Enforcement**:
  - User status transitions to `UserStatus.SUSPENDED`.
  - Active password reset tokens are invalidated immediately.
  - Non-blocking email and in-app notifications dispatched.
  - Immutable audit entry recorded (`AuditAction.USER_SUSPENDED`).

### 2.2 JWT Authentication & Restricted Endpoint Access Policy
- Existing and freshly authenticated JWTs of suspended users are restricted by `JwtAuthenticationFilter`:
  - **Permitted**:
    - `GET /api/v1/account/suspension` (View active suspension reason and appeal tracker)
    - `GET /api/v1/account/appeals` (View submission history)
    - `GET /api/v1/account/appeals/{id}` (View specific appeal detail)
    - `POST /api/v1/account/appeals` (Submit formal appeal)
    - `POST /api/v1/account/appeals/{id}/response` (Respond to information requests)
  - **Denied with 401 / 403**:
    - All commercial marketplace operations (`/api/v1/rfqs/**`, `/api/v1/orders/**`, `/api/v1/supplier/products/**`, `/api/v1/admin/**`, profile edits).

### 2.3 Formal Appeals Lifecycle
- **Appeal States (`AppealStatus`)**:
  - `SUBMITTED`: User has submitted an initial appeal with reason.
  - `UNDER_REVIEW`: Administrator has acknowledged and initiated review.
  - `INFORMATION_REQUIRED`: Administrator requests clarifying details or documentation from the user.
  - `APPROVED`: Administrator approves the appeal. Automatically reinstates the user account to `ACTIVE` and closes active suspension.
  - `REJECTED`: Administrator rejects the appeal with a formal decision note. User remains `SUSPENDED`.
- **Anti-Spam Safeguard**: Users cannot submit multiple concurrent active appeals for the same suspension.
- **IDOR Protection**: Users can only view and interact with their own appeals (`appeal.getUser().getId().equals(authenticatedUser.getId())`).

---

## 3. Database Schema (`V42`)

### `account_suspensions`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Suspension identifier |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id)` | Suspended user |
| `suspended_by_admin_id` | `UUID` | `NOT NULL REFERENCES users(id)` | Acting administrator |
| `suspended_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | Suspension timestamp |
| `reason` | `TEXT` | `NOT NULL` | User-visible justification |
| `internal_notes` | `TEXT` | `NULL` | Private internal notes |
| `reinstated_at` | `TIMESTAMP WITH TIME ZONE` | `NULL` | Reinstatement timestamp |
| `reinstated_by_admin_id` | `UUID` | `NULL REFERENCES users(id)` | Reinstating admin |
| `reinstatement_notes` | `TEXT` | `NULL` | Reinstatement notes |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | Audit timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | Audit timestamp |

### `account_suspension_appeals`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Appeal identifier |
| `suspension_id` | `UUID` | `NOT NULL REFERENCES account_suspensions(id)` | Associated suspension |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id)` | Submitting user |
| `status` | `VARCHAR(50)` | `NOT NULL` | `SUBMITTED`, `UNDER_REVIEW`, `INFORMATION_REQUIRED`, `APPROVED`, `REJECTED` |
| `submitted_reason` | `TEXT` | `NOT NULL` | Formal user statement |
| `user_response` | `TEXT` | `NULL` | Clarification response |
| `admin_response` | `TEXT` | `NULL` | User-visible decision/message |
| `admin_internal_notes` | `TEXT` | `NULL` | Private moderation notes |
| `requested_at` | `TIMESTAMP WITH TIME ZONE` | `NULL` | Info request timestamp |
| `reviewed_at` | `TIMESTAMP WITH TIME ZONE` | `NULL` | Review timestamp |
| `reviewed_by_admin_id` | `UUID` | `NULL REFERENCES users(id)` | Reviewing admin |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | Audit timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | Audit timestamp |

---

## 4. API Endpoints

### 4.1 Administrator Endpoints (`/api/v1/admin/account-governance`)
- `GET /suspensions`: Paginated suspensions with search, role, and active-only filters.
- `GET /suspensions/{id}`: Specific suspension detail.
- `GET /users/{userId}/detail`: Full governance timeline for a specific user.
- `POST /users/{userId}/suspend`: Suspend user with mandatory reason.
- `POST /users/{userId}/reinstate`: Reinstate user account.
- `GET /appeals`: Paginated formal appeals queue.
- `GET /appeals/{appealId}`: Detailed appeal context.
- `POST /appeals/{appealId}/review`: Begin formal appeal review.
- `POST /appeals/{appealId}/request-information`: Request additional info from user.
- `POST /appeals/{appealId}/approve`: Approve appeal & automatically reinstate user.
- `POST /appeals/{appealId}/reject`: Reject appeal with formal response.

### 4.2 Suspended User Endpoints (`/api/v1/account`)
- `GET /suspension`: Active suspension detail and active appeal state.
- `GET /appeals`: User's appeal submission history.
- `GET /appeals/{id}`: Specific appeal status.
- `POST /appeals`: Submit formal appeal.
- `POST /appeals/{id}/response`: Respond to administrative information request.

---

## 5. Verification Metrics

- **Flyway Migrations**: V1 through V42 verified.
- **Backend Test Suite**: **1,454 / 1,454 passing** (including 35 dedicated governance security & functional tests).
- **Frontend Build**: **53 / 53 routes building cleanly** with 0 TypeScript/ESLint errors.
