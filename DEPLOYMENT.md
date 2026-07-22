# Deployment Walkthrough

This assumes the "low-cost / single-region" hosting budget from the MVP
spec's assumptions table. Exact commands per step — copy-paste, adjust
names/values for your accounts.

---

## 1. Push the repo to GitHub

```bash
cd apoxyltech
git init
git add .
git commit -m "Initial Phase 1 scaffold"
gh repo create apoxyltech-innovations-hub --private --source=. --push
# or, without the gh CLI:
#   git remote add origin git@github.com:<you>/apoxyltech-innovations-hub.git
#   git push -u origin main
```

## 2. Cloudflare R2 (file storage)

1. Cloudflare dashboard → R2 → Create bucket → name it (e.g. `apoxyltech-phase1`).
2. R2 → Manage API tokens → Create API token → permissions: Object Read & Write, scoped to that bucket.
3. Note down: Account ID, Access Key ID, Secret Access Key.
4. Put these in `backend/.env` (local) and as production secrets on your backend host (step 4).

## 3. Frontend → Vercel

```bash
cd frontend
npx vercel link          # follow prompts, creates .vercel/project.json
npx vercel env add NEXT_PUBLIC_API_BASE_URL production
# paste your backend's production URL + /api, e.g. https://api.apoxyltech.com/api
```

Then in GitHub repo settings → Secrets and variables → Actions, add:
- `VERCEL_TOKEN` — from https://vercel.com/account/tokens

Pushing to `main` with changes under `frontend/` now triggers
`.github/workflows/deploy-frontend.yml` automatically.

## 4. Backend → pick a host

The CI workflow (`deploy-backend.yml`) already builds and pushes a Docker
image to GHCR (GitHub Container Registry) on every push to `main`. You just
need to point *something* at that image. Three common options:

### Option A: Fly.io (simplest for a single small container + Postgres)
```bash
cd backend
flyctl launch --no-deploy    # creates fly.toml, choose a region near your users
flyctl postgres create       # managed Postgres; attach it when prompted
flyctl secrets set JWT_SECRET_KEY=... R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... \
  R2_SECRET_ACCESS_KEY=... SMTP_HOST=... SMTP_USER=... SMTP_PASSWORD=...
flyctl deploy --image ghcr.io/<you>/apoxyltech-innovations-hub-backend:latest
```
Then add `FLY_API_TOKEN` as a GitHub secret and uncomment/adjust the
`flyctl deploy` line in `deploy-backend.yml`'s deploy job.

### Option B: Railway (good if you also want a one-click Postgres+Redis)
- Connect the GitHub repo in the Railway dashboard, point it at `backend/Dockerfile`.
- Add a Postgres plugin; Railway injects `DATABASE_URL` automatically (adjust
  `app/core/config.py` default parsing if Railway's URL scheme differs —
  Railway uses `postgresql://`, this app expects `postgresql+asyncpg://`,
  so add a small startup shim that rewrites the scheme if needed).
- Set the same secrets as Option A in Railway's environment variables UI.
- Railway's own GitHub integration handles deploys — the GHCR push step in
  CI becomes optional/for backup rather than required.

### Option C: Plain VPS (cheapest, most manual)
```bash
# On the VPS, one-time setup:
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
git clone https://github.com/<you>/apoxyltech-innovations-hub.git
cd apoxyltech-innovations-hub
cp backend/.env.example backend/.env   # fill in real values
docker compose -f docker-compose.yml up -d
```
For redeploys, add `DEPLOY_SSH_KEY` and `DEPLOY_HOST` as GitHub secrets and
extend the `deploy` job in `deploy-backend.yml` with an SSH step
(`appleboy/ssh-action` is a common choice) that runs
`docker compose pull && docker compose up -d` remotely.

## 5. Domain & HTTPS

- Point your domain's DNS: `A`/`CNAME` for the frontend to Vercel (Vercel
  gives you the exact records after adding the domain in its dashboard);
  a subdomain like `api.yourdomain.com` to whichever backend host you chose.
- Vercel and Fly.io/Railway both provision HTTPS certificates automatically
  once DNS is pointed correctly. For a plain VPS, add Caddy or Nginx +
  Let's Encrypt (certbot) in front of the backend container.

## 6. Post-deploy checklist

- [ ] Hit `https://api.yourdomain.com/healthz` — should return `{"status": "ok"}`
- [ ] Register a test account end-to-end, confirm the verification email arrives
- [ ] Promote that account to `admin` (see README's SQL snippet)
- [ ] Submit the contact form, confirm the lead shows up in `/admin/leads`
  and the notification email arrives
- [ ] Set up automated daily Postgres backups (managed hosts usually offer
  this as a checkbox; on a VPS, a cron job running `pg_dump` to R2 or
  another bucket is enough for Phase 1 per the MVP spec's NFRs)
- [ ] Set `SENTRY_DSN` in production so errors are actually visible
