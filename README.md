# Studio site

Marketing site for Stuart Rainey and Evelyn Nunez's web and growth studio (Australia), with a working enquiry inbox. The name "Built & Booked" is a placeholder: change it in `src/data/site.ts`.

- **Public site** (`/`): one page, server-rendered. The cost-per-client calculator uses published benchmarks (`src/data/benchmarks.ts`), each cited on the page.
- **Enquiries** (`POST /api/enquiry`): checked, saved to `enquiries.json` on the data volume, then emailed to the studio through Resend. Reply-To is the person who enquired. Nothing is emailed to them, so the form can't be used to send mail to strangers.
- **Admin** (`/admin`): sign in to read enquiries with the visitor's calculator numbers, mark them replied, and see whether the "reply within one business day" promise is being kept.

Conventions: [`CONVENTIONS.md`](CONVENTIONS.md), which links to `rainey-stack`.

## Run

```bash
npm install
npm run dev        # http://localhost:3220, admin at /admin
npm test           # calculator maths, enquiry checks, store, reply-time rule, email alert, auth
npm run typecheck
```

First admin account (asks for a 12+ character password):

```bash
npm run admin:user -- add --email you@example.com --name "Your name"
```

## Deploy (Railway)

One project, one service, in Singapore (closest region to Australia), like DrMarshllow.

1. New Railway project from this repo. `railway.json` builds with Railpack, runs `npm start`, health-checks `/api/health`, and **requires a volume at `/data`**: without it the deploy fails, so enquiries can't land on a disk that's wiped on every redeploy.
2. `railway scale asia-southeast1-eqsg3a=1`, then add the volume at `/data`.
3. Variables (see `.env.example`): `ADMIN_DATA_DIR=/data`, `ADMIN_COOKIE_SECRET`, `SITE_URL`. Without the secret, `/api/health` answers 503 and the deploy shows as failed.
4. Create your accounts on the server: `railway run npm run admin:user -- add --email … --name …`.
5. Email alerts: verify the studio's domain in Resend, then set `RESEND_API_KEY`, `ENQUIRY_FROM` and `ENQUIRY_NOTIFY_TO`. Until then enquiries are still saved, and the admin shows a warning.
6. When the name is final and the domain points here: set `SITE_INDEXABLE=1` and redeploy.

## Not done yet

- **Backups** of `/data`. DrMarshllow has a backup route (`src/lib/backup.ts`) that can be ported. Until then, the email alerts are the only second copy of an enquiry.
- **Overdue reminders.** The admin shows overdue enquiries, but nothing nudges you. A daily Railway cron that emails overdue ones is the next step.
- **Account page.** Accounts are managed with `npm run admin:user` only.
- **Privacy page.** The form says details are only used to reply; a full privacy page is needed before running ads to the site.
