# Code Mania

Code Mania is a learn-to-code web app with a story-driven game loop, interactive coding terminals, quizzes/exams, and a Community hub (Freedom Wall) with weekly challenges.

## Tech Stack

Frontend
- React (React 19)
- Vite
- React Router
- Monaco Editor (`@monaco-editor/react`)
- Phaser 3 (game engine)
- PrismJS (syntax highlighting)
- Markdown rendering (`react-markdown`, `remark-gfm`, `markdown-it`) + DOMPurify
- Lucide (icons)
- Tailwind CSS (present in toolchain) + custom CSS

Backend
- Node.js + Express
- Supabase (Postgres) via `@supabase/supabase-js`
- JWT auth (access token) + cookies
- Google OAuth (Passport)
- Cloudinary (asset uploads, weekly challenge cover images)
- Redis-backed rate limiting (dependencies present)
- Email (Nodemailer + Brevo integration utilities)
- Google Analytics Data API (metrics utilities)

External services
- Terminal / runner service for code execution and test running (default: `https://terminal.codemania.fun`)

## Key Features

Learning
- Interactive coding exercises with an embedded terminal
- Quizzes and exams with automated test execution

Community (Freedom Wall)
- Posts feed with search
- Heart reactions with live counts
- Weekly Challenges:
  - current/upcoming list
  - past challenges + detail pages (participated + winners)
  - coding UI matches the Exams experience (run tests, submit, score threshold)

Cosmetics (weekly rewards)
- Cosmetics catalog seeded from Cloudinary URLs (`public.cosmetics`)
- Hard weekly challenges can award randomized cosmetics (easy/medium are XP-only)

## Monorepo Layout

- `frontend/` React app (Vite)
- `backend/` Express API
- `database/` Supabase SQL schemas and helpers

## Getting Started (Local)

Prerequisites
- Node.js 18+ recommended
- A Supabase project (Postgres)

Install
1) Backend dependencies
```bash
cd backend
npm install
```

2) Frontend dependencies
```bash
cd frontend
npm install
```

Run
1) Start backend (port 3000 by default)
```bash
cd backend
npm run dev
```

2) Start frontend (Vite dev server)
```bash
cd frontend
npm run dev
```

## Environment Variables

Backend (`backend/.env`)
- `PORT` (default 3000)
- `FRONTEND_URL` (default `http://localhost:5173`)

Supabase
- `SUPABASE_URL`
- `ANON_KEY`

Auth / JWT
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET` (used in some helpers)

Terminal runner service
- `TERMINAL_API_BASE_URL` (default `https://terminal.codemania.fun`)
- `INTERNAL_KEY` (required to call protected runner endpoints)

Cloudinary
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_WEEKLY_TASKS_FOLDER` (optional; default `code-mania/weekly-tasks`)

Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

Email (Brevo)
- `BREVO_API_KEY` (utilities)
- `BREVO_USER` / `BREVO_PASS` (legacy utility)

Misc / legacy (may not be required for your deployment)
- `API_BASE_URL`
- `API_KEY` (authorization middleware)
- `API_SECRET_KEY` (hash/jwt utilities)
- MySQL settings (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`) exist but Supabase is the primary DB for current features.

Frontend (`frontend/.env`)
- `VITE_API_BASE_URL` (default `http://localhost:3000`)
- `VITE_TERMINAL_WS_URL` (default `https://terminal.codemania.fun`)
- `VITE_PRESENCE_WS_URL` (optional)
- `VITE_ENABLE_MOCK_CHALLENGES` (optional; `true` enables mock past challenges UI)

## Database (Supabase)

SQL schemas are in `database/`.

Commonly used
- `database/community_weekly_tasks.sql` weekly tasks + user progress + notifications
- `database/community_weekly_challenge_winners.sql` winners for past challenges

Cosmetics
- Seed `public.cosmetics` with your Cloudinary asset URLs
- Weekly tasks reference rewards via `weekly_tasks.reward_avatar_frame_key` / `weekly_tasks.reward_terminal_skin_id`

## API (High-Level)

The API is served under `/v1`.

Notable routes (non-exhaustive)
- Community posts
  - `GET /v1/` (home feed uses Freedom Wall posts)
  - `POST /v1/freedom-wall` create post (auth)
- Reactions
  - `GET /v1/post/batch?ids=...` reaction counts + viewer liked (optional auth)
  - `POST /v1/post/:id/like` (auth, non-admin)
  - `DELETE /v1/post/:id/unlike` (auth, non-admin)
- Weekly challenges
  - `GET /v1/weekly-tasks/active` (optional auth)
  - `GET /v1/weekly-tasks/task/:task_id` (optional auth)
  - `POST /v1/weekly-tasks/:task_id/accept` (auth)
  - `POST /v1/weekly-tasks/:task_id/submit` (auth) runs tests like exams
- Quizzes / Exams
  - Exam test execution calls the terminal runner service via `POST ${TERMINAL_API_BASE_URL}/exam/run` with `x-internal-key`

## Notes

- The terminal runner is a separate service. Locally you can point `TERMINAL_API_BASE_URL` / `VITE_TERMINAL_WS_URL` to your own runner.
- Some legacy modules exist (e.g., MySQL connector) but Supabase is the main data store for current features.
