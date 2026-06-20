# Deploying to Vercel — Step-by-Step Guide

## First, the important bit (read this once)

Your project has **two parts**:

| Part | What it is | Runs on Vercel? |
|------|-----------|-----------------|
| **The website** (`*.html`, `assets/`, `admin/*.html`) | Static files | ✅ Yes — perfectly, free |
| **The backend** (`backend/` — Express + SQLite) | A long-running server with a database file | ❌ No — Vercel is serverless and has **no permanent disk**, so SQLite data would be wiped |

So the plan is:
1. **Website → Vercel** (free, 5 minutes).
2. **Backend + admin → Render.com** (also free) — because the admin dashboard and saved enquiries need a real server with a database.
3. **Connect them** with one line of config.

If you only want the marketing site live *today* and don't need the admin dashboard yet, just do **Part 1** — the forms will still validate and show a success message (they just won't store data or email until the backend is connected).

---

## Part 1 — Put the website on Vercel

### Option A — GitHub (recommended, gives auto-deploys)
1. Create a free account at **https://vercel.com** (sign in with GitHub).
2. Put this project on GitHub:
   - Install Git, then in the `company-website` folder run:
     ```bash
     git init
     git add .
     git commit -m "Initial website"
     git branch -M main
     git remote add origin https://github.com/<you>/company-website.git
     git push -u origin main
     ```
3. In Vercel: **Add New → Project → Import** your `company-website` repo.
4. Framework Preset: **Other**. Root Directory: **`./`** (leave default). Build Command: **leave empty**. Output Directory: **leave empty**.
5. Click **Deploy**. In ~30 seconds you get a URL like `https://company-website-xxxx.vercel.app`.

> Every future `git push` auto-deploys. `vercel.json` (already included) adds security headers automatically.

### Option B — No GitHub (drag & drop via CLI)
1. Install Node.js, then:
   ```bash
   npm i -g vercel
   cd company-website
   vercel            # first run: log in + answer the prompts
   vercel --prod     # publish to your live URL
   ```
   Accept the defaults (no build, output = current dir).

### Your pages once live
- Home: `https://your-site.vercel.app/index.html` (or just `/`)
- Services: `/services.html`, About: `/about.html`, Enquiry: `/enquiry.html`, etc.
- Admin login: `/admin/login.html`  ← **won't work until Part 2 + 3 are done**

---

## Part 2 — Put the backend + admin on Render (free)

Vercel can't run the Express/SQLite server, so host it on **Render** (free web service).

1. Push the project to GitHub (same repo is fine).
2. Go to **https://render.com** → sign up → **New → Web Service** → connect your repo.
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run init-db && npm run create-admin`
   - **Start Command:** `npm start`
4. Add **Environment Variables** (from `backend/.env.example`):
   - `JWT_SECRET` → a long random string. Generate one:
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `ADMIN_EMAIL` → your admin login email
   - `ADMIN_PASSWORD` → a strong password (this becomes your admin password)
   - `CORS_ORIGIN` → your Vercel URL, e.g. `https://your-site.vercel.app`
   - `NODE_ENV` → `production`
   - SMTP vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_ADMIN`) → from your email provider (e.g. Gmail App Password, SendGrid, Mailgun). Leave blank to skip emails for now.
5. Deploy. Render gives you a URL like `https://company-api.onrender.com`.

> ⚠️ **Free-tier note:** Render free services sleep after inactivity (first request after sleep is slow) and the SQLite file resets when the service is redeployed. That's fine for testing. For real persistence, add Render's free **PostgreSQL** or a free **Turso** (SQLite-cloud) database later — ask me and I'll convert the data layer.

---

## Part 3 — Connect the website to the backend

Tell the Vercel site where the API lives. Edit these four pages — `enquiry.html`,
`contact.html`, `partners.html`, `careers.html` — and add ONE line just before
`</head>` (use your real Render URL):

```html
<script>window.SITE_CONFIG = { apiBase: "https://company-api.onrender.com/api" };</script>
```

Commit and push (Vercel redeploys automatically). Now form submissions go to your
backend, get stored, and trigger emails.

---

## Part 4 — Accessing the admin dashboard

You have two equally valid URLs:

**A. Through your Render backend (simplest — the server already serves the admin UI):**
```
https://company-api.onrender.com/admin/login.html
```

**B. Through your Vercel site:**
```
https://your-site.vercel.app/admin/login.html
```
(For B, the `SITE_CONFIG` line from Part 3 must also be added to the admin pages, OR
just use URL A. The admin pages call the API, so they need to know its address.)

**Login credentials** = the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in Render's
environment variables in Part 2. To change the password later, update those env
vars and redeploy (the build re-runs `create-admin`).

Once logged in you get:
- **Dashboard** — totals, new enquiries, in-progress, conversion rate, status & service charts
- **Enquiries** — search, filter, sort, change status, delete, export CSV

### Security reminders for the admin page
- The admin URL isn't secret-protected by obscurity — it's protected by the login
  (JWT in an httpOnly cookie, bcrypt-hashed password, rate-limited to 10 attempts/15 min).
- Always use a **strong, unique** `ADMIN_PASSWORD`.
- `robots.txt` already disallows `/admin/`, and admin pages are `noindex`.
- Keep `JWT_SECRET` private and long.

---

## Quick decision helper

- **"I just want the site online now."** → Part 1 only.
- **"I want working enquiry storage + admin."** → Parts 1–4.
- **"I don't want a second host at all."** → Use a free form service (Formspree /
  Web3Forms) for submissions and skip the custom backend — but you'll lose the
  built-in admin dashboard (it needs the custom API/database). Tell me and I'll wire
  the forms to Formspree instead.
