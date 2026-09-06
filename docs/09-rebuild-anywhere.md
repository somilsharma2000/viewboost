# 09 — Rebuild Anywhere (Full Environment from This Repo)

This repo is the **single source of truth** for the entire ViewBoost project. Any AI agent (or human) can rebuild the complete working environment from these files alone — no prior context needed. If an agent loses its credits or the workspace resets, nothing is lost.

---

## What's in this repo

```
viewboost/
├── README.md                     ← start here
├── LICENSE                       ← MIT
├── backend/
│   ├── vbRegisterViewer.ts       ← viewer onboarding (create/get by email + UPI)
│   ├── vbCreateCampaign.ts       ← creator purchases a package → Campaign entity
│   ├── vbListCampaigns.ts        ← active campaigns feed for viewers
│   ├── vbVerifyWatchSession.ts   ← ★ THE verification engine (only place wallet credits are created)
│   ├── vbGetViewerState.ts       ← wallet screen data (balance, ledger, payouts)
│   ├── vbRequestPayout.ts        ← ₹25-minimum UPI cashout request
│   ├── vbProcessPayoutBatch.ts   ← nightly batch payout processor
│   ├── entities/                 ← all 5 entity schemas (JSON)
│   └── workflows/                ← nightly payout workflow definition
├── frontend/                     ← complete standalone frontend (no build step)
│   ├── index.html
│   ├── app.js                    ← watch tracking, tab-visibility enforcement, fingerprint, API calls
│   ├── style.css
│   └── config.js                 ← ⚙️ API base URL — the ONLY file to edit when redeploying
└── docs/                         ← strategy + operations (see README index)
```

## The 15-minute rebuild (on any Base44 app)

**Step 1 — Entities.** Create these 5 entities with exactly the schemas in `backend/entities/`: Campaign, Viewer, WatchSession, WalletTransaction, Payout.

**Step 2 — Backend functions.** Deploy each file in `backend/*.ts` as a backend function with the same name (Deno runtime — code is deploy-ready as-is). Endpoints become `https://<your-app>.base44.app/functions/<name>`.

**Step 3 — Workflow.** Create a scheduled workflow from `backend/workflows/nightly-payout-batch.jsonc` (daily at 00:30 Asia/Calcutta → invokes `vbProcessPayoutBatch`).

**Step 4 — Frontend.** The `frontend/` folder is a complete static app. Either:
- host it anywhere static (GitHub Pages, Netlify, Vercel) — the API is CORS-open (`access-control-allow-origin: *`), or
- if using a Base44 app for the frontend, recreate the pages from `index.html`/`app.js` inside it.

**Step 5 — Point the frontend at the backend.** Edit ONE line in `frontend/config.js`: set `API_BASE` to `https://<your-app>.base44.app/functions`.

Done. The platform is live.

## SDK notes for any agent rebuilding (hard-won knowledge)

- In Base44 backend functions use `createClientFromRequest(req)` from `npm:@base44/sdk@0.8.31` and access entities via `base44.asServiceRole.entities.<Name>`.
- **CRITICAL:** use `.filter({...})` for filtered queries. `.list({ filter: {...} })` silently returns an EMPTY array — no error. This bug caused a real fraud-check bypass during testing; don't repeat it.
- Every function must return `Response` objects (never plain objects/strings).
- Money is stored in INR, rounded to 2 decimals; every credit/debit writes a `WalletTransaction` ledger row with `balanceAfterInr`.

## Acceptance tests (run these after rebuild — all must pass)

| # | Test | Expected |
| :--- | :--- | :--- |
| 1 | `vbCreateCampaign` with Starter tier | ok, ₹199, 1000 views, campaignId returned |
| 2 | `vbRegisterViewer` new email | ok, viewerId returned |
| 3 | `vbVerifyWatchSession` valid (≥80% watched, tab 100% visible) | ok, wallet credited payoutPerView, ledger row, campaign counter +1 |
| 4 | Watch < 80% | rejected `watch_below_80_percent`, NO credit |
| 5 | tabVisiblePercent < 99 | flagged `tab_hidden_during_watch`, NO credit |
| 6 | Same viewer again on same campaign | rejected `duplicate_view_by_viewer` |
| 7 | Different viewer, same device fingerprint | flagged `device_fingerprint_reuse` |
| 8 | `vbRequestPayout` with wallet < ₹25 | `below_minimum_threshold` with needInr |
| 9 | `vbRequestPayout` with wallet ≥ ₹25 | pending payout, wallet 0, ledger debit |
| 10 | `vbProcessPayoutBatch` | all pending → processed, batchId, totals |

## What is NOT in this repo (by design)

- **Secrets** — any API keys (RazorpayX/Cashfree payout credentials) must be set as platform secrets, never committed.
- **Your data** — live Campaign/Viewer/Payout records live in the running environment, not GitHub.
- **Legal/corporate entities** — see [compliance doc](06-compliance-india.md) for the CA/tax counsel checklist before accepting real payments.

## Current live environment (as of 2026-09-06)

- Backend deployed + all 10 acceptance tests passing: Base44 app `velo-7a3ffbb6.base44.app/functions/vb*`
- Nightly payout workflow active (12:30am IST)
- Frontend original: https://flawless-view-boost-hub.base44.app (Base44 app — needs cloning into the owner's account for builder edits; the standalone frontend in this repo removes that dependency)
