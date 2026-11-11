# FFBD Tournaments

Bangladesh's Biggest Free Fire Tournaments platform.

## 🌐 Live Website

**https://ffbd-tournaments.vercel.app**

| Page | URL |
|------|-----|
| Home | https://ffbd-tournaments.vercel.app |
| Tournaments | https://ffbd-tournaments.vercel.app/tournaments |

## Phase 1 + Phase 2

### Design Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#0B1221` | Deep navy — hero, dark surfaces |
| Secondary | `#1A2332` | Elevated dark cards |
| Accent | `#FF5C00` | Free Fire orange — CTAs |
| Neutral 1 | `#94A3B8` | Muted text / borders |
| Neutral 2 | `#F1F5F9` | Soft light backgrounds |

### Pages
- `/` — Home
- `/tournaments` — List with filters, search, sort, load more
- `/tournaments/[slug]` — Detail with tabs (Overview, Rules, Schedule, Prizes, Teams, Results)

### Stack
Next.js 15 App Router · Tailwind CSS 4 · TypeScript · Framer Motion · Lucide

### Run locally
```bash
npm install
npm run dev
```

### Structure
- `src/types` — Tournament, MatchResult, PrizeRow, etc.
- `src/services/tournamentService.ts` — getTournaments, getTournamentBySlug
- `src/data/seed.ts` — tournaments with bilingual data
