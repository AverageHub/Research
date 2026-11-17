# Radiant Research Cloud

A phone-friendly, cloud-hosted research vault for Radiant. The cloud runs scheduled research; your phone is only the dashboard. It uses Groq for analysis and Cloudflare Workers + D1 for hosting, scheduling, and persistent storage.

## What it does

- Scheduled cloud research every 15 minutes, processing one source per run (resumable cursor).
- Reads a small set of public RSS feeds covering AI, developer tools, infrastructure, and competitors.
- Sends only new feed entries to Groq; limits source descriptions and output size to control token use.
- Saves findings and source URLs in D1. A source URL is only analyzed once.
- Review statuses: NEW, APPROVED, REJECTED, DEFERRED, IMPLEMENTED, DUPLICATE.
- Stores decision notes so rejected ideas remain rejected instead of being rediscovered as new.
- Mobile dashboard, search, manual research, and approved-task JSON export.
- No production code changes are ever made automatically.

## Important limits / costs

Groq's Free plan is subject to per-model rate and token limits. This app handles HTTP 429 by recording a failed run and trying again on a later scheduled run. It does not bypass limits.

Cloudflare Workers Free currently has 100,000 requests/day and 10 ms CPU per invocation; D1 Free has 5 million rows read/day, 100,000 rows written/day, and 5 GB total storage. A scheduled invocation has a 15-minute wall-time ceiling, but CPU time is a separate limit. If the free Worker CPU limit interrupts this workload, upgrade Workers to the $5/month paid plan or reduce the work per run. D1 can remain on its free allowance for a small personal vault. Check current plan terms before enabling billing.

Sources are public RSS feeds, not a complete web crawler. Some feeds may change or stop working. The app stores source metadata and excerpts, not full copyrighted articles.

## Deploy using only your phone

You do not need a PC. Use your phone browser in desktop mode if the Cloudflare dashboard layout is cramped.

1. Create a Cloudflare account at https://dash.cloudflare.com/ .
2. Create a GitHub repository from this ZIP's extracted files. On Android, you can use GitHub's website to create a repository and upload the files, or use a mobile Git client.
3. In Cloudflare Dashboard, open **Workers & Pages → Create → Connect to Git** and connect the repository. Set the build command to `npm install` and deploy command to `npx wrangler deploy` if the interface asks for commands.
4. Create a D1 database named `radiant-research-db`. Copy its database ID into `wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
5. Apply the migration from a Cloudflare-connected terminal using `npx wrangler d1 migrations apply radiant-research-db --remote`. If you only have a phone, use Cloudflare's browser-based editor/terminal if available for your account, or GitHub Codespaces in your phone browser. No local PC is required, but first-time deployment is easier with Codespaces.
6. In Worker **Settings → Variables and Secrets**, add secrets:
   - `GROQ_API_KEY` = your Groq key
   - `ADMIN_PASSWORD` = a long, unique vault password
   - `SESSION_SECRET` = a different random secret, at least 32 characters
   - Optional `GROQ_MODEL` = `openai/gpt-oss-20b`
7. In Worker **Settings → Triggers → Cron Triggers**, verify `*/15 * * * *` is enabled. Cron uses UTC.
8. Open the Worker URL on your phone, sign in, and optionally add the page to your home screen.

## Security

- Never put the Groq key in `public/` or in browser JavaScript.
- Keep the Worker URL private if possible. Use a unique admin password and session secret.
- Sessions last seven days. Sign out on shared devices.
- Do not submit customer conversations, API keys, private source code, or personal data to Groq.
- The included CORS policy is permissive for simple same-origin use; tighten it to your exact Worker origin before exposing the API publicly.
- This is a starter app. Before public multi-user use, add stricter origin validation, login throttling, account recovery, source allowlisting, robust XML parsing, and automated integration tests.

## Efficient Groq usage

- One feed is checked per scheduled invocation, rather than fetching every source every time.
- Only unseen source URLs are sent to Groq.
- Maximum five feed entries are considered per run; maximum three findings are stored.
- Source descriptions are capped; model output is capped at 1,400 tokens.
- Low temperature and strict JSON output reduce retries and verbose responses.
- The model is configurable; use a smaller/cheaper supported model for classification and summaries.
- A 429 is not retried in a tight loop. The next scheduled run tries again.
- If you change model, check the current Groq model catalogue and account limits.

## Current limitations

- The feed parser is intentionally lightweight and supports common RSS/Atom formats; unusual feeds may not parse.
- The app checks one source per 15-minute invocation; all eight sources take roughly two hours to cycle.
- Dedupe is by canonical source URL. It does not yet perform semantic dedupe across different URLs.
- The app compares findings against a short Radiant capability profile in its system prompt. Update that profile in `src/worker.js` as Radiant evolves.
- Manual "Research now" runs one source batch, not a full overnight crawl.
- No email/push notifications are included.
