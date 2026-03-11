# CLAUDE.md — RoomZ UI Workspace Rules

> Loaded automatically by Claude Code at session start.

---

## Project Overview

**RoomZ** — Vietnamese room rental platform. Monorepo with:
- `packages/web` — React + Vite + TypeScript (main web app)
- `packages/shared` — shared types, services, hooks
- `supabase/` — database migrations, edge functions
- Stack: React, TypeScript, Tailwind CSS, Supabase, Mapbox, SePay

---

## Language Handling

- Respond in the user's language (Vietnamese or English)
- Code, comments, and variable names stay in English

---

## Agent Routing

Subagents live in `.claude/agents/`. Before any code or design work, identify the right domain:

| Domain | Agent | When |
|---|---|---|
| Web UI/UX, React, Tailwind | `frontend-specialist` | Components, pages, styling |
| API, Supabase, server logic | `backend-specialist` | Services, DB, edge functions |
| Mobile (RN, Flutter) | `mobile-developer` | Mobile-only work |
| Bugs, errors, crashes | `debugger` | Root cause analysis |
| Security, auth, payments | `security-auditor` | Sensitive flows |
| Multi-domain tasks | `orchestrator` | Coordinate multiple agents |

> Mobile work uses `mobile-developer` only — never `frontend-specialist` for mobile.

---

## Code Rules

- Concise, direct, no over-engineering
- No unnecessary comments — code should be self-documenting
- No error handling for impossible scenarios
- No helpers/abstractions for one-time use
- Testing: Unit > Integration > E2E (AAA pattern)
- Measure performance before optimizing

---

## Before Modifying Files

1. Read the file first — never suggest changes to unread code
2. Check for dependent files that also need updating
3. For multi-file structural changes, propose a plan before coding

---

## Socratic Gate

For complex or ambiguous requests, ask before coding:

| Request Type | Action |
|---|---|
| New feature / build | Ask 3 strategic questions minimum |
| Bug fix / edit | Confirm understanding, ask about impact |
| Vague request | Ask Purpose, Scope, Users |
| Multi-file refactor | Propose plan, wait for confirmation |

Never assume. If anything is unclear, ask first.

---

## Slash Commands

Available in `.claude/commands/` (create as needed):
- `/plan` — 4-phase planning (Analysis → Planning → Design → Implementation)
- `/debug` — systematic root cause analysis
- `/deploy` — deployment checklist

---

## Audit Scripts

Located in `.claude/scripts/`:

| Script | When |
|---|---|
| `checklist.py` | Final checks before deploy |
| `verify_all.py` | Full suite verification |

Run order: Security → Lint → Schema → Tests → UX → SEO → Lighthouse/E2E

---

## Design Rules

Design-specific rules (Purple Ban, Template Ban, anti-cliché) live inside the agent files:
- Web: `.claude/agents/frontend-specialist.md`
- Mobile: `.claude/agents/mobile-developer.md`

Read the agent file before any UI work.

---

## Key Scripts (npm)

```bash
npm run dev          # dev server (packages/web)
npm run build        # production build
npm run lint         # ESLint
npm run test:unit    # unit tests
npm run test:e2e     # Playwright E2E
```
