# How to change the company name & logo

A non-technical guide to rebrand this website yourself. Do everything in a free
editor like **VS Code** (https://code.visualstudio.com), opened on the
`company-website` folder.

After any change: **save → commit → push** (bottom of this file).

---

## 1. Change the company NAME  (easiest — one find & replace)

The placeholder name is `[Company]`. It appears in 140+ places — the visible
logo text, page titles, social-share tags, structured data, and the app manifest.
Replace them all at once:

1. In VS Code press **Ctrl+Shift+H** (Edit → Replace in Files).
2. **Make sure the `.*` "Use Regular Expression" button is OFF** (so the square
   brackets are treated as plain text).
3. **Search:** `[Company]`
4. **Replace:** your real name, e.g. `VNT Security`
5. Click **Replace All**.

That's it — the name updates everywhere (header, footer, titles, Google/SEO tags,
social previews, manifest).

> Tip: pick the name **without** the word "Security" if your tagline already says
> it (see next step), e.g. name = `VNT` + tagline = `Security` → shows "VNT Security".

---

## 2. Change the small TAGLINE next to the name

The word under/after the name (currently "Security" on the public site, "Admin" in
the dashboard) lives in `<small>…</small>`.

- Public site tagline — Replace in Files:
  **Search:** `<small>Security</small>`  →  **Replace:** `<small>Your Tagline</small>`
- (Leave the admin one — `<small>Admin</small>` — as is.)

---

## 3. Change the LOGO

The logo is a small inline shield icon (SVG) shown top-left on every page and in
the footer. To use **your own** logo image:

1. Put your logo file in the `assets` folder, e.g. `assets/logo.svg` (or `assets/logo.png`).
   A **square** logo works best.
2. In each HTML file, find this block (it's the same everywhere):
   ```html
   <span class="mark" aria-hidden="true"><svg ... >…</svg></span>
   ```
   and replace the **`<svg>…</svg>` part inside** with:
   ```html
   <img src="/assets/logo.svg" alt="Company logo" style="width:100%;height:100%;object-fit:contain">
   ```
   It appears about **twice per page** (header + footer), across the 9 public pages
   and the admin pages.

> Don't want to edit it in every file? Ask me to **centralise the logo** — I can make
> it load from a single file, so next time you just drop a new `assets/logo.svg` and
> you're done. (Recommended.)

---

## 4. Change the FAVICON (the little icon in the browser tab)

In each page's `<head>` there's a line starting with `<link rel="icon" href="data:image/svg+xml,…">`.
Replace it with a file:
```html
<link rel="icon" href="/assets/favicon.svg">
```
and put your icon at `assets/favicon.svg` (or use a `.ico`/`.png`).

---

## 5. Replace the social-share image & app icons

These image files have the old name **drawn into them**, so find-and-replace won't
touch them — swap the files themselves:

- `assets/og-image.png` — the link-preview image (1200 × 630 px) shown when the site
  is shared on WhatsApp / LinkedIn / X.
- `assets/icon-180.png`, `assets/icon-192.png`, `assets/icon-512.png` — the
  phone home-screen / PWA icons (square).

Replace each with your own same-size image, **or** ask me to regenerate them with
your new name/logo (quickest).

---

## 6. Save → commit → push (publish your changes)

In a terminal, from the `company-website` folder:
```bash
git add -A
git commit -m "Rebrand: new company name and logo"
git push
```
Your host (Render) redeploys automatically. Then **hard-refresh** the site
(Ctrl+F5, or pull-to-refresh on mobile) to see the changes.

---

## Quick checklist

- [ ] Replace `[Company]` → your name (Step 1)
- [ ] Update the `<small>` tagline (Step 2)
- [ ] Swap the logo (Step 3)
- [ ] Swap the favicon (Step 4)
- [ ] Replace `og-image.png` + `icon-*.png` (Step 5)
- [ ] commit & push (Step 6)
- [ ] Hard-refresh to verify
