# PawAlert — The 911 for India's Strays

AI-powered stray animal rescue coordination platform. Hackathon prototype.

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with particle animation, hero, stats, how-it-works, features |
| `/report` | 3-step citizen report flow → POSTs to `/api/reports` |
| `/track` | Live tracking with auto-advancing timeline, progress bar, share link |
| `/ngo` | NGO dashboard — 5 tabs: Overview, Incoming Alerts, Fleet, Animals, Analytics |
| `/driver` | **Driver Interface** — rescue mission screen with navigation, stage updates, contacts |
| `/animal/PAW-DOG-0291` | Animal profile with photo gallery, medical timeline, adoption modal |
| `/admin` | Admin panel — API-backed stats, NGO verification, activity log, system health |

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/reports` | GET | All reports sorted by severity |
| `/api/reports` | POST | Submit new report (auto-assigns severity + ID) |
| `/api/animals` | GET | All animals with status |
| `/api/stats` | GET | Dashboard statistics |
| `/api/ngo/verify` | POST | Approve or reject an NGO |

## Tech Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS v4
- shadcn/ui · Framer Motion · Recharts · Lucide React
- In-memory data store (Next.js API routes)
