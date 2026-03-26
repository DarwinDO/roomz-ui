---
phase: implementation
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Implementation Guide
description: Implementation rules and technical boundaries for the RoomZ Stitch-first desktop port
---

# RoomZ UI Refresh - Implementation

## Development Setup

- Validate docs with `npx ai-devkit@latest lint`
- Read `docs/ai/monitoring/project-status.md` before making repo changes
- Create or update task logs after each code task

## Core Rules

- Use Stitch as the direct visual source of truth for the current in-scope desktop routes
- Port production UI manually into React; do not ship generated HTML
- Keep RoomZ auth, routing, data flow, modal flow, and Supabase behavior intact
- Do not introduce mobile-only decisions, motion polish, or 3D into this phase

## Route Strategy

- Canonical route: `/services`
- Legacy compatibility:
  - `/support-services` -> `/services?tab=services`
  - `/local-passport` -> `/services?tab=deals`
  - `/partners` -> `/services?tab=deals`

## Completed Work

- Updated `AGENTS.md` to make `dev-lifecycle` the default for repo work
- Established living docs with `project-status.md` and task-based implementation logs
- Refreshed global tokens, typography, and UI primitives in the web package
- Added `stitchAssets.ts` and `StitchFooter.tsx` to support the Stitch-first desktop port
- Ported `/`, `/login`, `/services`, `/community`, `/roommates`, and `/room/:id` manually from Stitch screens
- Kept RoomZ auth, routing, modal flows, room data, and Supabase-backed behavior intact while remapping them into Stitch-first layouts
- Completed desktop parity screenshots with Playwright for the original six public routes before expanding the scope
- Cleared the scripted accessibility and SEO regressions introduced during the port
- Added direct Stitch typography aliases and color token aliases so headline/body roles resolve correctly in production code
- Rebalanced landing, login, services, and room detail for the `1024-1440` desktop band after the first user review surfaced overflow and cramped composition
- Fixed the first post-port parity bug pass from user review:
  - landing search controls now use dropdown-based selections
  - landing community grid now follows the intended Stitch span pattern
  - room detail gallery and inline map now reflect the expected structure more closely
  - roommate results now use a real location dropdown and readable action/navigation styling
  - community featured posts now render imagery
  - public brand strings are normalized to `RommZ`
- Fixed the second post-port parity bug pass from user review:
  - landing search now uses the full province dataset and a wider first column so the desktop filter bar stays aligned
  - roommate filter labels compact long city names and keep the action CTA readable in the Stitch shell
  - community featured cards now support both single-image and multi-image media layouts
  - services deals now expand in-place into a full voucher catalog plus a nearby-partners section
  - login trims the floating copy panel, removes the public admin-login shortcut, and clarifies that the profile is created after first successful sign-in
- Fixed the third post-port parity bug pass from user review:
  - landing `Vi tri` now uses a searchable combobox with compact trigger labels for better hero-filter ergonomics
  - landing budget trigger labels are shortened so the Stitch rail stays readable at desktop widths
  - services deal tags now use higher-contrast Stitch-style media capsules
  - community post detail now provides a lightbox viewer for attached images
- Ported `/search` manually from the refined Stitch screen:
  - replaced the old search intro shell with a Stitch-first console and results overview
  - introduced a selected-listing hero card linked directly to the map selection state
  - upgraded `MapboxRoomMap` to support controlled selection, price-pill markers, and popup suppression inside split layouts
  - preserved live RoomZ query, favorite, pagination, and room-detail navigation behavior underneath the new layout
- Ported `/profile` manually from the generated Stitch profile screen:
  - replaced the old tab-first profile shell with a Stitch-first two-column dashboard
  - mapped the live RoomZ auth profile, favorites, bookings, premium entitlements, and roommate matches into the new Atlas layout
  - preserved detailed account management flows by keeping full favorites, booking management, and settings reachable through dialogs inside the new route
- Polished the Stitch-first `/profile` pass after live review:
  - upgraded the premium promo card to clearer `RommZ+` branding with stronger contrast
  - reduced over-wide tracking on profile micro-labels and metric captions
  - connected `Vung tim kiem uu tien` to the search journey by persisting the last preferred search area from `/search` and reusing it inside `/profile`
