# Seven Oaks British Nursery: Website + Admin

Bilingual (English / Arabic, true RTL) nursery website with an admin dashboard. Everything on the public site (text, images, menus, colours, fonts, SEO) is stored in the database and edited at `/admin`. Environment variables hold only infrastructure and secrets.

| Part | Folder | Tech | Runs on | Default local URL |
|---|---|---|---|---|
| **Frontend** (public site + admin dashboard) | `apps/web` | Next.js 14, Tailwind | Vercel | http://localhost:3000 |
| **Backend** (REST API, auth, content, media, email) | `apps/api` | NestJS, Prisma | Render | http://localhost:4000/api/health |
| **Database** (schema + first-run content) | `packages/db` | PostgreSQL | Neon | your Neon / local Postgres |

## Run it locally

**You need:** Node.js **20.6 or newer** ([nodejs.org](https://nodejs.org)) and a PostgreSQL database (a free Neon project, or Docker).

1. **Install**: unzip the project, open a terminal in the `sevenoaks` folder and run
   ```
   npm install
   ```
2. **Database**: pick one.
   - *Neon (recommended, nothing to install):* create a project at neon.tech, then copy **two** connection strings from the dashboard: the *pooled* one (host contains `-pooler`) and the *direct* one.
   - *Docker:* run `docker compose up -d`, and later use `postgresql://postgres:postgres@localhost:5432/sevenoaks` for **both** URLs.
3. **Settings file**: copy `.env.example` to `.env` (Mac/Linux: `cp .env.example .env`, Windows: `copy .env.example .env`) and edit these lines. Leave the others as they are.
   - `DATABASE_URL` and `DIRECT_URL`: the two strings from step 2.
   - `JWT_ACCESS_SECRET`: a long random text (32+ characters). Generate one with
     `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
   - `REVALIDATE_SECRET`: any random text, 16+ characters.
   - `SECRETS_ENCRYPTION_KEY`: another long random text (32+ characters), generated the same way as `JWT_ACCESS_SECRET`. It encrypts the Cloudinary and Resend keys you enter in the dashboard. Keep it safe: if you lose it you re-enter those keys.
   - `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`: **your** admin login (password 12+ characters).
4. **Create the tables**
   ```
   npm run db:migrate -- --name init
   ```
5. **Load the starter content and create your admin user**
   ```
   npm run db:seed
   ```
6. **Start everything**
   ```
   npm run dev
   ```
   (or `npm run dev:api` and `npm run dev:web` in two terminals)
7. **Open**
   - Website: http://localhost:3000 (English) and http://localhost:3000/ar (Arabic)
   - Admin: http://localhost:3000/admin, sign in with the email and password from step 3
   - Backend health check: http://localhost:4000/api/health

Always use `localhost` (not `127.0.0.1`) in the browser, otherwise login is refused by the security check.

**Something wrong? Run `npm run doctor`.** It checks Node, `.env`, the database and whether the services are running, and tells you what to fix.

**Try it:** Admin → Pages → Home → change the headline → *Save & publish* → reload the site. Admin → Theme → change the primary colour → *Save & publish*. Use the language button to see the Arabic version.

**Photos and email:** after signing in, open **Admin → Integrations** and enter your Cloudinary and Resend details (see "Integrations" below). Until then you can still show images by pasting a normal `https://…` image address in any image field.

| Problem | Fix |
|---|---|
| `Invalid environment configuration` | The message lists the exact `.env` lines to fix. |
| `@prisma/client did not initialize yet` | `npm run db:generate` |
| Site shows no content or a 404 | Backend not running, database not seeded (`npm run db:seed`), or `API_URL` wrong. Run `npm run doctor`. |
| Login says invalid, or error 403 | Open the site as `http://localhost:3000`. Check `CORS_ORIGINS` and `WEB_URL` are `http://localhost:3000`. |
| Edited a page but the site did not change | Pages show only what you **published**. Click *Save & publish*. |
| Port 3000 or 4000 already in use | Stop the other program, or change `PORT` (API) in `.env`; for the site run `npm run dev -w apps/web -- -p 3001` and set `WEB_URL`/`SITE_URL`/`CORS_ORIGINS` to that address. |
| Neon connection errors | Neon pauses idle free databases; retry after a few seconds. Use the strings exactly as copied (they include `?sslmode=require`). |
| Forgot admin password | Use *Forgot password?* on the sign-in page (needs Resend set up). Otherwise set a new `SEED_ADMIN_PASSWORD`, delete the user in `npm run db:studio` (table *User*), run `npm run db:seed` again. |
| Lost phone with 2FA on | Sign in with a recovery code, or ask another Super Admin: *Users → Reset 2FA*. |

Useful commands: `npm run db:studio` (browse the database), `npm run typecheck`, `npm run test -w apps/api` (unit tests), `npm run doctor`.

## Sample content and the admin dashboard

`npm run db:seed` fills the database with a complete 12-page site (English and Arabic): Home, About Us, Our Nursery, Learning, Classes, Inclusion, Parents, Gallery, Admissions, Contact, Parent Reviews and Privacy Policy, plus menus, footer, colours and fonts. It never overwrites anything you have edited.

- **Pictures.** The starter pictures are the nursery's own photographs (`apps/web/public/seed/p-*.jpg`) and its logo (`logo.png`). Replace any of them in the admin: Pages → open a page → the section's picture field → *Choose* (upload or pick from the library). Photos used in the Gallery are edited in Admin → Galleries.
- **Everything seeded is editable**, page by page and section by section (text in both languages, pictures, buttons, order, visibility), plus Settings (contact details, social links, announcement bar), Colours & fonts and Menus.
- **Replace these samples before launch:** phone number, email, address and opening hours (Settings → Contact details), the three "SAMPLE REVIEW" parent reviews (Pages → Home and Parent Reviews), the team names, and have a native Arabic speaker review the Arabic text.
- **Start over with fresh sample content** (this DISCARDS your edits to seeded pages): `npm run db:reset-content`.
- New section types: rich text, FAQ, team, steps, stats and contact box.

### Admin dashboard behaviour
- Header, footer and side menu stay fixed; only the content area scrolls.
- A **?** next to each label explains it on hover (or keyboard focus).
- Every save shows a pop-up saying it worked, or why it did not. Fields with problems are marked in red.
- If you change something and try to leave (menu, Back, closing the tab) you are asked whether to stay or leave without saving.

## How "nothing is hard-coded" works
- **Pages**: ordered sections with JSON config (EN/AR). Draft rows are edited in `/admin/pages`; **Publish** stores a versioned snapshot, which is what the public site reads. Restore any version into the draft.
- **Theme**: tokens (colours, fonts, sizes, radius, spacing) → CSS variables written in `<head>`. Tailwind uses only those variables.
- **Menus / settings** (contact, social, WhatsApp, announcement bar, maintenance mode): database rows.
- Publishing calls the site's `/api/revalidate`, so changes appear within seconds without a redeploy.
- `packages/db/prisma/content.ts` is only the **first-run data**. The seed never overwrites what you edit later.

## Deploy
**Render (API)**: use `render.yaml`, or create a Web Service with build `npm ci && npm run build:api` and start `npm run start:api` (runs `prisma migrate deploy`, then the server). Env: `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `SECRETS_ENCRYPTION_KEY`, `REVALIDATE_SECRET`, `CORS_ORIGINS`, `WEB_URL`, `NODE_ENV=production`. Cloudinary and Resend are **not** env variables: enter them in Admin → Integrations after the first sign-in.

**Vercel (web)**: import the repo, set Root Directory to `apps/web`, and enable "include files outside root directory". Env: `API_URL` (Render URL), `SITE_URL`, `REVALIDATE_SECRET` (same value as Render), `DEFAULT_LOCALE`.

**Before the first deploy, commit the `packages/db/prisma/migrations` folder** that step 4 above created (the API runs `prisma migrate deploy` on start and needs it). Run `npm run db:seed` once against the production database (locally, with the production `DATABASE_URL`/`DIRECT_URL` in `.env`) to create the first admin and the starter content.

## Integrations: Cloudinary and Resend (Admin → Integrations)
Nothing about these services lives in `.env`. You type the values in the dashboard; the API encrypts them (AES-256-GCM, key derived from `SECRETS_ENCRYPTION_KEY`) and stores them in the database. The browser only ever sees whether a secret is set and its last 4 characters. They can be changed at any time without redeploying.

**Cloudinary (images)**: copy *Cloud name*, *API key* and *API secret* from Cloudinary → Dashboard → API Keys, tick *Enabled*, **Save**, then **Test connection**.
**Resend (email)**: create an API key at resend.com, verify your sending domain, then enter the key and a From address on that domain, **Save**, then **Send test email to me**. Email is used for password-reset and user-invitation messages. If Resend is not set up, invitations show the link on screen instead so you can send it yourself.

## Media library
- `/admin/media`: upload JPEG/PNG/WebP/AVIF/GIF (no SVG). The server decodes the image, auto-rotates, **strips EXIF/GPS**, converts to WebP (max 2400 px) and uploads it to your Cloudinary account under a random id (the filename is never used). Cloudinary serves the optimised sizes (`f_auto,q_auto` and responsive widths), so pages get automatic `srcset`.
- Every `url` field in the page editor and settings has a **Choose…** button.
- Alt text in EN and AR. Usage tracking blocks deleting an image that a page or setting still uses; deleting also removes it from Cloudinary.
- **Child photos:** tick "Shows a child". Such a photo **cannot be published** until parental photo consent is recorded (who/where the signed form is kept). Withdrawing consent lists the pages to clean up.
- Upload size limit `MAX_UPLOAD_MB` (default 4, because Vercel limits proxied request bodies to about 4.5 MB).

## Users, 2FA and activity log
- **Users** (`/admin/users`): invite by email, change role, disable, delete, reset someone's 2FA, sign them out everywhere. Only a Super Admin can create or change Super Admins, you cannot demote or delete yourself, and the last active Super Admin is protected.
- **My account** (`/admin/account`): turn on two-step verification (authenticator app, QR code), 10 one-time recovery codes, change password (signs out other devices), sign out of all devices. Admins without 2FA see a reminder.
- **Activity log** (`/admin/audit`): every admin change (secrets redacted) and every sign-in attempt with IP and browser.
- Reset and invitation links are signed, single-use (they stop working after the password changes) and expire (1 hour / 72 hours).
- After upgrading an existing database: `npm run db:migrate -- --name security` (adds two columns to *User*), then `npm run db:seed` (adds the new `integration:*` and `user:*` permissions). On a fresh database the normal `init` migration already includes everything.

## SEO manager (Phase 2)
- **Per page** (Pages → edit): meta title/description in EN and AR with a live Google-style preview and length guidance, URL slug per language, social-share image (from the media library), optional canonical URL, `noindex`, and extra JSON-LD.
- **Automatic 301s:** when you change a *published* page's URL and publish, the old URL is redirected to the new one (chains are collapsed). **SEO → Redirects** lets you add your own (e.g. old-website links), disable or delete them.
- **Structured data:** the home page outputs `Preschool` (or `ChildCare`) LocalBusiness data built from Settings (`public.contact`, `public.social`, `public.schema`: address, geo, opening hours). Other pages output BreadcrumbList. Fill in `public.schema` and `public.contact` for local-search benefit.
- **hreflang** for EN/AR plus `x-default`, canonical, Open Graph and Twitter cards. Default share image and Twitter handle are in `public.seoDefaults`.
- **Analytics (GA4 / Tag Manager / Meta Pixel):** set the IDs in Settings → `public.analytics`. Scripts are loaded **only after the visitor clicks Accept** on the cookie banner (text editable in `public.cookies`). If a GTM ID is set, GTM is loaded and GA4 is not loaded separately (configure GA4 inside GTM). No IDs means no banner.
- **SEO overview** (SEO page) lists every page's title/description lengths per language and what needs attention.
- After upgrading an existing database: `npm run db:migrate -- --name seo` (adds one column), then `npm run db:seed` (adds the new `seo:*` permissions and the new settings keys).

## Security in this phase
- Argon2id passwords, lockout after repeated failures, login history, timing-equalised failures.
- 15-minute JWT in an httpOnly cookie, rotating refresh token (hashed in DB; reuse revokes all sessions).
- Browser calls same-origin `/api/*`, which Next proxies to Render (first-party cookies). CSRF Origin check on every write.
- Server-side RBAC (`@Secured('page:update')`), global rate limiting, stricter on login.
- Zod validation on every input. Theme values are checked so they cannot break out of the `<style>` tag. `javascript:` and `data:` URLs are rejected.
- Optional TOTP 2FA with replay protection and hashed recovery codes; integration keys encrypted at rest; audit log for every admin write (secrets redacted). Helmet, CSP, HSTS, X-Frame-Options, Referrer-Policy.
- Env validated at boot (the API refuses to start with weak or missing secrets).

## Upgrading an existing database (read this first)

```bash
npm install
npm run db:generate
npm run db:migrate -- --name trust_leads_notifications   # adds Testimonial, Notification, TranslateUsage, VerificationCode, EmailTemplate, ConsentLog tables + new Enquiry columns
npm run db:seed        # adds missing settings, permissions, legal pages and 3 SAMPLE testimonials. Never overwrites your edits.
npm run db:reset-content   # OPTIONAL: re-seeds all pages, including the NEW trust-focused homepage. DISCARDS edits to seeded pages.
# Note: existing sites keep their old homepage until you run db:reset-content (or add the new blocks yourself in Admin → Pages → Home).
```

## Logo management (Admin → Settings → Branding)

Upload the logo once. It is stored in the single `public.branding` setting and read everywhere: website header, footer, mobile menu, admin login/forgot/reset pages, admin top bar, side drawer, browser tab icon, and email templates (invite, reset, test). A separate "logo for dark backgrounds" is optional; without it the logo sits on a white chip. Email clients need a raster image, so SVG logos are skipped in emails.

## Profile photo (Admin → My account)

Upload, drag/zoom to crop, remove, and edit name and phone. Shown in the top bar, account page, users list and activity log. Needs Cloudinary configured (Integrations).

## Animations

Framer Motion (LazyMotion, small bundle), Lenis smooth scroll, CSS page-enter plus exit fade and progress bar on navigation, scroll reveals, staggered cards, split-text hero, parallax, floating shapes, counters, 3D card tilt, animated testimonials and CTA, shimmer loading skeleton. Honours "reduce motion" and is lighter on touch devices. GSAP was deliberately not added: Framer Motion covers every effect and GSAP would cost bundle size and PageSpeed.

## Translation (Google Translate)

1. Google Cloud Console → create/select a project → enable **Cloud Translation API** (billing must be on; there is a free monthly quota).
2. APIs & Services → Credentials → Create API key → restrict it to *Cloud Translation API*.
3. Admin → Integrations → Google Translate → paste key → Save → **Test connection**.

Then in any text field, type English and press **Translate to Arabic**; or use **Translate missing Arabic** per section, per page, or per settings card. Arabic is never overwritten if you edited it by hand (marked manual). Auto-translated text shows an "auto-translated, please review" badge. If you change the English later, the field warns that Arabic may be stale and offers **Re-translate**. Translation is not automatic while typing (to avoid cost and half-finished sentences); it is one click.

## Google Maps (Admin → Settings → Map & directions)

1. Cloud Console → enable **Maps JavaScript API** → create an API key → restrict by *HTTP referrers* (your domain) and to that API.
2. Paste the key, then either type latitude/longitude or paste any Google Maps link into "Find location from link".
3. Set zoom and marker label.

The contact page shows a styled interactive map with zoom, fullscreen, a pulsing branded marker and a Get directions button. With no key it falls back to a standard Google embed of the same coordinates.

## Image management guide

Each image field shows a live preview in the exact frame shape used on the page. You control: **focal point** (drag the dot to the part that must never be cropped), **fit** (cover/contain), **frame shape**, **alt text and caption in EN/AR**, and optional **phone and tablet versions** (a different crop for small screens). Sections have layout options: text-image has image side (left/right), size, height and style; hero has alignment, overlay and height; banner and CTA have position/alignment. Use **Preview** on the page editor to see Computer/Tablet/Phone, English/Arabic, before publishing. Limitation: placement is by these controls and section reordering with arrows, not free drag-and-drop of images across the page (the drag is the focal point).

## Analytics (Admin → Analytics)

Built in, first-party, cookieless: live visitors (last 5 min), visitors, page views, time on site, pages per visit, daily chart, top pages, sources, referring sites, devices, countries, languages. Anonymous, no IP stored, robots and Do-Not-Track ignored. Country needs your host to send a country header (Vercel/Cloudflare do). Optional: add GA4 ID / GTM ID and the Search Console verification code in Settings → Analytics, then submit `/sitemap.xml` in Search Console. GA4 and Search Console reports are viewed in Google's own tools; their data is not pulled into this dashboard.

## SEO completion checklist

- [x] Per page title, description, keywords (EN/AR), slug, noindex, share image: editable in Pages and Search (SEO)
- [x] Open Graph + Twitter cards, canonical and hreflang alternates
- [x] sitemap.xml and robots.txt (admin and preview excluded)
- [x] JSON-LD: Organization/LocalBusiness (with map coordinates), WebSite, breadcrumbs
- [x] Alt text per image with EN/AR; SEO page flags missing keywords, descriptions, share pictures
- [x] Search Console verification tag, GA4/GTM from settings
- [ ] You: submit sitemap, verify domain, add real photos/reviews, check titles under 60 and descriptions under 160 characters

## Performance report

Static admin pages, dynamic public pages cached with on-demand revalidation on publish, Cloudinary f_auto/q_auto images with `<picture>` phone/tablet sources, lazy images, lazy-loaded map and animation features, shared JS about 87 kB. Not measured: a real PageSpeed score needs a deployed URL; run it after deploying and tell me the numbers.

## Security report

Unchanged: encrypted integration secrets (AES-256-GCM, including the Translate key), 2FA, RBAC, CSRF origin guard, audit log with redaction, rate limits, zod validation on every input, CSP. New: avatar upload is re-encoded to WebP (no raw upload kept), 5 MB cap, throttled; translate endpoint is permission-gated, capped and throttled; analytics collector is rate limited, validates input, stores no IP, and is the only CSRF-exempt route (it only accepts anonymous page-view data); Maps key is a public browser key and must be referrer-restricted.

## Honest notes

Verified here: type checks, API tests, production web build, and visual checks of the homepage (EN, AR, mobile), Preview, and the new admin pages (leads, testimonials, email templates, translation usage, legal, activity log, notification bell) against a mock API. NOT verified here (needs your real services): any database flow (enquiry submit, leads, testimonials, notifications, codes, translation counters, consent log), emailed codes, the `/m/` image proxy and hotlink blocking in production, document uploads to Cloudinary, uploads larger than ~4.5 MB through Vercel, SEO results in Google/Bing/AI tools, and: database flows (avatar, analytics collection, translate), real Google Translate/Maps, Cloudinary, Resend, and the tracking beacon in production. Seed images are illustrations; replace with real photos.

## Trust-focused homepage, leads, testimonials (this release)

**Homepage** order: split hero, trust numbers, welcome, child safety, learning through play, teachers, facilities mosaic, programmes, parent reviews, polaroid gallery, FAQ, admissions call-to-action, enquiry form. Every block is editable in Admin → Pages. Wrap a word in `*stars*` in a heading to underline it by hand. **The trust numbers (10+ years, 100%, 1:6, 24/7, 98%), the three testimonials and the teacher names are SAMPLES. Replace them with true figures before launch; do not publish numbers or licences you cannot prove.**

**Animations** now replay every time a block scrolls into view (reusable `Reveal`, `Stagger`, `SplitText`, `CountUp` in `components/motion`, built on Framer Motion's IntersectionObserver). Reduced-motion users get no animation.

**Enquiries & leads** (Admin → Enquiries & leads): website form → consent tick required → saved, you are notified, parent gets an auto-reply (Email templates). Status pipeline, assignee, follow-up date, notes, CSV export (formula-injection safe), "send admissions info", and "erase this person's data". Form fields, programmes, recipients and routing rules are in Admin → Enquiry form. Footer newsletter sign-up also stores consent.

**Testimonials** (Admin → Testimonials): add/edit/delete, parent photo, child name, stars, approval (pending → approved → hidden), featured, and which pages show them (home, about, testimonials). A "Parent reviews" block must be set to *From Admin → Testimonials* and its place chosen.

**Notifications**: bell in the admin header (unread count, read/clear). It polls every 30 s and when you return to the tab. It is *not* a websocket, so "real time" means within about 30 seconds. Events: enquiries, leads, uploads that fail, translation quota alerts, publishes, sign-ins, lock-outs and security changes.

**Activity log**: avatar, name, role, sentence, time and a before/after table for settings and page edits; filter by action. Passwords and secrets are redacted.

**Account security**: email change needs a code sent to the *current* address and then to the *new* one. Password change needs your current password plus an emailed code, and signs other devices out. Both need Resend to be connected (Integrations). 2FA (authenticator app) was already available.

**Email templates** (Admin → Email templates): welcome, enquiry received, admissions info, password reset, verification codes, newsletter. Edit English and Arabic text, insert `{{variables}}`, change brand colours / footer / social links, preview desktop and mobile live, send a test.

**Translation usage** (Admin → Translation usage): characters today / 7 days / month, remaining quota, estimated cost, daily chart, history, limits, and alerts at 80 / 90 / 100 %. It counts what *this site* sent to Google; Google Cloud remains the official bill.

**Legal & privacy** (Admin → Legal & privacy): Privacy, Cookie, Terms, Data Protection and Data Retention are normal pages with version history; publish / unpublish from one screen; cookie-consent summary. The wording is a **template, not legal advice**: have a UAE lawyer review it (Federal Decree-Law 45/2021). Consent is stored with an anonymous random ID only; visitors can reopen "Cookie settings" from the footer.

**Bilingual enforcement**: on Settings, Pages, Menus, Email templates, Enquiry form and Testimonials, Save is disabled while any English text has no Arabic (or the Arabic is older than the English). Leaving the screen warns that the translation is incomplete. "Translate" fills the gaps (counts against your quota); review the Arabic yourself.

**Uploads**: up to 10 MB (`MAX_UPLOAD_MB`), real file contents are checked (not the name), JPG/PNG/WebP/AVIF/GIF photos and PDF/DOCX/XLSX/PPTX documents, multi-file drag-and-drop with a progress bar per file and plain error messages. HEIC (iPhone) and SVG are refused with an explanation. PDFs go to Cloudinary as "raw" files; if a PDF link returns 401, enable *Settings → Security → PDF and ZIP files delivery* in Cloudinary.

**Image protection** (Settings → Image protection): pictures are served through opaque `/m/…` links, other websites cannot embed them (Referer / Fetch-Metadata check), and right-click, drag, Ctrl+S/Ctrl+P can be disabled; an optional text watermark is added to large pictures. This only stops casual copying: anyone can screenshot or download what their browser shows. Trade-off: protected pictures are `Cache-Control: private`, so they are cached in the visitor's browser but not on a shared CDN. Social-share (Open Graph) images stay as normal links so WhatsApp/Facebook previews work.

**SEO / AEO / GEO**: canonical + hreflang, sitemap with last-modified, robots.txt that names AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Bingbot…; switch off in Settings → Default sharing picture → *Block AI search*), `/llms.txt` summary of your pages and FAQs, JSON-LD for Preschool/LocalBusiness (`@id`, address, geo, languages, programmes, `sameAs`), WebSite, WebPage/AboutPage/ContactPage, BreadcrumbList and **FAQPage** generated from every "Questions & answers" block. No review/rating markup is emitted (Google forbids self-published review stars). Nobody can guarantee a ranking: fill in the Google local-business settings, real photos, real reviews, Google Business Profile and Search Console / Bing Webmaster verification.

**Skeleton loading**: admin pages and the public site show shaped, shimmering placeholders; leads, testimonials and notifications update instantly (optimistic) and roll back with a message if the server refuses.

**Preview** was blank because the preview page did not load the animation provider, and the security headers blocked the preview frame. Both are fixed.

## Not built yet (planned phases)
Video uploads, events, news, a true websocket push for notifications, nonce-based CSP, more tests.

## Upgrade: analytics with visitors, follow-up emails, usage meter, photo placement

1. Replace the project files, then `npm install`.
2. `npm run db:generate`
3. `npm run db:migrate -- --name visitors_campaigns_usage` (adds Visitor, EmailOptOut, Campaign, CampaignRecipient, ApiUsage and two PageView columns).
4. `npm run db:seed` (adds the new permissions and the MARKETING role; safe to re-run).
5. Optional: `npm run db:reset-content` to load the new Admissions page and updated privacy wording. This replaces page content, so only do it if you have not edited pages.
6. `npm run dev`.

Checks after deploying: in Render set `WEB_URL` to the public website address and make `REVALIDATE_SECRET` identical on Render and Vercel. The dashboard card "Website connection" shows whether the API can refresh the website, and has a "Refresh website now" button.

Google Maps: use a browser key restricted to your website (HTTP referrers) and the Maps JavaScript API only. Billing must be enabled in Google Cloud even for the free allowance. Keep Translation on a separate server key.

## Upgrade: nature theme, galleries, detail pages, roles, email designer, stable sign-in

1. `npm install`, then `npm run db:generate`.
2. `npm run db:migrate -- --name entries_galleries` (adds the `Entry` table used by galleries, categories and detail pages).
3. `npm run db:seed`. This is safe to repeat. It syncs roles exactly to `packages/db/prisma/content.ts` (adds **Viewer**, new `entry:*`, `email:*` and `campaign:*` permissions; **Admin** no longer has `integration:*` or `audit:read`; **Editor** no longer has `page:publish`) and creates the starter galleries and the seven Quick Link detail pages **only if no entries exist yet**.
4. Existing pages are never overwritten. To get the new Gallery, Parents (Quick Links → detail pages), Learning (Ephatha) and Home (oak scene) content, run `npm run db:seed -- --reset-content --yes-overwrite` (discards page edits), or add the blocks by hand: Admin → Pages → *Add block* → "Oak grove scene" / "Galleries / detail pages".
5. In your `.env` set `ACCESS_TTL_MIN=30`, `REFRESH_TTL_DAYS=30` (sign-in stability) and keep `REVALIDATE_SECRET` + `WEB_URL` set.

**Where things are in Admin:** Galleries, Gallery categories, Detail pages (Website content) · Roles & permissions (next to Users) · Follow-up emails → step 3 "Design the look" · every block has a "Decoration" setting (branch, falling leaves, birds, acorns) · Oak grove scene is a new block type.

**Sign-in:** tick "Don't ask for a code on this browser for 30 days" at the 2-step prompt. The session now refreshes quietly in the background; short network drops never sign you out; unsaved work is kept as a draft on the device and listed on the dashboard.

**Ephatha:** the Learning page text only repeats what ephatha.ae states (a speech and occupational therapy centre in Dubai). Edit it in Admin → Pages → Learning if the client wants other wording.


## Upgrade notes: video sound, Ephatha, map, Director (latest)

1. `git pull` / replace files, then `npm install`, `npm run db:generate`, `npm run db:migrate -- --name entries_galleries` (only if you have not run it yet).
2. `npm run db:seed` is safe to re-run. It never overwrites your edits, and it will: add the **Ephatha** partner block to Learning, turn the **Contact map** on, show the **first team member (Director) large with a message**, replace the old scenery block on Home with the full-width banner, and add the galleries list.
3. Redeploy the web app. The Content-Security-Policy now allows direct video uploads to Cloudinary (`connect-src https://api.cloudinary.com`); without this redeploy, uploads fail with "The video upload was interrupted".
4. Video with sound: in any image/video picker choose either *Show the video player* (viewer controls volume) or *Play on a loop with a sound button* (muted autoplay + speaker button).
5. Birds, falling leaves and fruit animations, italics and underlines were removed everywhere.
6. Map: set latitude/longitude in Admin → Settings → Map & directions. If empty, the contact address is used.
7. Director: Admin → Pages → About Us → Team → tick *Show this person first, large* and write the message.


## Starter content from the nursery's own documents (Parent Handbook, Policies, photos)

The starter content (text in English and Arabic, classes, hours, fees, policies, galleries and photos) now comes from the nursery's Parent Handbook, Policies and photo library. Everything remains editable in the admin dashboard.

To load it into a database that still has the earlier sample content:

1. `npm run db:generate` (only if the schema changed), then
2. `npm run db:seed -- --reset-content --yes-overwrite`

**Warning:** `--reset-content` replaces every page, menu, theme and public setting (and the gallery/detail pages) with the starter content, so edits made in the admin are lost. User accounts, enquiries, subscribers and uploaded media are not touched. After a reset, re-enter the e-mail recipients in Admin → Enquiry form. A normal `npm run db:seed` (without the flag) never overwrites edits.

Please have the nursery check: the Arabic wording (first draft translation), the fees (shown as printed in the 2025–2026 handbook), the notice period for withdrawing (the handbook and policies give different periods, so the site only says "written notice is required"), the WhatsApp number (add it in Settings → Contact details), the Principal's photo and any other staff, and the map pin (Settings → Map & directions).

## Update notes (detail pages, green theme, policies)

1. **Migrate once:** `npm run db:migrate -- --name entry_blocks` (adds `path`, `blocks`, `design` to entries).
2. **Receive the new content safely:** `npm run db:update`. This keeps everything edited in the admin (staff, map, contact, menus, settings, custom colours). It only refreshes pages nobody has saved, adds photos to icon blocks that have none, creates missing detail pages and policies, adds designed blocks to plain detail pages, and switches the theme to green only if it is still the blue default. Pages you edited are listed as "kept as is". (`--reset-content --yes-overwrite` still exists but wipes your edits; avoid it.)
3. **Detail page folder:** Admin → Detail pages → *Folder (URL)*. Choose `parents` to get `/parents/uniform-and-belongings`. Old `/info/...` links redirect automatically.
4. **Designed detail pages:** each detail page has a *Page blocks* editor (same blocks as normal pages) plus a *Design* box (banner / split / simple hero, badge, back button, parent label). The **Table** block holds timetables and lists (one row per line, cells separated by `|`, per language) and the **Callout** block holds tips and notices. No fees are published anywhere.
5. **Photos instead of icons:** every item in Feature grid, Icon row, Trust bar, Safety and Steps blocks has an optional photo; if empty the icon is shown.
6. **FAQ links:** each FAQ item has an optional link button, and answers accept `[text](/path)` links, shown in the link colour (blue, underlined).
7. **Colours & fonts:** Admin → Colours & Fonts has presets, font dropdowns and the fun colours (sunny, sky, coral, berry). Default is the logo green.
8. **Policies:** Privacy, Cookie, Terms, Data Protection and Data Retention are editable in Admin → Pages. They are drafted on UAE PDPL principles; have a legal adviser review them once and fill in the nursery's data contact.

## Updating without losing your data
Your staff, map, pages, menus, settings and colours live in the **database**, not in the zip. Unzipping new code over the project never changes them. Only these commands touch content:
- `npm run db:migrate -- --name entry_blocks` (adds new columns, keeps all rows)
- `npm run db:update` (safe: skips every page that was saved in the admin)
- `npm run db:seed` (only creates what is missing)
Never run `db:reset-content` or `--reset-content --yes-overwrite` on a live site. Keep your own `.env` (the zip has none).

## Search and AI visibility (SEO, AEO, GEO)
See Admin → SEO for titles, descriptions, share image, AI-crawler switch and schema. Launch tasks: set `SITE_URL`, real phone/email/map pin, Google Business Profile, Search Console + Bing sitemap submission, real reviews, matching name/address/phone on all listings.
