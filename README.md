# SafeCircle

A community-powered financial safety net app for immigrants, gig workers, and credit-invisible families.

## What it does

- **Normal Mode:** Risk X-Ray scan, group dashboard, shared emergency pool, insurance gap cards, benefits finder, poverty tax meter.
- **Crisis Mode:** Financial 911 triage — step-by-step instructions with deadlines for car accidents, job loss, ER visits, death in family, home damage.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI (Python 3.11+) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| AI | Anthropic Claude API |
| Language | English / Spanish (i18next) |

## Team

| Person | Role | Folder |
|---|---|---|
| Abhinav Reja | Backend Lead + AI | `backend/` |
| Keyur Manade | Frontend Lead | `frontend/` |
| Sumedh Gajbhiye | Risk Engine + Crisis Logic | `engine/` |
| Vedant Ukani | Database + Auth + Realtime | `database/` |

## Getting Started

### 1. Clone the repo
```bash
git clone <repo-url>
cd safecircle
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Fill in your Supabase and Anthropic API keys
```

### 3. Start your part

**Backend (Abhinav):**
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend (Keyur):**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

**Engine (Sumedh):**
```bash
cd engine
# No dependencies required — pure Python
python -m pytest tests/
```

**Database (Vedant):**
```bash
# Apply schema in Supabase SQL editor:
# Run database/schema.sql → database/migrations/001_initial.sql → database/seed.sql
```

## API

Backend runs at `http://localhost:8000/api/v1`

See `docs/API_CONTRACT.md` for the full endpoint reference.

## Integration Rule

Everyone works in their own folder. All communication goes through the API contract in `docs/`. Do not touch another person's folder until integration day.
