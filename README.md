# Collaborative Kanban Board

A Trello-style collaborative kanban board: Organizations → Workspaces → Boards → Lists → Cards, with
labels, due dates, assignees, comments, attachments (as links), activity history, search, and filters.

**Stack:** React + TypeScript + Vite (frontend) · Spring Boot + Spring Security + Spring Data JPA (backend)
· PostgreSQL · JWT auth · Swagger/OpenAPI · Docker Compose · GitHub Actions CI.

---

## ⚠️ Honest scope note (please read before you build on this)

This is a substantial project, and I want to be upfront about exactly what's here rather than
let a README oversell it:

**Fully implemented:**
- JWT authentication (register/login), password hashing with BCrypt
- Organizations, with role-based membership (OWNER/ADMIN/MEMBER) and invite-by-email
- Workspaces, Boards, Lists, Cards, with full CRUD
- Drag-and-drop reordering of both lists and cards, backed by a real position-based API
  (`PATCH /cards/{id}/move`, `PATCH /lists/{id}/move`) — not just a client-side illusion
- Labels (create/attach/detach), due dates, card assignees (many-to-many)
- Comments (create/edit/delete, author-only permissions)
- Attachments — **as URL references only** (see note below)
- Activity log per board (append-only event trail)
- Search (by title) and filter (by label/assignee) endpoints
- Swagger UI for exploring/testing the API
- Docker Compose for local dev; a GitHub Actions workflow that builds/tests both halves and the Docker images