- Stabilized the protected `/profile` route after the next live review:
  - repaired the visible text-encoding regression that was causing mojibake across the Stitch-first profile dashboard
  - disabled Radix dropdown scroll locking in the shared dropdown wrapper so the avatar menu no longer shifts the fixed navbar horizontally
  - upgraded the preferred-area card to use a live Mapbox mini-map whenever the saved search context has or can recover usable coordinates
- Ported `/swap` manually from the generated Stitch short-stay screen:
  - replaced the old short-stay hub shell with a Stitch-first search console and editorial card composition
  - kept `create-sublet`, `my-sublets`, `swap-matches`, `apply`, and `swap request` reachable through the new layout
  - added `stitchAssets.swap` to hold fallback imagery for the new route
- Fixed the first `/search` interaction bug pass after live user review:
  - added top spacing so the refined search console clears the fixed desktop navbar
  - changed secondary listing cards to navigate directly to room detail on the first click instead of requiring a promote-then-click flow
  - made `Xem tren ban do` re-focus the selected listing state and smooth-scroll back to the selected hero card from lower positions in the results list
  - wired the split-map marker selection to the same selected-listing focus behavior while keeping the full-map mode unchanged
- Fixed the first `/search` map viewport bug pass after the next live review:
  - added a controlled `selected-room` viewport mode to `MapboxRoomMap`
  - the split search mini-map now zooms into the currently selected room instead of fitting every marker across the country
  - the full search map now also defaults to the selected room's local context instead of opening on an all-Vietnam extent when no location filter is active
- Restored smooth search-map camera animation after the viewport pass:
  - stopped recreating the Mapbox instance on every selected-room change
  - moved the latest `onSelectRoom` callback through a ref so marker clicks keep working without forcing a full map re-init
  - kept camera motion in the dedicated `easeTo` effect, which restores the smooth zoom/pan feel when users switch focus between rooms
- Extended the search-map animation fix to location switches with results:
  - stopped recreating the Mapbox instance when quick area chips or other non-empty location changes replace the result set
  - split marker updates and radius overlay updates out of the map initialization effect so the canvas stays mounted while the data changes
  - preserved the single-room map behavior by adding a dedicated camera update effect instead of relying on remounts
- Stabilized the `/search` catalog-selection flow:
  - paused free-text room search while internal location-catalog suggestions are active so typing a place name no longer wipes the current map/list before the user chooses a catalog card
  - added a location-focus transition state so selecting a catalog, Mapbox suggestion, or current location clears the old selected room first and lets the map camera prioritize the new location center
  - restored visible continuity between the current results, the chosen catalog location, and the new room dataset
- Standardized user-facing VND form inputs:
  - added a shared `CurrencyInput` for grouped display like `3.000.000`
  - applied it to post-room, post-sublet, edit-sublet, and the current quick-post dialogs
  - kept raw-digit form state underneath and switched submit parsing to a shared `parseCurrencyInput` helper
- Stabilized user-facing posting dropdowns against layout shift:
  - added a global stable-scrollbar guard so body scroll locking no longer changes centered form width
  - migrated the remaining user-facing posting selects to `FormSelectPopover` in `post-room`, `create-sublet`, and `PostListingModal`
  - recorded the rule that future inline user-facing dropdowns should avoid raw Radix `Select`
- Ported `/host` manually from the generated Stitch landlord dashboard screen:
  - replaced the old host-only dashboard shell with a Stitch-first landlord console
  - kept live RoomZ data for listings, bookings, messages, and income estimates inside the new host layout
  - preserved the booking confirm / reject / complete dialog flow while remapping it into the new request queue card and appointments tab
  - normalized legacy landlord query params (`my-rooms`, `pending`, `confirmed`, `history`, `bookings`) into the new dashboard tabs
  - updated legacy booking redirects to land on `/host?tab=appointments`
- Exposed the host flow from the shared shell:
  - landlord accounts now see `Chủ nhà` directly in the desktop navbar
  - the avatar menu now links to `/host` for landlords and `/become-host` for non-landlords
  - the mobile quick-access sheet mirrors the same branching so the host path is no longer hidden
