# SafeCircle — API Contract

**Base URL:** `http://localhost:8000/api/v1`

All endpoints except `/auth/*` require: `Authorization: Bearer <supabase_jwt>`

---

## Auth

| Method | Endpoint | Body |
|---|---|---|
| POST | `/auth/signup` | `{ email, password, full_name, preferred_language }` |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/logout` | `{}` |

## Circles

| Method | Endpoint | Body |
|---|---|---|
| GET | `/circles` | — |
| POST | `/circles` | `{ name, description }` |
| GET | `/circles/:id` | — |
| POST | `/circles/:id/join` | `{ invite_code }` |
| DELETE | `/circles/:id/leave` | — |

## Risk X-Ray

| Method | Endpoint | Body |
|---|---|---|
| POST | `/circles/:id/risk-xray` | `{ survey_answers }` |
| GET | `/circles/:id/risk-xray` | — |
| GET | `/circles/:id/risk-xray/summary` | — |

## Crisis Mode

| Method | Endpoint | Body |
|---|---|---|
| POST | `/crisis/start` | `{ crisis_type, state }` |
| GET | `/crisis/:session_id` | — |
| PATCH | `/crisis/:session_id/step` | `{ step_id, completed: true }` |

## Emergency Pool

| Method | Endpoint | Body |
|---|---|---|
| GET | `/circles/:id/pool` | — |
| POST | `/circles/:id/pool/contribute` | `{ amount }` |
| POST | `/circles/:id/pool/request` | `{ amount, reason, crisis_type }` |
| POST | `/circles/:id/pool/vote` | `{ request_id, vote: true/false }` |

## Benefits

| Method | Endpoint | Params |
|---|---|---|
| GET | `/benefits/check` | `state, income, household_size, employment_type, has_health_insurance` |
