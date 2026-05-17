# Ivory Draft — PRD

## Original problem statement
A premium, production-quality digital competitive creative-writing game platform for
2–6 players. Six rounds, 20-min timer, randomized prompts, top 2 advance to a final
dialogue-only duel. UI inspired by Linear / Chromium / modern IDEs / glassmorphism;
"professional esports platform fused with a luxury writing studio." 25 features listed
in the original problem statement covering landing, auth, lobby, game room, judging,
leaderboard, profile, admin, sound, accessibility, monetization scaffolding.

## Stack
- **Backend**: FastAPI + Motor (MongoDB async), WebSockets for real-time game state
- **Frontend**: React (CRA) + Tailwind + Shadcn UI + Sonner + framer-motion, custom Geist/JetBrains Mono via Google Fonts
- **Auth**: Emergent-managed Google OAuth (session cookie, 7-day expiry)
- **AI Prompts**: OpenRouter / NVIDIA Nemotron 3 Super (free) — endpoint live, key empty by default

## User personas
- **Competitive writer**: wants to draft under timed pressure against peers, climb ranks
- **Host / moderator**: configures lobbies, picks genre/word-count, kicks off matches
- **Admin**: seeds prompts, monitors stats, generates AI prompts

## Core requirements (static)
- 2–6 players per match, 6 rounds, 20-min timer, 30-sec grace, hard cutoff
- 175–600 word range (configurable per game)
- 1-10 scoring across 4 categories: Grammar, Engagement, Creativity, Accuracy
- After round 5 → top 2 advance to final dialogue-only duel
- Blind / anonymous judging while scoring is open
- Writers retain ownership

## Implemented (2026-02-14)
- ✅ Auth: Emergent Google OAuth + cookie + bearer session
- ✅ 181 hand-curated prompts across 18 genres + rarity / difficulty / modifier system
- ✅ Lobby system w/ public + private (invite-code) games, custom settings, genre filter
- ✅ Game Room: live timer w/ red-pulse warning, distraction-free editor w/ auto-save & live word count, prompt card w/ rarity + modifier
- ✅ Real-time WebSocket broadcast for player joins / submissions / scoring open / round advance / game over
- ✅ Blind 1-10 scoring panel w/ feedback per submission; auto-tally when n*(n-1) scores arrive
- ✅ Final duel round (top 2, dialogue required)
- ✅ Leaderboard (rank points), Profile page with stats & recent drafts
- ✅ Admin: stats, user list, prompt CRUD, AI prompt generation via OpenRouter Nemotron
- ✅ Premium Linear/Chromium-grade dark UI (Geist + JetBrains Mono, glass + hairlines + grid bg + shimmer headings + cinematic timer)
- ✅ Full end-to-end test coverage: 21/21 backend, 8/8 frontend (Playwright)

## Backlog
**P1**
- WebSocket cleanup on unmount (benign console warning today)
- Stricter duel-dialogue validation (currently apostrophes count)
- Concurrency-safe score tallying (atomic find_one_and_update)
- Spectator mode + match history page (DB has it, no dedicated UI yet)
- Achievements / badges award engine
- Reduced-motion + high-contrast accessibility toggles

**P2 (monetization & polish)**
- Ranked seasons, battle passes, cosmetic profile upgrades
- Premium prompt packs / seasonal drops marketplace
- Stripe payments + tournament tickets
- Subtle UI sound design (timer warnings, submission confirm)
- Mobile dedicated layout pass

**P3 (scale)**
- Match analytics dashboard, AI auto-judge fallback
- Tournaments / brackets, replay system, public match links
- Sora 2 video reels of duel highlights
