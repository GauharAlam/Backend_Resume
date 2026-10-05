# ResumeAI — AI Resume Builder (Backend)

REST API for the ResumeAI resume builder. It stores resumes, serves shared resumes, and runs the AI features. The React frontend lives in [resume-builder](https://github.com/GauharAlam/resume-builder).

## Features

- **Resume storage** — create, read, update and delete resumes per user.
- **Public sharing** — turn a resume into a read-only link and back.
- **AI endpoints** — text rewriting, bullet and full-resume generation, skill suggestions, resume scoring, ATS analysis, job-description matching, cover letters, and parsing an uploaded resume into sections.
- **LinkedIn import** — fetches a public profile server-side, so the provider key never reaches the browser.
- **Clerk authentication** — verifies the session token and creates the user record on first request.
- **Analytics ingestion** — stores product events with automatic expiry.
- **Hardened by default** — Helmet headers, an explicit CORS allowlist, rate limiting and request size caps.

## Tech stack

| Area | Choice |
| --- | --- |
| Runtime | Node.js, Express 4 |
| Database | MongoDB with Mongoose |
| Auth | Clerk (`@clerk/express`) |
| AI | OpenAI SDK pointed at OpenRouter (NVIDIA supported as a fallback) |
| Security | helmet, cors, express-rate-limit |

## Getting started

**Prerequisites:** Node.js 18 or newer, a MongoDB database, a [Clerk](https://clerk.com) application, and an [OpenRouter](https://openrouter.ai/keys) API key.

```bash
git clone https://github.com/GauharAlam/Backend_Resume.git
cd Backend_Resume
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

The API runs at `http://localhost:5001/api`. Open `http://localhost:5001/` for a status summary, or call `GET /api/health`.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Port to listen on. Defaults to `5001`. |
| `NODE_ENV` | No | Set to `production` when deployed. |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `CLERK_SECRET_KEY` | Yes | Secret key from your Clerk application. |
| `CLERK_PUBLISHABLE_KEY` | Yes | Publishable key from the same Clerk application. |
| `OPENROUTER_API_KEY` | Yes for AI | OpenRouter API key. |
| `OPENROUTER_BASE_URL` | No | Defaults to `https://openrouter.ai/api/v1`. |
| `AI_MODEL` | No | Model to use. Defaults to `deepseek/deepseek-chat`. `OPENROUTER_MODEL` is an alias. |
| `OPENROUTER_REFERER`, `OPENROUTER_TITLE` | No | App attribution sent to OpenRouter. |
| `AI_TIMEOUT_MS` | No | Timeout for one AI request. Defaults to `30000`. |
| `RAPIDAPI_KEY` | For LinkedIn import | RapidAPI key for "Fresh LinkedIn Profile Data". Without it the import endpoint returns 503. |
| `CORS_ORIGINS` | Yes in production | Comma-separated list of allowed frontend origins. |
| `ANALYTICS_TTL_DAYS` | No | Days to keep analytics events. Defaults to `90`. |

If `OPENROUTER_API_KEY` is not set, the server falls back to `NVIDIA_API_KEY` and `NVIDIA_BASE_URL`. Never commit `.env`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with nodemon and restart on changes |
| `npm start` | Start with Node |

## API

All routes are under `/api`. Routes marked **Auth** need a Clerk session token in the `Authorization: Bearer <token>` header. Clerk tokens expire after about a minute, so clients should request a fresh one for each call.

### Response format

Every endpoint returns JSON in the same shape:

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "message": "What went wrong", "errors": [{ "field": "title", "message": "Title is required" }] }
```

`errors` is only present for validation failures. Common status codes: `400` invalid input, `401` missing or expired token, `404` not found, `429` rate limit reached, `503` a dependency (database or AI provider) is unavailable, `504` the AI request timed out.

### Health and status

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` (no `/api` prefix) | No | Status summary: database connection, environment, and how many CORS origins are configured. The first place to look when a deployment misbehaves. |
| GET | `/api/health` | No | Returns `200` when the database is connected, `503` otherwise. |

### Resumes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/resumes` | Yes | List the signed-in user's resumes. |
| POST | `/resumes` | Yes | Create a resume. Body: `{ title, resumeData }`. |
| GET | `/resumes/:id` | Yes | Get one resume. |
| PUT | `/resumes/:id` | Yes | Update a resume. |
| DELETE | `/resumes/:id` | Yes | Delete a resume. |
| PATCH | `/resumes/:id/share` | Yes | Turn public sharing on or off. Body: `{ isPublic }`. |
| GET | `/resumes/share/:shareId` | No | Get a publicly shared resume. |

### AI

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/ai/improve-text` | Yes | Rewrite text. Body: `{ text, section, jobTitle, instruction? }`. |
| POST | `/ai/generate-bullets` | Yes | Draft achievement bullets for a role or project. |
| POST | `/ai/suggest-skills` | Yes | Suggest skills from a job title and experience. |
| POST | `/ai/analyze-resume` | Yes | Score a resume and return feedback. |
| POST | `/ai/analyze-ats` | Yes | ATS analysis against a job description. |
| POST | `/ai/jd-match` | Yes | Match score, missing skills and suggestions for a job description. |
| POST | `/ai/generate-cover-letter` | Yes | Write a cover letter from a resume and job description. |
| POST | `/ai/generate-full-resume` | Yes | Generate a starter resume for a job title and experience level. |
| POST | `/ai/parse-resume` | Yes | Turn the text of an existing resume into structured sections. Body: `{ text }` (80–30,000 characters). |
| POST | `/ai/import-linkedin` | Yes | Import a public LinkedIn profile. Body: `{ url }` (must be a `linkedin.com/in/...` link). |
| POST | `/ai/chatbot` | Yes | Career assistant reply using the resume as context. Not used by the current frontend. |

### Analytics

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/analytics/events` | No | Record a product event. |

### Limits

| Scope | Limit |
| --- | --- |
| All `/api` routes | 100 requests per 15 minutes per IP |
| AI routes | 30 requests per 10 minutes per user |
| Analytics events | 60 requests per minute |
| Request body | 2 MB |
| Resume data | 1,000,000 characters |

AI inputs are also length-capped per field; see `src/validators/ai.validator.js`.

## Project structure

```
server.js                 App setup: security, CORS, routes, error handling
routes/                   Route definitions (resumes, ai, analytics, health)
middleware/               Clerk auth and rate limiting
models/                   Mongoose models: User, Resume, AnalyticsEvent
src/
├── controllers/          Request handlers
├── services/             Database logic
├── validators/           Input validation and size caps
└── utils/                Errors, responses, environment helpers
```

## Deployment

`vercel.json` is included and routes every request to `server.js`, so the project deploys to Vercel as is.

1. Set the environment variables above in your hosting provider, with `NODE_ENV=production`.
2. Set `CORS_ORIGINS` to the exact URL of the deployed frontend. In production an empty list blocks all browser origins, and `*` is refused.
3. Point the frontend's `VITE_API_BASE_URL` at `<your-backend-url>/api`.

### Deployment checklist

After deploying, open `https://<your-backend-url>/` and confirm:

- `"database": "✅ Connected"`
- `"cors": { "configuredCount": 1 }` or more
- `"action_required": "None. System is healthy."`

The database connects in the background on a cold start, so the very first request can report `Disconnected`. Refresh once before treating it as a fault.

Environment variable changes on Vercel only apply to **new** deployments; redeploy after editing them.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Browser requests fail and the console mentions CORS; preflight returns `500` | The frontend's origin is not in `CORS_ORIGINS` | Add the exact origin (scheme and host, no trailing slash, no path), e.g. `https://your-app.netlify.app`, then redeploy. Check for typos in the hostname. |
| `/api/health` returns `503` with `"db": "not-ready"` | `MONGO_URI` is missing or wrong, or MongoDB Atlas is blocking the host | Set `MONGO_URI`. In Atlas → Network Access, allow `0.0.0.0/0`, since serverless hosts have no fixed IP address. |
| Every authenticated route returns `401` | Missing or expired token, or the Clerk keys belong to a different Clerk application than the frontend's | Use the secret and publishable keys from the same Clerk application (and the same instance: development or production) as the frontend. |
| AI routes return `503` "temporarily unavailable" | No AI key configured, or the provider rejected the key | Set `OPENROUTER_API_KEY` and confirm the account has credit. |
| AI routes return `429` | Per-user AI limit (30 requests per 10 minutes) or the provider's own limit | Wait and retry. |
| AI routes return `504` | The provider took longer than `AI_TIMEOUT_MS` | Retry, raise `AI_TIMEOUT_MS`, or choose a faster `AI_MODEL`. |
| `/ai/import-linkedin` returns `503` "not configured" | `RAPIDAPI_KEY` is not set | Set it, or leave it unset to keep LinkedIn import disabled. |

Startup problems are also written to the server log (Vercel → Logs), including the exact MongoDB connection error.

## Security notes

- Secrets (`MONGO_URI`, Clerk secret key, AI and RapidAPI keys) live only in this service's environment. The frontend must never receive them.
- CORS is closed by default in production: an empty `CORS_ORIGINS` blocks all browser origins, and `*` is refused.
- Resume data is scoped to the signed-in user; only resumes with sharing turned on are readable through `/resumes/share/:shareId`.
- AI prompts treat uploaded resume text as data, and every AI input is length-capped to bound cost.

## Related

- Frontend: [GauharAlam/resume-builder](https://github.com/GauharAlam/resume-builder)

## License

ISC
