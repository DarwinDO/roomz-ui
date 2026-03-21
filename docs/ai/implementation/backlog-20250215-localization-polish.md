# Finding #4 (MEDIUM): English Labels in Vietnamese Hero Sections

**Problem:** "Search hub", "Rental marketplace", "Support hub", "Local passport" — English labels in main hero sections feel "concept mode" not "product mode."

**Root cause (skill analysis):** `i18n-consistency` + `brand-voice` gap. Polish phase introduced English eyebrows without full localization review.

### Tasks

- [x] **[COPY-01]** Audit all eyebrow labels and section headers in public heroes. ✅ All Vietnamese — no English eyebrows in Landing, Search, Services, Swap, Community heroes. NOTE: "Local context" in LocalPassportPage line 372 is inside a dark-panel card (not hero), acceptable as product term.
- [x] **[COPY-02]** Keep "Verified+" in English if it's a brand trust signal. ✅ Already in Vietnamese ("Phòng đã xác thực") — correct.
- [x] **[COPY-03]** Establish bilingual label rule in design system. ✅ Added to index.css Phase A section.
- [x] **[COPY-04]** Consolidate hero gradient → CSS tokens. ✅ All 9 pages updated, zero hardcoded hero gradients remaining.

**Status: ALL DONE** — Finding #4 fully resolved.

