# Collaborative Kanban Board

A full-stack Trello-inspired project management application that enables teams to organize work through **Organizations → Workspaces → Boards → Lists → Cards**. The project demonstrates modern full-stack development with secure JWT authentication, role-based authorization, drag-and-drop task management, comments, labels, due dates, activity tracking, search/filter APIs, and Dockerized deployment.

> **Status:** Functional MVP with core collaboration features implemented. Advanced capabilities such as real-time collaboration, file uploads, and offline support are intentionally left as future enhancements.

## Tech Stack

**Frontend:** React • TypeScript • Vite

**Backend:** Spring Boot • Spring Security • Spring Data JPA

**Database:** PostgreSQL

**Authentication:** JWT + BCrypt

**Documentation:** Swagger / OpenAPI

**DevOps:** Docker Compose • GitHub Actions

---

## Features

### Implemented

- JWT authentication (register/login)
- BCrypt password hashing
- Role-based organizations (OWNER / ADMIN / MEMBER)
- Organization invitations by email
- Workspaces, Boards, Lists and Cards (full CRUD)
- Persistent drag-and-drop ordering for lists and cards
- Labels, assignees and due dates
- Comments with author-only edit/delete permissions
- Attachment references using external URLs
- Board activity history
- Search by title
- Filter by label and assignee
- Swagger API documentation
- Docker Compose local environment
- GitHub Actions CI

## Architecture

```text
React + TypeScript
        │
 REST API (JWT)
        │
 Spring Boot
        │
 Service Layer
        │
 Spring Data JPA
        │
 PostgreSQL
```

## Design Decisions

- Layered Spring Boot architecture separating controllers, services, repositories and entities.
- Authorization is derived from organization membership.
- Position-based ordering keeps drag-and-drop persistent.
- DTOs isolate API contracts from persistence models.
- Swagger is included for API exploration.

## Security

- JWT-based authentication
- BCrypt password hashing
- Stateless authorization
- Role-based access control
- Protected REST endpoints

## Project Structure

See the original project tree in the repository.

## Data Model

User → OrganizationMember → Organization → Workspace → Board → List → Card

Cards support Labels, Assignees, Comments, Attachments (URL), and Activity Logs.

## Running

### Docker

```bash
git clone <repo>
cd kanban-app
cp .env.example .env
docker compose up --build
```

### Local

Backend

```bash
mvn spring-boot:run
```

Frontend

```bash
npm install
npm run dev
```

## API

Swagger/OpenAPI is available after starting the backend.

Authentication uses:

```
Authorization: Bearer <JWT>
```

The API includes endpoints for authentication, organizations, workspaces, boards, lists, cards, labels, comments, attachments, activity history, search, and filtering.

## Testing

- Frontend type checking using `npm run build`
- Backend smoke tests
- JWT utility tests
- GitHub Actions CI pipeline

## Current Limitations

The project intentionally focuses on the core collaboration workflow. The following features are planned for future iterations:

- Real-time collaboration via WebSockets
- Push notifications
- Offline support
- Native file uploads (attachments currently store external URLs)
- Workspace-level access control
- Pagination for large activity logs
- Redis caching

These features are not stubbed or partially implemented; they are intentionally out of scope for the current MVP.

## Verification

The frontend has been successfully type-checked.

The backend follows standard Spring Boot practices and includes automated tests and a CI workflow. Please execute `mvn clean verify` locally before production use.

## Roadmap

- WebSocket-based live collaboration
- S3/MinIO-backed file uploads
- Workspace-level permissions
- Redis caching
- Notifications
- Performance improvements

## License

MIT (or your preferred license).