- Generated the deeper host tab screens in Stitch for review before code porting:
  - `Tin Đăng Chủ Nhà - Living Atlas`
  - `Lịch Hẹn Chủ Nhà - Living Atlas`
  - `Tin Nhắn Chủ Nhà - Living Atlas`
  - `Thu Nhập Chủ Nhà - Living Atlas`
- Generated the pre-host onboarding screen in Stitch:
  - `Đăng Ký Làm Host - Living Atlas`
- Locked an implementation boundary for future host tab ports:
  - keep the shared host top navbar + horizontal tab bar from the existing `/host` shell
  - do not port a left sidebar from host concepts even if a generated Stitch variant introduces one

- Ported `/become-host` manually from the generated Stitch host-registration screen:
  - replaced the old host-application shell with the reviewed Stitch-first conversion layout
  - preserved the live pending / rejected / approved redirect flow from the existing host-application service
  - added local draft save and restore so non-landlord users can continue the form on the same device
- Ported the reviewed host sub-screen concepts into the existing `/host` shell instead of spinning up separate routes:
  - `Tin đăng` now adds a listings insight strip with portfolio mix and spotlight cards above the live listing groups
  - `Lịch hẹn` now adds a Stitch-first appointments strip with a next-up queue and lightweight monthly calendar
  - `Tin nhắn` now adds a triage lane plus a selected-conversation focus card while preserving the full `/messages` route
  - `Thu nhập` now adds revenue-health cards above the estimated live-listing income table
  - the `/host` hero copy now swaps eyebrow, title, and description per active tab

## Performance Rules

- Host parity pass 2 completed:
  - `/host?tab=listings` now follows the reviewed Stitch grammar more directly with a greeting hero, stat tiles, searchable listing lane, and side quality / market cards
  - `/host?tab=appointments` now follows the reviewed Stitch grammar more directly with four appointment stats, a request lane, and a calendar + agenda side rail
  - `/host?tab=messages` now uses a three-panel host console with thread list, live conversation preview, and a room-context side card
- Messaging identity is now room-aware instead of participant-pair-only:
  - `conversations` now store `room_id` and `room_title_snapshot`
  - `get_or_create_conversation` now reopens or creates a thread by `(host, renter, room)` context
  - room detail contact flows now pass `roomId` and `roomTitle`
  - host appointment actions can open the correct room-context conversation directly from `/host`
- Applied the room-context chat migration to the live Supabase project:
  - `supabase/migrations/20260322_add_room_context_to_conversations.sql` is now reflected in project `vevnoxlgwisdottaifdn`
  - new host/renter conversations preserve room identity even when the same renter contacts the same host about multiple listings
- Tightened the host Stitch parity pass again after review feedback:
  - `Tin đăng` now leans on a greeting hero, stat cards, and a searchable spotlight lane instead of the earlier generic dashboard grouping
  - `Lịch hẹn` now uses the reviewed `stats + request lane + calendar rail` grammar instead of the earlier looser booking layout
  - `Tin nhắn` now previews the active thread and room context together so hosts can see what listing the renter is asking about before opening the full inbox
- Upgraded the host interaction layer after the first live review:
  - the `/host?tab=appointments` calendar now supports month navigation and day selection instead of staying as a static visual block
  - the selected day now drives the agenda card so hosts can inspect a specific date instead of only reading a generic next-up list
  - `/host?tab=messages` now supports inline sending inside the host console instead of forcing every reply back through the full `/messages` route
  - the host quick-reply chips now fill the inline composer instead of acting as navigation-only shortcuts
- Stabilized host messaging refresh behavior:
  - background polling for conversations and preview messages no longer flips the strip back into a visible loading state every cycle
  - the host inbox preview should now feel steady during passive refresh instead of flashing or jittering
- Rebuilt the shared `/messages` route into a multi-context inbox:
  - the inbox rail now supports search plus filters for unread, room-linked, and direct threads
  - the main chat panel now keeps the active conversation, quick replies, and inline composer together in one Stitch-first workspace
  - the context rail now changes by thread type so room inquiries show listing context while direct conversations stay lightweight
  - the shared inbox now matches the room-context host logic without forcing renter-to-renter conversations into a landlord-style shell
