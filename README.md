# 🐾 PawAlert-The 911 for India's Strays

> India's first AI-powered stray animal rescue coordination platform.  
> Report an injured animal in 60 seconds. Track the rescue van live. Close the loop.

---

## What & Why

India has **20.3M+ stray animals** on its streets. When a citizen spots an injured dog, cow, or cat — there is no reliable way to summon help. **3,786 registered NGOs** operate in complete isolation with zero shared dispatch system. **5 animals die every day** from neglect and delayed response.

PawAlert fixes this with a single platform connecting citizens → NGOs → shelters → adoption.

---

## How It Works

```
Citizen photographs injured animal (PWA, no app download)
        ↓
Gemini Vision API scores injury severity 1–10
        ↓
Nearest verified NGO van dispatched via geospatial routing
        ↓
Citizen tracks van live on map with real-time ETA
        ↓
Animal tracked: shelter → treatment → vaccination → adoption
```

---

## ⚠️ Prototype Notice

This is a **frontend-focused hackathon prototype** built with Next.js API routes and in-memory mock data. The full backend (Supabase + PostGIS + Socket.io + Gemini Vision API + Firebase FCM) is architected and in development — see [`/backend.md`](./backend.md) for the full spec.

Features currently simulated: AI severity scoring · Live GPS tracking · Push notifications · Photo upload · Authentication

---

## Quick Start

```bash
npm install && npm run dev
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing — hero, stats, how-it-works |
| `/report` | 3-step citizen report flow |
| `/track` | Live rescue tracking |
| `/ngo` | NGO dashboard — alerts, fleet, analytics |
| `/driver` | Driver mission interface |
| `/animal/PAW-DOG-0291` | Animal profile + adoption |
| `/admin` | Admin — NGO verification, platform stats |
| `/demo` | Judge-friendly page navigator |

---

## Stack

Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Recharts

---

## Deployment

| Service | Purpose | URL |
|---|---|---|
| Vercel | Frontend hosting | `pawalert.vercel.app` |
| Railway | API server *(coming)* | — |
| Supabase | Database *(coming)* | — |

---

*Built for India Innovates 2026 · Data: AWBI Annual Report 2023-24 · DAHD 20th Livestock Census*
