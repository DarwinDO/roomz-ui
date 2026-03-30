---
phase: implementation
title: Remotion Dependency and Skill Bootstrap
date: 2026-03-30
---

# Remotion Dependency and Skill Bootstrap

## Scope

- Prepare the repo for future automated ad-video rendering with Remotion
- Keep this phase limited to dependency install, skill discovery, and workflow decisions
- Target local rendering first, with desktop-first `16:9` output

## Decisions

- Install Remotion into `@roomz/web`, not the workspace root and not a separate `packages/video` package yet
- Treat Remotion as build-time tooling for now, so the packages live in `devDependencies`
- Keep the app data source as existing API and server actions
- Do not let compositions fetch live data directly; instead, map upstream data into a serializable `AdPayload` contract before render
- Use JSON snapshots as optional fixtures for reproducible local preview and rerender, not as the primary source of truth

## Research

- Queried the public skills registry with:
  - `npx skills find remotion`
  - `npx skills find "video rendering"`
  - `npx skills find "motion graphics"`
- Highest-signal results for this use case were:
  - `remotion-dev/skills@remotion-best-practices`
  - `inferen-sh/skills@remotion-render`
  - `google-labs-code/stitch-skills@remotion`
  - `supercent-io/skills-template@remotion-video-production`

## Changes

- Updated `packages/web/package.json`
  - added `remotion`
  - added `@remotion/cli`
  - added `@remotion/bundler`
  - added `@remotion/renderer`
  - pinned `zod = 4.3.6` for Remotion parameter/schema compatibility
- Updated `package.json`
  - pinned root `zod = 4.3.6` so the monorepo-level Remotion CLI resolves the expected version instead of Expo's transitive `zod 3.x`
- Updated `package-lock.json`
  - captured the Remotion dependency graph for the web workspace
- Installed agent skills into the local Codex environment:
  - `remotion-best-practices`
  - `remotion-render`

## Install Notes

- Initial `npm install -w @roomz/web ...` failed because the existing workspace junction state under `node_modules/@roomz` caused npm to crash with `Cannot read properties of null (reading 'location')`
- Resolved it by refreshing the generated workspace junctions in `node_modules/@roomz`, then rerunning the workspace install successfully
- No source files or app behavior were changed in this phase

## Recommended Workflow

1. Resolve ad input upstream from the existing API or a server action
2. Normalize the response into a serializable `AdPayload` object with stable fields for copy, prices, image URLs, badges, CTA, and timing knobs
3. Save optional fixture snapshots for local iteration when deterministic review is more important than live freshness
4. Pass `AdPayload` into Remotion compositions as props
5. Keep composition metadata explicit for the first rollout:
   - `1920x1080`
   - `30fps`
   - deterministic duration per ad template

## Phase-2 Setup Recommendation

- Create a dedicated `packages/web/src/remotion/` surface
- Add a composition root plus a small `AdPayload` schema
- Add one `16:9` desktop ad template first
- Add a local preview/render script only after the first composition exists

## Validation

- `.\node_modules\.bin\remotion.cmd versions`: pass after the `zod 4.3.6` alignment
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npx ai-devkit@latest lint`: pass
- `npm audit --audit-level=high`: fail
  - current tree reports `14` vulnerabilities total (`5 moderate`, `8 high`, `1 critical`)
  - the new Remotion chain contributes a critical advisory through `loader-utils` inside `@remotion/bundler`
  - npm suggests `npm audit fix --force`, but that would downgrade `@remotion/bundler` to `4.0.438`, so it was intentionally not applied in this bootstrap phase

## Follow-up

- Read the newly installed skill docs in a fresh Codex session after restart
- In the setup phase, prefer `calculateMetadata`, `parameters`, `compositions`, `sequencing`, `timing`, `text-animations`, `audio`, and `tailwind` from `remotion-best-practices`
- Keep `remotion-render` as an optional remote fallback, not the primary local path
