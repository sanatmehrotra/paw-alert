# PawAlert-Backend Architecture

> 🚧 **Work in progress.** This document outlines the planned backend architecture. Everything here is subject to change as development progresses — stack choices, API design, and schema may evolve. Frontend prototype uses in-memory mock data in its place.

---

## Stack

| Layer | Technology |
|---|---|
| API Server | Node.js + Express |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth — Phone OTP |
| Real-time | Socket.io + Upstash Redis |
| AI Triage | Google Gemini Vision API |
| Images | Cloudinary |
| Push | Firebase Cloud Messaging |
| Email | Resend |
| Hosting | Railway (API) + Vercel (Frontend) |

**Total infra cost on free tiers: ₹0**

---

## Key API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/reports` | POST | Submit rescue report, triggers Gemini Vision scoring |
| `/api/reports` | GET | All reports sorted by severity |
| `/api/dispatch` | POST | PostGIS nearest-van query → assign + notify driver |
| `/api/animals` | GET/POST | Animal profiles and status updates |
| `/api/ngo/verify` | POST | Approve or reject NGO application |
| `/api/stats` | GET | Platform-wide dashboard statistics |

---

## Real-time Flow

```
Driver app → emits GPS every 3s via Socket.io
        ↓
Server caches position in Upstash Redis
        ↓
Broadcasts to citizen's rescue room
        ↓
Citizen map updates live, ETA recalculates via Mapbox Directions API
```

---

## What Replaces the Mocks

| Currently Mocked | Real Implementation |
|---|---|
| Hardcoded severity score | Gemini Vision API — photo → severity 1–10 + description |
| `setInterval` van movement | Socket.io WebSocket — driver GPS every 3s via Redis |
| Instant NGO dispatch | PostGIS `ST_DWithin` — nearest available vehicle |
| Toast notifications | Firebase FCM push + Resend email |
| No auth | Supabase Phone OTP — no password needed |
| State simulation for uploads | Cloudinary multipart upload with auto-compression |

---

## Core Schema (abbreviated)

```sql
profiles        -- role: citizen | ngo_admin | driver | super_admin
ngos            -- name, city, status, trust_tier, AWBI docs
vehicles        -- ngo_id, driver_id, status, last_location GEOGRAPHY(POINT)
rescue_tickets  -- reporter_id, species, photo_url, location, severity_score, status
animals         -- shelter profile, medical events, vaccination, adoption status
```
