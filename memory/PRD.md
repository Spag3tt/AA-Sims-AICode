# NCAA Game Simulation Website - PRD

## Original Problem Statement
Build a website for an NCAA game simulation that pulls statistics from a Google Sheet. 3 divisions (A, B, C) with 8 teams each. Top 3 move up, bottom 3 move down. Bottom 3 in C division eliminated, replaced by new teams. Top 4 from each division do a tournament each season. Every 10 seasons, a mega 24-team March Madness style bracket prediction tournament.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Phosphor Icons
- **Backend**: FastAPI + MongoDB + Google Sheets API (public read via Visualization API)
- **Auth**: Emergent Google OAuth (social login)
- **Data Source**: Google Sheets (Spreadsheet ID: 19FhGR3g85eAdaJoSVlayapX_XOd44BR152EMGNRNuI4)

## User Personas
- **Simulation Owner**: Manages the simulation, updates Google Sheet weekly
- **Fan/Viewer**: Browses stats, standings, history
- **Predictor**: Makes bracket predictions for tournaments, competes on leaderboard

## Core Requirements (Static)
1. Pull all stats from Google Sheets (22 sheets across 5 seasons)
2. Display division standings with promotion/relegation zones
3. Show all-time team rankings
4. Championship history viewer
5. Season-by-season stats with game results
6. User authentication (Google login)
7. Bracket prediction system for mega tournaments (every 10 seasons)
8. Global leaderboard

## What's Been Implemented (Feb 2026)
- [x] Google Sheets integration pulling 22 sheets of data
- [x] Landing page with March Madness design
- [x] Google OAuth authentication (Emergent Auth)
- [x] Dashboard with division standings, all-time top 5, championships
- [x] Division standings page with A/B/C tabs
- [x] All-time rankings with search and full stats table (36 teams)
- [x] Championship history with season cards and game details
- [x] Season stats page with overall rankings + per-division data
- [x] Game results display with week filtering
- [x] Bracket prediction system (UI ready, functional with tournaments)
- [x] Leaderboard system with podium display
- [x] 5-minute data cache with manual refresh
- [x] Responsive sidebar navigation
- [x] Dark theme with Barlow Condensed + DM Sans typography

## Prioritized Backlog
### P0 (Critical)
- None remaining for MVP

### P1 (High Priority)
- Create actual tournaments in DB when a division completes playoffs
- Auto-score predictions when tournament results are finalized
- Season navigation links in sidebar (Season 1-5 quick access)
- Player stats if added to Google Sheet

### P2 (Medium Priority)
- Head-to-head team comparison tool
- Team detail page with full history across seasons
- Notification when new week data is added
- Export standings to image/PDF for sharing

### P3 (Nice to Have)
- Live score updates during simulation games
- Historical win/loss charts per team
- Social sharing of predictions
- Push notifications for tournament updates

## Next Tasks
1. Add season navigation quick links in sidebar
2. Team detail page showing cross-season performance
3. Auto-create tournaments from Google Sheet playoff data
4. Admin panel for managing tournaments and scoring predictions