- Relaxed the host appointments calendar rail after follow-up review feedback:
  - widened the right rail so the month view no longer feels squeezed into a decorative side strip
  - added a selected-day summary above the calendar so the current focus is readable without scanning the entire grid first
- Fixed the remaining messaging overflow bugs after the first shared-inbox rollout:
  - `/host?tab=messages` now renders the full thread instead of slicing to the latest 6 messages
  - the host preview panel now keeps its own scrollable message history while preserving the inline composer
  - `/messages` now constrains the desktop chat workspace height so long conversations scroll inside the panel rather than stretching the entire page
  - message bubbles now wrap more defensively for long content
- Normalized the messaging layout again after a live visual review:
  - `/messages` no longer uses the earlier overly rigid full-height shell that made the inbox feel strange on desktop
  - the shared inbox now uses a more natural center-panel height with lighter sticky side rails
  - the landlord `Tin nhắn` strip now behaves like a bounded quick console instead of a large stretched blank panel
- Added a comfort toggle for quick replies in both messaging surfaces:
  - `/messages` now hides quick-reply chips by default and lets the user reveal them only when needed
  - `/host?tab=messages` now follows the same rule so the visible thread keeps more room for reading
  - quick replies still fill the composer instantly once the user chooses to reveal them
  - the quick-reply tray now opens as a popover instead of expanding inline, so opening suggestions no longer changes the overall page height
- Applied a follow-up messaging stability pass:
  - long participant emails in the shared inbox now wrap with `overflow-wrap:anywhere` instead of bleeding out of the context rail
  - the landlord inline inbox no longer auto-scrolls on every polling refresh because the scroll sync now keys off the last visible message id instead of every array refresh
- Started the Framer Motion layer for public-facing desktop routes:
  - added shared motion presets in `packages/web/src/lib/motion.ts`
  - `/`, `/login`, `/services`, and `/community` now use reduced-motion-safe reveal, stagger, and hover/tap feedback
  - the motion layer stays transform/opacity-only and does not animate layout dimensions
  - product-surface motion for `/search`, `/messages`, and `/host` was deferred in the first pass
- Extended the same Framer Motion system into key product surfaces:
  - `/search` now animates selected-room swaps and the map / insight support panels so focus changes feel intentional
  - `/messages` now animates rail, chat, and context focus changes instead of snapping between conversation states
  - `/host` now animates top-shell tab changes and tab-content swaps while preserving the existing host navigation model
  - the product motion pass still avoids layout-dimension animation and remains reduced-motion-safe
- Implemented the landing/login 3D accent pilot:
  - installed and wired `three`, `@react-three/fiber`, and `@react-three/drei` into the web workspace
  - added a shared `HeroAccentPilot` scene with a housing-cluster variant for `/` and a sanctuary-room variant for `/login`
  - gated the pilot behind WebGL, desktop-width, hardware-hint, and reduced-motion checks via `useThreePilotEnabled`
  - kept the original Stitch hero imagery as the explicit fallback when the pilot is not allowed to mount
  - limited the pilot to lazy-loaded entry routes only so the rest of the desktop product stays 2D

- Keep desktop parity work 2D-only in this phase
- Preserve route stability and existing code-splitting behavior
- Treat current Vite chunk warnings as known debt, not a blocker for this task

## Current Boundary

- The eleven in-scope desktop routes now follow a Stitch-first Living Atlas shell
- Generated desktop screens for landing, login, services, community, roommates, room detail, search, profile, swap, and host are now ported in repo
- The generated host-registration screen is also now ported in repo at `/become-host`
- Host sub-tabs remain inside the canonical `/host` shell with the existing top navbar + horizontal tab bar; Stitch sidebars are treated as concept-only drift and are not portable
- Atlas Plus, admin, and mobile mapping remain outside the current port boundary
- Motion is now inside scope for the public shell and key product surfaces: landing, login, services, community, search, messages, and host
- 3D is now inside scope only for the landing/login pilot; all other routes remain intentionally 2D
- The next implementation target is to review the landing/login 3D pilot and then decide between desktop freeze, mobile mapping, or a focused optimization pass on the pilot chunk
