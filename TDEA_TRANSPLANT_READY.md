# TDEA-DESIGN Full Transplant Source

This branch is the complete A-kaffit-team working tree prepared as the source for a clean TDEA-DESIGN repository transplant.

## Source branch

- Repository: `fangwl591021/A-kaffit-team`
- Branch: `agent/tdea-transplant-source`

## Destination

- Repository: `fangwl591021/TDEA-DESIGN`
- Destination working branch: `agent/full-project-transplant`
- Worker: `tdea-design`
- Worker URL: `https://tdea-design.fangwl591021.workers.dev/`
- LIFF ID: `2005868456-3Ip8H1Bx`
- LIFF URL: `https://liff.line.me/2005868456-3Ip8H1Bx`

## Already changed on this source branch

- `wrangler.jsonc` Worker identity changed to `tdea-design`.
- Public LIFF variables changed to `2005868456-3Ip8H1Bx`.
- LINE Login channel baseline changed to `2005868456`.
- D1 resource name changed to `tdea_design_crm`; database ID intentionally remains a placeholder until the new D1 is created.
- R2 bucket name changed to `tdea-design-media`.
- `.dev.vars.example` changed to TDEA public parameters.
- `package.json` package identity changed to `tdea-design-member-crm`.

## Important transplant rule

Mirror the COMPLETE working tree from this branch to TDEA-DESIGN. Do not cherry-pick only the changed files. The purpose of this branch is that all original source code, migrations, tests, static files, historical JS/CSS snapshots and binary assets remain present.

## Cloudflare resources that MUST be new

Do not reuse the original production resource IDs.

- D1 binding: `DB`
- D1 name: `tdea_design_crm`
- R2 binding: `MEDIA`
- R2 bucket: `tdea-design-media`
- Service binding: `MLM_WORKER -> mlm` (preserve for compatibility)
- Inspect actual source usage for any KV bindings and create TDEA-owned namespaces if required.

## Secrets

Never copy secret values into Git. Inspect runtime references and recreate required secrets on the `tdea-design` Worker. At minimum verify session signing, scanner API key, LINE credentials/tokens where used, Telegram crypto/token configuration, OpenAI configuration, and any external integration secrets.

## After mirror

1. Create new D1/R2/KV resources.
2. Replace the D1 placeholder ID in `wrangler.jsonc`.
3. Apply the full `migrations/` set to the new D1.
4. Copy required runtime R2 objects if the application depends on objects not stored under `public/`.
5. Recreate secrets.
6. Run `npm ci`.
7. Run `npm test`.
8. Run `npm run check`.
9. Run `npx wrangler deploy --dry-run`.
10. Deploy only after all checks pass.
11. Smoke-test home, admin, LIFF init/login, registration, CRM, points, card collection/share, courses/check-in, calendar, task engine, rich menu, media/R2 and cron paths.

## Phase boundary

This is a relocation phase only. Do not perform TDEA-specific UI, branding or business-flow redesign until the relocated copy is independently operational.
