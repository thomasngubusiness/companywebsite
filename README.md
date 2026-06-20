# [Company] Security — Corporate Website

> **Deploying to Vercel?** See **[VERCEL-DEPLOY.md](VERCEL-DEPLOY.md)** for a step-by-step guide (static site on Vercel, backend + admin on Render, and how to log into the admin dashboard).

A premium, production-ready cybersecurity company website with a Liquid Glass
(glassmorphism) design language, a Node.js + Express backend, an enquiry/lead
system with email notifications, and a secure admin dashboard.

> **Brand placeholder:** the wordmark `[Company]` is used throughout. Replace it
> site-wide with your real company name (find & replace `[Company]`), and swap the
> placeholder contact details (`example.com`, phone `+60 3-1234 5678`, the office
> address in `contact.html`).

## Structure
```
company-website/
├── *.html                     # 9 public pages (home, services, about, careers,
│                              #   partners, contact, enquiry, privacy, terms)
├── assets/css|js|images|...   # Liquid Glass design system + scripts
├── admin/                     # login, dashboard, enquiries (secure portal)
├── backend/                   # Express API, SQLite DB, auth, email
├── robots.txt, sitemap.xml    # SEO
```

## Quick start (full stack — recommended)
The Express server serves BOTH the API and the static site from one origin, so
forms work with no extra configuration.

```bash
cd company-website/backend
cp .env.example .env          # then edit secrets (JWT_SECRET, SMTP_*, ADMIN_*)
npm install
npm run init-db               # create the SQLite schema
npm run create-admin          # seed the admin user from ADMIN_EMAIL/PASSWORD
npm start                     # http://localhost:4000  (site + /api + /admin)
```
- Generate a strong JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Admin login: `http://localhost:4000/admin/login.html`

## Static-only hosting (Apache / Nginx / shared hosting / CDN)
You can host the HTML/CSS/JS anywhere. Deploy the backend separately (e.g. a VPS),
then tell the front-end where the API lives by adding this **before** the closing
`</body>` on `enquiry.html`, `contact.html`, `partners.html`, `careers.html`:

```html
<script>window.SITE_CONFIG = { apiBase: 'https://api.yourdomain.com/api' };</script>
```
Set `CORS_ORIGIN` in the backend `.env` to your site origin.
> Without a backend, the forms still validate and show a success state (graceful
> demo fallback) but won't persist data or send email.

### Apache (`.htaccess` example for the site root)
```apache
Options -Indexes
ErrorDocument 404 /index.html
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "DENY"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

### Nginx (static + API proxy)
```nginx
server {
  listen 80; server_name www.example.com;
  root /var/www/company-website; index index.html;
  location / { try_files $uri $uri.html $uri/ =404; }
  location /api/   { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; }
  location /admin/ { try_files $uri $uri/ =404; }
}
```
Run the Node backend under a process manager: `pm2 start server.js --name company-api`.

## Email notifications
On each submission the backend emails (1) an **admin** notification with full
details and (2) a **customer** confirmation containing the reference number and
expected response time. Configure SMTP in `.env` (`SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_ADMIN`). If SMTP is unset, submissions
are still stored; email is skipped with a log warning.

## Security
- **Helmet** secure headers + Content-Security-Policy
- **JWT** httpOnly cookie auth for admin; bcrypt password hashing (cost 12)
- **CSRF** double-submit token on state-changing admin routes
- **Rate limiting** on submissions (8/15min) and admin login (10/15min)
- **Input sanitization** + **parameterized SQL** (SQL-injection safe)
- Honeypot field + output escaping (XSS mitigation)

## Database
SQLite (`backend/database/enquiries.db`). Schema in `backend/database/schema.sql`.
`enquiries` table fields: enquiry_id, reference, created_at, full_name, company_name,
email, phone, country, industry, company_size, service, contact_method, meeting_date,
budget, timeline, project_description, source, ip, status.
Status values: New · Contacted · In Progress · Proposal Sent · Closed.

## Admin dashboard
`/admin/login.html` → dashboard (totals, new, in-progress, conversion, status &
service breakdown) and an enquiries table with search, status filter, sort, inline
status updates, delete, and CSV export.

## Performance & SEO
Single external font, system-ui fallback, deferred scripts, CSS variables, no heavy
frameworks, lazy reveal via IntersectionObserver, `robots.txt` + `sitemap.xml`, Open
Graph tags and per-page meta. Minify CSS/JS before production for best Lighthouse scores.
