# ApoxylTech Innovations Hub — Phase 1

Enterprise-grade planning, real Phase 1 scope. See
`docs/ApoxylTech_Phase1_MVP_Spec.md` for what's in/out of this release.

## Stack
- **Backend:** FastAPI, PostgreSQL, SQLAlchemy (async), Alembic, Argon2, JWT
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Storage:** Cloudflare R2 (S3-compatible)
- **Local dev:** Docker Compose (Postgres + Redis + backend + frontend)

## Repo layout
```
backend/    FastAPI app, Alembic migrations, tests
frontend/   Next.js app (App Router)
docs/       MVP spec, data dictionary, OpenAPI spec (source of truth for the API contract)
.github/    CI (test/build) + deploy workflows
```

## Quickstart (local dev)

1. Copy environment templates:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```
   Fill in `backend/.env` with real values for R2 and SMTP once you have them —
   the app runs locally without them (email falls back to console logging;
   file upload will fail until R2 credentials are set).

2. Generate a real `JWT_SECRET_KEY` and put it in `backend/.env`:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(64))"
   ```

3. Start everything:
   ```bash
   docker compose up --build
   ```
   This runs Postgres, Redis, the backend (with migrations applied
   automatically on start), and the frontend.

4. Visit:
   - Frontend: http://localhost:3000
   - Backend docs (Swagger UI): http://localhost:8000/docs
   - Health check: http://localhost:8000/healthz

5. First admin user: register normally via `/register`, then manually
   promote that user to the `admin` role in the database (Phase 1 has no
   "first admin" bootstrap endpoint by design — this is a one-time manual
   step, not something to automate into an unauthenticated route):
   ```sql
   INSERT INTO user_roles (user_id, role_id)
   SELECT u.id, r.id FROM users u, roles r
   WHERE u.email = 'you@example.com' AND r.name = 'admin';
   ```

## Running tests
```bash
cd backend
pip install -r requirements.txt
pytest
```

## Deployment
See `DEPLOYMENT.md` at the repo root for the full walkthrough (GitHub →
Vercel → backend host → Cloudflare R2 → domain/DNS).

## Design/engineering conventions
- Every table has `created_at` / `updated_at` / `deleted_at` audit columns.
- Authorization is permission-code based (`project.read`, `blog.write`,
  etc.), not role-name based, so new roles can be added later without
  touching route code — see `backend/app/core/permissions.py`.
- Sensitive fields (password hashes, verification/reset tokens) never
  appear in any API response — see the SECURITY CLASSIFICATION comments in
  `backend/app/models/`.