**Deliberately NOT implemented** (these are the "Advanced" tier from the spec, and each is
genuinely a separate chunk of engineering — I'd rather tell you plainly than fake it):
- **Real-time updates (WebSockets)** — the board only reflects other users' changes on refresh.
  Wiring this in would mean a `/ws` STOMP endpoint on the backend and a subscribing client; the
  architecture here doesn't fight that (activity log + move endpoints already emit the events
  you'd broadcast), but it isn't built.
- **Push notifications** — no notification service, email, or in-app inbox.
- **Offline support** — no service worker, no local queue/sync. Losing connectivity mid-edit will
  just fail the request.
- **File uploads** — "Attachments" store a filename + URL you provide (e.g. a link to a file you
  already uploaded to Drive/S3/wherever). There's no upload endpoint, storage bucket, or virus
  scanning. Building that reliably needs you to pick a storage backend (S3, GCS, MinIO, etc.) —
  I didn't want to hard-code a fake pipeline that looks real but isn't.
- **Workspace-level membership** — access control is simplified to organization membership:
  anyone in the org can see every workspace/board in it. There's no separate "add this specific
  person to just this one workspace" layer. This was a deliberate simplification to keep the
  authorization model tractable; see `MembershipService.java` for where you'd extend it.

None of the above is silently stubbed to look functional — they're just absent, and the code
doesn't pretend otherwise.

## A note on verification

I wrote this in a sandboxed environment that can reach npm but **not** Maven Central, so I was able to
run `npm install` and `npm run build` on the frontend (both succeeded — no TypeScript errors), but I
could **not** actually compile or run the Spring Boot backend here. The backend code follows standard,
well-established Spring Boot 3.3 / Spring Security 6 / Spring Data JPA patterns I'm confident in, but I
have not executed it. Please run `mvn clean verify` locally (or via the included CI workflow) before
relying on it, and treat dependency versions in `pom.xml` (Spring Boot 3.3.2, jjwt 0.12.6, springdoc
2.6.0) as things to double-check against Maven Central for the latest patch releases — I picked
versions I believe are real and compatible, but I can't guarantee they're the current latest as of
today.

---

## Project structure

```
kanban-app/
├── backend/                   Spring Boot API
│   ├── src/main/java/com/kanban/app/
│   │   ├── config/             Security, CORS, OpenAPI config
│   │   ├── security/           JWT filter, JwtUtil, UserDetails
│   │   ├── entity/             JPA entities
│   │   ├── repository/         Spring Data repositories
│   │   ├── dto/request|response
│   │   ├── service/             Business logic + authorization checks
│   │   ├── controller/          REST controllers
│   │   └── exception/           Global exception handling
│   ├── src/test/                Smoke test + JwtUtil test (H2, no DB needed)
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                   React + TS + Vite SPA
│   ├── src/
│   │   ├── api/                 Axios client + typed endpoint wrappers
│   │   ├── components/          CardModal, TopNav, ProtectedRoute
│   │   ├── pages/                Login, Register, Organizations, Workspaces, Boards, Board (kanban view)
│   │   ├── store/                Zustand auth store
│   │   └── types/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Data model (entity relationships)

```
User ─┬─< OrganizationMember >─┬─ Organization ─┬─< Workspace ─┬─< Board ─┬─< BoardList ─┬─< Card >─┬─< Label
      │                        │ (role)         │              │          │              │          │  (via card_labels)
      │                        │                │              │          │              │          └─< User (assignees, via card_members)
      │                        │                │              │          │              ├─< Comment
      │                        │                │              │          │              ├─< Attachment (url only)
      │                        │                │              │          └─< ActivityLog
```

Authorization: access to a Workspace/Board/List/Card is derived by walking up to the owning
Organization and checking `OrganizationMember`. See `MembershipService.java`.

## Running locally with Docker Compose

```bash
git clone <your-repo-url>
cd kanban-app
cp .env.example .env    # edit JWT_SECRET before any real use
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html

## Running locally without Docker

### Backend
```bash
cd backend
# Start a Postgres instance and export matching env vars, e.g.:
export DB_HOST=localhost DB_PORT=5432 DB_NAME=kanban_db DB_USER=kanban_user DB_PASSWORD=kanban_pass
export JWT_SECRET=some-long-random-string-at-least-32-bytes
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8080/api
npm install
npm run dev
```
Visit http://localhost:5173.

## API overview

All endpoints except `/api/auth/**` require `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Organizations | `POST/GET /api/organizations`, `GET /api/organizations/{id}`, `POST/GET /api/organizations/{id}/members` |
| Workspaces | `POST/GET /api/organizations/{orgId}/workspaces`, `GET /api/workspaces/{id}` |
| Boards | `POST/GET /api/workspaces/{wsId}/boards`, `GET/DELETE /api/boards/{id}` |
| Lists | `POST/GET /api/boards/{boardId}/lists`, `PATCH /api/lists/{id}/move`, `DELETE /api/lists/{id}` |
| Cards | `POST /api/lists/{listId}/cards`, `GET/PUT/DELETE /api/cards/{id}`, `PATCH /api/cards/{id}/move`, `POST/DELETE /api/cards/{id}/labels/{labelId}`, `POST/DELETE /api/cards/{id}/assignees/{userId}` |
| Search/Filter | `GET /api/boards/{id}/cards/search?query=`, `GET /api/boards/{id}/cards/filter?labelId=&assigneeId=` |
| Labels | `POST/GET /api/boards/{id}/labels`, `DELETE /api/labels/{id}` |
| Comments | `POST/GET /api/cards/{id}/comments`, `PUT/DELETE /api/comments/{id}` |
| Attachments | `POST/GET /api/cards/{id}/attachments`, `DELETE /api/attachments/{id}` |
| Activity | `GET /api/boards/{id}/activity` |

Full interactive documentation is available via Swagger UI once the backend is running.

## Testing

- Frontend: `npm run build` type-checks the whole app (verified working in this environment).
- Backend: `mvn clean verify` runs a Spring context smoke test and a `JwtUtil` round-trip test
  against an in-memory H2 database (`application-test.yml`), so no Postgres instance is required
  for CI. I was not able to execute this locally due to sandbox network restrictions — please run
  it yourself before trusting it.

## Suggested next steps if you extend this

1. Add WebSocket (STOMP over SockJS) broadcast on card/list move and comment events.
2. Add a real file storage backend (S3-compatible) behind the attachment endpoints.
3. Add workspace-level membership if you need finer-grained access than "whole org."
4. Add rate limiting / Redis caching for board reads if boards get large.
5. Add pagination to comments/activity log once boards accumulate history.
