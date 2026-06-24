# Deploying [Company] Security on Koyeb + Neon (Free)

A step-by-step guide to host this site on **Koyeb** (the Node/Express app — no sleep, free)
with **Neon** (free PostgreSQL that doesn't expire). Replaces Render and fixes the
"free for one month" database problem.

---

## Why this stack

| Piece     | Host  | Why |
|-----------|-------|-----|
| Web app + API + static site | **Koyeb** free "nano" service | No spin‑down (unlike Render), no credit card for the free tier, deploys straight from GitHub |
| PostgreSQL database | **Neon** free tier | Persistent (does **not** expire after 30 days like Render's free DB), generous free storage, autosuspends compute when idle |

Your `server.js` already serves the API **and** the static website from one process, so you
only need **one** Koyeb service. The database is the only external piece.

---

## Prerequisites

- Your code is on GitHub (repo: `companywebsite`).
- The repo's Node app lives in the **`backend/`** folder; `server.js` serves the parent
  folder (the website) — so Koyeb's working directory must be `backend`.
- One small code change is already done for you: `database/db.js` now enables SSL for any
  managed Postgres (Neon included), so no extra config is needed for the DB connection.

---

## Part A — Create the database on Neon

1. Go to **https://neon.tech** → sign up (GitHub login is fine) → **Create project**.
2. Pick a region close to your users (e.g. Singapore/`ap-southeast`).
3. After it's created, open **Connection Details** (or **Dashboard → Connect**).
4. Choose **Pooled connection** and **Node.js**, and copy the connection string. It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   - Use the **pooled** (`-pooler`) host — it's best for an always‑on app.
   - Keep the `?sslmode=require` at the end.
5. Save this string — it becomes the `DATABASE_URL` value on Koyeb.

> You do **not** need to create tables manually. On first boot the app runs `schema.sql`
> (`CREATE TABLE IF NOT EXISTS …`) automatically, and seeds the first super‑admin from the
> `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars.

---

## Part B — Deploy the app on Koyeb

1. Go to **https://www.koyeb.com** → sign up → **Create Web Service** → **GitHub** →
   authorize and pick your `companywebsite` repo and the `main` branch.
2. **Builder:** leave it on **Buildpack** (auto‑detects Node from `package.json`).
3. **Work directory / source directory:** set to **`backend`**.
   *(This is critical — the `package.json` is in `backend/`, and `server.js` serves the
   website from one level up, which is included in the repo.)*
4. **Build command:** `npm install` (default). **Run command:** `npm start` (default).
5. **Instance:** select the **Free** ("nano") instance. **Regions:** pick the same region as Neon.
6. **Exposed port:** set to **`8080`** (Koyeb injects `PORT=8080`; the app reads it).
7. **Health check:** type **HTTP**, path **`/api/health`** (the app returns `{"success":true}`).
8. Add the **environment variables** below.
9. Click **Deploy**. First build takes ~1–3 minutes. When healthy, Koyeb gives you a URL like
   `https://companywebsite-xxxx.koyeb.app`.

### Build option B — Dockerfile (reproducible, recommended)

A `Dockerfile` + `.dockerignore` are included at the repo root, so the build is
version‑controlled instead of relying on dashboard settings. To use it:

- In Koyeb, set **Builder = Dockerfile** (Dockerfile location: `Dockerfile`, context: repo root).
- With the Dockerfile you do **not** set a work directory or run command — the image already
  installs `backend/` deps and starts `node server.js` from `/app/backend` (so the website
  root at `/app` is served correctly). It still listens on **8080**; keep the health check
  `GET /api/health` and the same environment variables.

Either builder works; the Dockerfile just pins Node 20 and the exact build steps.

---

## Environment variables (set these on Koyeb)

**Required**

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | *(Neon pooled string from Part A)* | Must end with `?sslmode=require` |
| `JWT_SECRET` | a long random string (32+ chars) | e.g. run `openssl rand -hex 32` |
| `ADMIN_EMAIL` | your admin login email | Seeds the first **super admin** |
| `ADMIN_PASSWORD` | a strong password | Change it after first login (Settings) |
| `NODE_ENV` | `production` | |
| `CORS_ORIGIN` | your Koyeb URL (and custom domain) | comma‑separated if more than one |

**Optional (enable features)**

| Key | Purpose |
|-----|---------|
| `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET` | Google reCAPTCHA v2 **Checkbox** keys (login + adaptive form captcha) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | forgot‑password + enquiry notification emails |
| `MAIL_FROM`, `MAIL_ADMIN` | "from" address and where enquiry alerts go |

> Don't set `PORT` manually — Koyeb provides it. Don't set `PGSSL` — SSL is auto‑enabled for Neon.

---

## First‑boot checklist

After the service is **Healthy**:

1. Visit the Koyeb URL → the homepage loads (no cold start — it stays awake).
2. Visit `/api/health` → returns `{"success":true,"status":"ok",...}`.
3. Go to `/admin/login.html` → sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
4. Open **Users** → confirm your account shows role **super**.
5. Submit a test enquiry on `/enquiry.html` → confirm it appears in **Admin → Enquiries**
   (this proves the Neon database read/write works).
6. **Change the admin password** in **Settings**.

---

## Custom domain + SEO note

- In Koyeb: **Settings → Domains → Add domain**, then create the `CNAME` record it shows at
  your registrar. Koyeb provisions free HTTPS automatically.
- After moving to a real domain, update the canonical URLs for SEO: find‑and‑replace
  `https://companywebsite-0o9u.onrender.com` with your new domain across the `*.html` files,
  `robots.txt`, and `sitemap.xml`, then resubmit the sitemap in Google Search Console.

---

## Costs & limits (free tiers, 2026)

- **Koyeb free:** one nano web service, always on (no sleep). Fine for this site.
- **Neon free:** persistent Postgres, ~0.5 GB storage, compute autosuspends when idle and
  resumes on the next query in ~1 second (so the *first* request after a long idle gap may be
  slightly slower — the app itself never sleeps).
- Both are free with no card for the base tiers; upgrade only if you outgrow them.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails "no package.json" | Work directory isn't set to `backend`. |
| App unhealthy / won't bind | Exposed port must be `8080`; run command `npm start`. |
| `DATABASE_URL is not set` warning / 500s | Add `DATABASE_URL`; use the **pooled** Neon string with `?sslmode=require`. |
| `no pg_hba.conf entry … no encryption` / SSL error | You're on an old build — the SSL auto‑detect in `database/db.js` fixes this; redeploy. |
| Can't log in | Confirm `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set; check logs for "admin seeded". |
| Captcha won't appear | It's adaptive — only shows after repeated failures; needs `RECAPTCHA_*` keys set. |

---

## Quick reference

```
Koyeb service
  ├─ Source:        GitHub → companywebsite (main)
  ├─ Builder:       Buildpack (Node)
  ├─ Work dir:      backend
  ├─ Build:         npm install
  ├─ Run:           npm start
  ├─ Port:          8080
  ├─ Health check:  GET /api/health
  └─ Env:           DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD,
                    NODE_ENV=production, CORS_ORIGIN  (+ optional RECAPTCHA_*, SMTP_*)

Neon
  └─ Pooled connection string → DATABASE_URL  (keep ?sslmode=require)
```
