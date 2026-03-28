# Redis + Socket.io Integration (Backend ↔ Frontend)

This repo now supports:

- **Redis-backed cache** for `settings` + `regions` (fixes multi-instance cache fragmentation)
- **Redis-backed rate limiting** (fixes multi-instance limiter fragmentation)
- **Socket.io real-time events** for applicants + admin dashboard
- **Multi-instance Socket.io broadcasting** via Redis adapter

If you do **not** set `REDIS_URL`, everything still works in single-instance mode (in-memory fallback).

---

## 1) Backend env vars

Add these env vars in the backend environment (recommended for staging/production):

```bash
# Enables Redis-backed cache + rate limit store + socket.io redis adapter
REDIS_URL=redis://localhost:6379

# Socket.io CORS (comma-separated). If unset: "*" (open)
CORS_ORIGIN=http://localhost:5173

# Optional: applicant socket token expiry
APPLICANT_SOCKET_JWT_EXPIRES_IN=30d
```

Notes:

- `JWT_SECRET` must be set and consistent across instances (already required).
- Your load balancer must support WebSockets.

---

## 2) Socket.io endpoints

Socket.io is attached to the same HTTP server as your API.

- Base URL (dev): `http://localhost:3000`
- Default Socket.io path: `/socket.io`

Namespaces:

- Admin: `/admin`
- Applicant: `/applicant`

Rooms:

- Admin namespace: all admins auto-join room `admins`
- Applicant namespace: applicant auto-joins room `applicant:<applicantId>`

---

## 3) Auth model (important)

### Admin sockets

Use the same **admin JWT** you already get from:

- `POST /api/v1/admins/login`

That JWT must contain `role: "ADMIN"`.

### Applicant sockets

When an applicant is created via:

- `POST /api/v1/applicants`

the response now includes:

- `data.socketToken`

Store this token client-side (e.g. `localStorage`) and use it to connect to `/applicant`.

That token contains:

- `role: "APPLICANT"`
- `applicantId: "..."`

---

## 4) Frontend: copy/paste connection examples

Install:

```bash
npm i socket.io-client
```

### A) Admin dashboard (real-time new applicant + status updates)

```js
import { io } from "socket.io-client";

const adminJwt = "<ADMIN_JWT_FROM_LOGIN>";

export const adminSocket = io("http://localhost:3000/admin", {
  transports: ["websocket"],
  auth: { token: adminJwt },
});

adminSocket.on("connect", () => {
  console.log("admin socket connected", adminSocket.id);
});

adminSocket.on("admin:applicant:new", (payload) => {
  // payload: { applicantId, status, submittedAt }
  console.log("NEW applicant", payload);
});

adminSocket.on("admin:applicant:status", (payload) => {
  // payload: { applicantId, status }
  console.log("Applicant status changed", payload);
});

adminSocket.on("connect_error", (err) => {
  console.error("admin socket connect_error", err.message, err.data);
});
```

### B) Applicant UI (approval + payment status)

```js
import { io } from "socket.io-client";

const applicantSocketToken = "<SOCKET_TOKEN_FROM_CREATE_APPLICANT_RESPONSE>";

export const applicantSocket = io("http://localhost:3000/applicant", {
  transports: ["websocket"],
  auth: { token: applicantSocketToken },
});

applicantSocket.on("connect", () => {
  console.log("applicant socket connected", applicantSocket.id);
});

applicantSocket.on("approval:status", (payload) => {
  // payload: { applicantId, status, decidedBy? }
  console.log("Approval status update", payload);
});

applicantSocket.on("payment:status", (payload) => {
  // payload: { applicantId, status, razorpayOrderId, razorpayPaymentId, isPaid }
  console.log("Payment status update", payload);
});

applicantSocket.on("connect_error", (err) => {
  console.error("applicant socket connect_error", err.message, err.data);
});
```

---

## 5) Event reference (what emits when)

### Admin namespace: `/admin`

- `admin:applicant:new`
  - Emitted when a new applicant is created via:
    - `POST /api/v1/applicants`
    - `POST /api/v1/applicants/admin-submit`

- `admin:applicant:status`
  - Emitted when applicant status changes in ways relevant to admin dashboard:
    - Member approval makes applicant `PENDING_ADMIN_REVIEW`
    - Admin review sets `REJECTED_BY_ADMIN` or `PENDING_PRESIDENT_APPROVAL`

### Applicant namespace: `/applicant`

- `approval:status`
  - Emitted when:
    - Member approves/rejects
    - Admin approves/rejects
    - President approves/rejects

- `payment:status`
  - Emitted when payment is verified via:
    - `POST /api/v1/payments/verify`

---

## 6) Multi-instance notes

When `REDIS_URL` is set:

- Socket.io uses Redis adapter, so emits reach users regardless of which instance they’re connected to.
- Rate limiting counters are shared across instances.
- Cache values are shared across instances.

Load balancer requirements:

- Must support WebSockets.
- If you enable Socket.io long-polling fallbacks, sticky sessions can be helpful; the examples force `websocket` transport.
