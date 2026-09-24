# خيّاط — Khayyat

A marketplace that connects customers, tailors, fabric sellers and delivery providers. The product blueprint lives in `خياط.md` (outside this repo).

## Status

| Area | State |
|------|-------|
| Backend foundation: config, DB, migrations, RFC 7807 errors | ✅ Done, tested |
| Auth: register/login (email or phone), JWT + rotating refresh tokens, logout, logout-all, RBAC | ✅ Done, tested |
| Users: profile, addresses | ✅ Done, tested |
| Frontend foundation: Next.js 16, ar/en with RTL/LTR, design tokens, landing page | ✅ Done: builds, lints, typechecks; checked on desktop and mobile |
| Tailor search, requests, quotes, orders, messaging, reviews, admin | ⏳ Next (see blueprint §13) |

## Layout

```
backend/    FastAPI + SQLAlchemy 2 + Alembic   (Python 3.12)
frontend/   Next.js 16 App Router + React 19 + Tailwind 3 + next-intl 4
docker-compose.yml   Postgres + backend + frontend
```

## Run without Docker

### Backend (SQLite)

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -e ".[dev]"
alembic upgrade head            # creates khayyat.db and seeds the roles
python -m scripts.seed          # demo accounts (dev only)
uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/v1
- Interactive docs: http://localhost:8000/api/docs
- Tests: `pytest` · Lint: `ruff check .`

### Frontend

Requires Node.js 20.9+ (installed here: v24 LTS, portable, in `%LOCALAPPDATA%\Programs`).

```bash
cd frontend
npm install
npm run dev        # or: npm run build && npm start
npm run lint       # ESLint 9 (eslint-plugin-react doesn't support ESLint 10 yet)
npm run typecheck
```

Open http://localhost:3000. It redirects to `/ar` (the default locale); `/en` is the English site.

## Run with Docker

```bash
docker compose up --build
docker compose exec backend python -m scripts.seed
```

## Demo accounts (local only)

All accounts use the password `demo1234`. The seed script refuses to run when `ENVIRONMENT=production`.

| Role | Email |
|------|-------|
| Customer | sara@demo.khayyat |
| Tailor | ahmad@demo.khayyat (plus 9 more demo tailors) |
| Seller | mohammed@demo.khayyat |
| Delivery | yousef@demo.khayyat |
| Admin | admin@demo.khayyat |

## Conventions

- **Versions:** the blueprint names Next.js 14, but 14.x has unpatched security advisories (including a Windows RCE), so we use Next 16. That means `src/proxy.ts` instead of `middleware.ts`, and route `params` is a Promise.
- **Errors:** every error response is `application/problem+json` (RFC 7807). Validation errors include `errors: [{field, message}]`.
- **Auth:** the access token lasts 15 minutes and the refresh token 7 days. Each refresh issues a new refresh token. Replaying an old refresh token revokes that whole login session.
- **Roles:** `require_roles(RoleName.X)` reads roles from the DB, not the token, so revoking a role takes effect immediately.
- **Enums:** stored as VARCHAR (`native_enum=False`), so adding a status needs no `ALTER TYPE`.
- **Migrations:** `alembic revision --autogenerate -m "..."`, then review the file. Autogenerate misses things; for example, the initial migration needed its role inserts added by hand.
- **Business rules:** configurable values, such as `PLATFORM_COMMISSION_RATE`, live in settings, not in code.
- **Frontend colors:** use the Tailwind tokens (`bg-gold`, `text-ink`, `text-muted`…). Gold is for fills only. For gold text on a light background, use `text-gold-ink`, the accessible darker variant.
- **Unfinished pages** use `<ComingSoon>` and say so honestly. Never fake a feature.

## Integration points (not yet wired)

| Concern | Where it will live |
|---------|--------------------|
| Payments (Stripe behind an abstraction) | `backend/app/services/payments/` |
| Email / SMS (verification, notifications) | `backend/app/services/notifications/` |
| Media storage (S3 / R2 / MinIO) | `backend/app/core/storage.py` |
| Rate limiting, Celery workers | Redis; added to docker-compose when first used |
| Search | Postgres FTS first, Meilisearch later |
