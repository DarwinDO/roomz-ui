# Vercel Production Setup

This repo can deploy the web app in `packages/web` to Vercel production when CI finishes successfully on `main`.

## GitHub Action

The production deploy workflow lives in `.github/workflows/vercel-production.yml`.

- Trigger: after the `CI` workflow succeeds on `main`
- Manual fallback: `workflow_dispatch`
- Deploy target: Vercel production environment

## GitHub Secrets

Add these repository secrets before running the workflow:

| Secret | Purpose |
| --- | --- |
| `VERCEL_TOKEN` | Token created from the Vercel account that owns the project |
| `VERCEL_ORG_ID` | Team or personal account ID for the linked Vercel project |
| `VERCEL_PROJECT_ID` | Linked Vercel project ID |

If the repo is already linked locally, you can read the IDs from `.vercel/project.json`.

## Vercel Environment Variables

Set these in the Vercel project for the `Production` environment.

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

### Keep these server-side

Do not put these in Vercel frontend env variables:

- `SEPAY_API_KEY`
- `SEPAY_MERCHANT_ID`
- `SEPAY_BASE_URL`
- `SEPAY_USERAPI_BASE_URL`
- `SEPAY_WEBHOOK_SECRET`

Keep them in Supabase Edge Function secrets or another server-side secret store.

## Domain Setup

1. Open the Vercel project.
2. Go to `Settings -> Domains`.
3. Add your production domain, for example `rommz.vn`.
4. Add `www.rommz.vn` or `app.rommz.vn` if you want a second hostname.
5. Follow the DNS records Vercel shows for your registrar or Cloudflare zone.
6. Wait until Vercel shows the domain as verified.

## Supabase Follow-up

After the production domain is live, update Supabase:

1. `Auth -> URL Configuration -> Site URL`
2. `Auth -> URL Configuration -> Redirect URLs`
3. Any allowed origins lists used by Edge Functions or third-party providers

If you use OAuth providers, update their callback URLs to the production domain as well.

## Suggested branch flow

- `dev` or `develop` -> preview deploy
- `main` -> production deploy

## First-time setup checklist

1. Create or open the Vercel project linked to this repository.
2. Add the required Production environment variables in Vercel.
3. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` to GitHub repository secrets.
4. Add the production domain in Vercel and finish DNS verification.
5. Push to `main`.
6. Open the `Vercel Production` workflow run summary to copy the production deployment URL.
