# Hero Redesign Backlog — From Findings to Action

**Based on:** Playwright review + `ui-ux-pro-max` skill analysis
**Date:** 2025-02-15
**Findings addressed:** 4 High/Medium findings from Playwright render pass

---

## Backlog Structure

| Doc | Finding | Severity | Pages |
|-----|---------|----------|-------|
| `backlog-20250215-hero-redesign.md` (this file) | Hero template fatigue | HIGH | All 5 public screens |
| `backlog-20250215-landing-login-emotional.md` | Landing + Login not share-worthy | HIGH | Landing, Login |
| `backlog-20250215-youthful-accent.md` | Youthful-second missing accent | MEDIUM | Services, Community, Swap |
| `backlog-20250215-localization-polish.md` | English labels in hero sections | MEDIUM | All 5 public screens |

---

## Finding #1 (HIGH): Hero System Template Fatigue

**Problem:** Landing, Search, Services, Community, Swap all use identical formula — dark navy / warm gradient / text-first / no large visual above fold.

**Root cause (skill analysis):** `primary-action` + `style-consistency` violated. 5 screens share one hero grammar → brand recognition good, brand memorability zero.

### Tasks

- [ ] **[HERO-01]** Define hero grammar variants per screen. Each screen gets ONE differentiated pattern:
  - `Landing`: **Hero-centric with visual anchor** — search bar + large background visual/illustration (ui-ux-pro-max `landing: hero-centric`)
  - `Search`: **Input-first, context-rich** — sticky search bar + filter chips + results count (ui-ux-pro-max `forms: progressive-disclosure`)
  - `Services`: **Benefit-led** — headline + 3 value props in cards (ui-ux-pro-max `landing: benefit-led`)
  - `Community`: **Content-preview** — latest post teaser above fold (ui-ux-pro-max `landing: social-proof`)
  - `Swap`: **Action-oriented** — single clear CTA (ui-ux-pro-max `primary-action`)

- [ ] **[HERO-02]** Add a signature visual asset to Landing above-the-fold. Options: abstract room/building illustration, lifestyle photo, or 3D accent (ui-ux-pro-max `style: illustration-accent`)

- [x] **[HERO-03]** Establish hero hierarchy rules in design system. ✅ Design system section added to `index.css` with:
  - `--hero-bg`, `--hero-card-*` gradient tokens
  - `--cta-primary` token
  - `--duration-fast/base/slow` + easing tokens
  - Fraunces usage rule (display headlines only)

---

## Finding #2 (HIGH): Landing + Login — Solid But Not Share-Worthy

**Problem:** Landing above-fold = 1 input + 2 CTA + badge row, no visual anchor. Login = copy + form split, no emotional pull.

**Tasks (see `backlog-20250215-landing-login-emotional.md`):**
- [ ] **[LAND-01]** Hero visual on Landing above-fold
- [ ] **[LAND-02]** Enforce ONE primary CTA on Landing above-fold
- [ ] **[LAND-03]** Staggered entrance animation on Landing above-fold
- [ ] **[LAND-04]** Micro-interaction on search input focus
- [ ] **[LAND-05]** QUICK_INTENTS → animated cards with hover lift
- [ ] **[LAND-06]** TRUST_BLOCKS → count-up animation on scroll
- [ ] **[LOG-07]** Emotional hook on login left panel
- [ ] **[LOG-08]** Desktop line length check on login
- [ ] **[LOG-09]** Login form entrance animation

---

## Finding #3 (MEDIUM): Youthful-Second — Missing Accent Layer

**Tasks (see `backlog-20250215-youthful-accent.md`):**
- [ ] **[YOUTH-01]** Define "youthful accent" system (gradient mesh / blob / pattern / grain)
- [ ] **[YOUTH-02]** Implement accent on Services, Community, Swap above-fold
- [ ] **[YOUTH-03]** Copy personality check — approachable vs formal
- [ ] **[YOUTH-04]** Fraunces usage audit — display-only or more broadly?

---

## Finding #4 (MEDIUM): English Labels in Vietnamese Hero Sections

**Tasks (see `backlog-20250215-localization-polish.md`):**
- [ ] **[COPY-01]** Audit + replace English eyebrows with Vietnamese
- [ ] **[COPY-02]** Keep "Verified+" in English if it's a brand trust signal
- [ ] **[COPY-03]** Establish bilingual label rule in design system
- [ ] **[COPY-04]** Consolidate hero gradient → single CSS variable

---

## Consolidated Task Count

| Priority | Tasks | Finding |
|---|---|---|
| **HIGH** | HERO-01, HERO-02, HERO-03, LAND-01–LAND-06, LOG-07–LOG-09 | #1 + #2 |
| **MEDIUM** | YOUTH-01–YOUTH-04, COPY-01–COPY-04 | #3 + #4 |
| **Total** | 21 tasks | |

---

## Recommended Implementation Order

### Phase A: Quick Wins (1-2 days)
Copy polish (#4) + HERO-03 (design system doc) — lowest effort, highest clarity gain.

### Phase B: Core Hero Redesign (3-5 days)
HERO-01 + HERO-02 + LAND-01 + LAND-02 + LOG-08 — this is the main redesign work.

### Phase C: Motion Layer (2-3 days)
LAND-03, LAND-04, LAND-05, LAND-06, LOG-09 — Framer Motion polish.

### Phase D: Youthful Accent (2-3 days)
YOUTH-01 → YOUTH-02 → YOUTH-03 → YOUTH-04 — final polish pass.

---

## Design System Updates Needed

After completing this backlog, update `packages/web/src/index.css`:
1. Add `hero-gradient` CSS variable (replace 3-4 page-specific gradients)
2. Add `accent-blob` or `gradient-mesh` class for youthful accent
3. Add motion tokens: `--duration-fast: 150ms`, `--duration-base: 250ms`, `--duration-slow: 400ms`
4. Document Fraunces usage rule: display/hero headlines only
