# Vercel Preview Setup

This repo can deploy the web app in `packages/web` to a Vercel preview when CI finishes successfully on `dev` or `develop`.

## GitHub Action

The preview deploy workflow lives in `.github/workflows/vercel-preview.yml`.

- Trigger: after the `CI` workflow succeeds on `dev` or `develop`
- Manual fallback: `workflow_dispatch`
- Deploy target: Vercel preview environment

## GitHub Secrets

Add these repository secrets before running the workflow:

| Secret | Purpose |
| --- | --- |
| `VERCEL_TOKEN` | Token created from the Vercel account that owns the project |
| `VERCEL_ORG_ID` | Team or personal account ID for the linked Vercel project |
| `VERCEL_PROJECT_ID` | Linked Vercel project ID |

If the repo is already linked locally, you can read the IDs from `.vercel/project.json`.

## Vercel Environment Variables

Set these in the Vercel project for the `Preview` environment.

### Required

| Variable | Notes |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase project URL used by the web client |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase publishable/anon key used by the web client |

### Recommended for feature parity

| Variable | Notes |
| --- | --- |
| `VITE_MAPBOX_ACCESS_TOKEN` | Needed by Mapbox maps and geocoding flows |
| `VITE_GOOGLE_MAPS_API_KEY` | Needed by Google Maps wrapper flows |
| `VITE_PAYMENT_BANK` | Public bank code used to generate VietQR images in the browser |
| `VITE_PAYMENT_ACCOUNT` | Public receiving account number used to generate VietQR images in the browser |

### Server-only payment secrets

Keep these only in Supabase Edge Function secrets or another server-side secret store:

- `SEPAY_API_KEY`
- `SEPAY_MERCHANT_ID`
- `SEPAY_BASE_URL`
- `SEPAY_USERAPI_BASE_URL`
- `SEPAY_WEBHOOK_SECRET`

Do not put production-only secrets into any `VITE_*` variable. Vite embeds them into the browser bundle.

## Repo-specific caveats

- `packages/web/src/lib/supabase.ts` contains hardcoded fallback values for the current Supabase project. Set the Vercel envs explicitly instead of relying on those defaults.
- `packages/web/src/components/common/SEO.tsx` hardcodes `https://rommz.vn` as `SITE_URL`. Preview deployments will still generate canonical and Open Graph URLs against that domain until the component is made environment-aware.

## First-time setup checklist

1. Create or open the Vercel project linked to this repository.
2. Add the required Preview environment variables in Vercel.
3. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` to GitHub repository secrets.
4. Push to `dev` or `develop`.
5. Open the `Vercel Preview` workflow run summary to copy the preview URL.

For the production path on `main`, see `docs/vercel-production-setup.md`.
