# Finding #2 (HIGH): Landing + Login — Solid But Not Share-Worthy

**Problem:** Landing above-fold = 1 input + 2 CTA + badge row, no visual anchor. Login = copy + form split, no emotional pull.

**Root cause (skill analysis):** `motion-meaning` + `excessive-motion` + `primary-action` violated. UI is static and functional but lacks delight.

### Tasks

- [ ] **[LAND-01]** Add one hero visual to Landing above-the-fold. This is the single most impactful change. Recommendation: abstract geometric/illustrative element using brand colors — NOT a stock photo. (ui-ux-pro-max `landing: hero-centric` + `style: illustration-accent`)

- [ ] **[LAND-02]** Enforce ONE primary CTA on Landing above-fold. Currently 2 CTAs (search input + primary button). Reduce to 1 primary. (ui-ux-pro-max `primary-action`)

- [ ] **[LAND-03]** Add staggered entrance animation to Landing above-fold elements. Target: search bar → badge row → CTA, staggered 50ms each. (ui-ux-pro-max `stagger-sequence` + `motion-meaning`)

- [ ] **[LAND-04]** Add micro-interaction to search input — subtle scale (0.98) on focus + border glow. (ui-ux-pro-max `scale-feedback` + `state-transition`)

- [ ] **[LAND-05]** Replace QUICK_INTENTS badge row with animated cards. Cards slide in staggered, hover triggers subtle lift. (ui-ux-pro-max `hover-vs-tap` + `transform-performance`)

- [ ] **[LAND-06]** Replace TRUST_BLOCKS static layout with animated social-proof. Numbers count up on scroll-into-view. (ui-ux-pro-max `loading-states` + `motion-meaning`)

### Login-specific

- [ ] **[LOG-07]** Add emotional hook to left panel. Currently: benefit list. Enhancement: add a subtle animated illustration or brand motif that breathes. (ui-ux-pro-max `motion-meaning`)

- [ ] **[LOG-08]** Review desktop line length on login left panel. Ensure max ~65-75 chars per line. (ui-ux-pro-max `line-length-control`)

- [ ] **[LOG-09]** Add entrance animation to login form — slide in from right + fade, 300ms. (ui-ux-pro-max `navigation-direction` + `easing`)

