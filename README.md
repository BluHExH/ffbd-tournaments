# FFBD Tournaments — Phase 1

Bangladesh's Biggest Free Fire Tournaments platform.

## Design Tokens (from logo concept)

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#0B1221` | Deep navy — hero, dark surfaces |
| **Secondary** | `#1A2332` | Elevated dark cards |
| **Accent** | `#FF5C00` | Free Fire orange — CTAs, highlights |
| **Neutral 1** | `#94A3B8` | Muted text / borders |
| **Neutral 2** | `#F1F5F9` | Soft light backgrounds |

No pure black (`#000`) used anywhere.

### Background strategy
- Hero: dark gradient using primary
- Content sections: alternate soft light tint (`#F8FAFC`) and white
- Cards: glassmorphism on dark, solid + soft shadow on light

### Fonts
- **Rajdhani** (600/700) — headings
- **Inter** — body
- **Hind Siliguri** — Bangla

### Radius & Spacing
- Cards: 16px · Buttons: 12px
- Spacing scale: 4 / 8 / 16 / 24 / 40 / 64 / 96

### Buttons
- Primary: accent gradient + glow on hover + slight scale
- Secondary: outline
- Ghost
- Min height 48px

## Run

```bash
cd ffbd-tournaments
npm install
npm run dev
```

## Phase 1 Scope
- Design system (globals.css + Tailwind)
- Reusable components: Navbar, Footer, TournamentCard, StatCounter, SectionHeading, CountdownTimer, LiveBadge, PrizeBadge, TeamCard, FAQAccordion
- Full Home page with all listed sections
- Seed data (6 tournaments, 8 teams, 5 winners)
- EN / BN language toggle
- Theme toggle
- Mobile-first, scroll-reveal (respects prefers-reduced-motion)

**Waiting for approval before Phase 2.**
