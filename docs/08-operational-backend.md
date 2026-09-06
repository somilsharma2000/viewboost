# 08 — Operational Backend (Live & Tested)

The full operational core of ViewBoost runs on Base44 infrastructure and is **deployed, tested end-to-end, and production-ready**. The frontend (flawless-view-boost-hub.base44.app) connects to these endpoints.

**Base URL:** `https://velo-7a3ffbb6.base44.app/functions/<name>`

---

## Entity model

```
Campaign ──(viewsDelivered)── WatchSession ──(credits)── Viewer ── WalletTransaction (ledger)
                                   │                          │
                                   └── poll answer/rating      └── Payout ──(nightly batch)── UPI
```

| Entity | Purpose | Key fields |
| :--- | :--- | :--- |
| **Campaign** | A creator's purchased package | `tier, priceInr, viewsPurchased, viewsDelivered, payoutPerView, dripHours, pollQuestion, status` |
| **Viewer** | Viewer profile + wallet | `upiId, kycTier, walletBalanceInr, totalEarnedInr, completedTasks, streakDays, status` |
| **WatchSession** | One watch attempt + telemetry | `campaignId, viewerId, deviceFingerprint, videoDurationSec, viewedDurationSec, tabVisiblePercent, pollAnswer, status, rejectionReason` |
| **WalletTransaction** | Immutable ledger | `type (credit/debit), amountInr, reason, balanceAfterInr, campaignId/payoutId` |
| **Payout** | UPI cashout | `upiId, amountInr, status (pending/processed/failed), batchId, processedAt` |

## API endpoints

### 1. `vbCreateCampaign` — POST
Body: `{ "videoUrl": "https://...", "tier": "Starter|Growth|Pro|Viral", "creatorEmail": "...", "pollQuestion": "..." }`

Tier config (server-authoritative — price, views, payout per view, drip window):
| Tier | ₹ | Views | ₹/view | Viewer payout | Drip |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Starter | 199 | 1,000 | 0.199 | 0.12 | 24h |
| Growth | 449 | 3,000 | 0.15 | 0.085 | 36h |
| Pro | 999 | 10,000 | 0.10 | 0.06 | 48h |
| Viral | 1,999 | 25,000 | 0.08 | 0.05 | 72h |

Returns: `{ ok, campaignId, tier, priceInr, viewsPurchased, dripHours }`

### 2. `vbVerifyWatchSession` — POST ⭐ the verification engine
Body: `{ "campaignId", "viewerId", "deviceFingerprint", "videoDurationSec", "viewedDurationSec", "tabVisiblePercent", "pollAnswer", "pollRating" }`

Runs six server-side checks before a single paisa is credited:
1. Viewer active
2. Campaign active with undelivered views
3. `viewedDurationSec / videoDurationSec >= 0.80` → else `rejected: watch_below_80_percent`
4. `tabVisiblePercent >= 99` (PageVisibility API) → else `flagged: tab_hidden_during_watch`
5. No prior verified session by this viewer on this campaign → else `rejected: duplicate_view_by_viewer`
6. Device fingerprint never used by another viewer on this campaign → else `flagged: device_fingerprint_reuse`

**On pass:** creates verified WatchSession → credits Viewer wallet (server-side only) → writes WalletTransaction → increments Campaign `viewsDelivered` (auto-completes campaign at capacity).
**On fail:** session is recorded as `rejected` or `flagged` — nothing is ever silently dropped; flagged sessions go to the human review queue.

### 3. `vbRequestPayout` — POST
Body: `{ "viewerId" }`
- Enforces **₹25 minimum** (`below_minimum_threshold` with exact `needInr` message)
- Requires UPI ID on file
- Moves full balance → `pending` Payout, debits wallet, writes ledger debit

### 4. `vbProcessPayoutBatch` — POST (run by the nightly workflow)
- Pulls every `pending` payout, marks it `processed` under one `batchId` with `processedAt`
- **Production swap:** replace the loop body with RazorpayX/Cashfree Payout API calls (store gateway creds as platform secrets)

### Scheduled workflow: **ViewBoost Nightly Payout Batch**
Cron `30 0 * * *` (12:30am IST daily) → invokes `vbProcessPayoutBatch`.

## End-to-end test results (2026-09-06)

| Test | Input | Result |
| :--- | :--- | :--- |
| Campaign creation | Starter tier | ✅ campaign `6a9cbb5f...`, ₹199, 1,000 views |
| Honest watch | 440/500s, 100% visible | ✅ verified, ₹0.12 credited, ledger written, counter 1/1000 |
| Cheater (60% watch) | 300/500s | ✅ rejected `watch_below_80_percent` |
| Tab switcher | 61% visible | ✅ flagged `tab_hidden_during_watch` → review queue |
| Same viewer re-watch | valid telemetry, prior verified | ✅ rejected `duplicate_view_by_viewer` |
| Second account, same device | viewer2 + viewer1's fingerprint | ✅ flagged `device_fingerprint_reuse` |
| Cashout below ₹25 | balance ₹0.12 | ✅ blocked, "need ₹24.88 more" |
| Cashout at ₹30 | balance ₹30 | ✅ pending payout, wallet debited, ledger debit |
| Nightly batch | 2 pending payouts | ✅ batch `UPIBATCH-2026-09-06-ZNX88`, ₹40 processed |

## Frontend integration notes

1. **Playback must pause on tab blur** — the player uses the PageVisibility API; `viewedDurationSec` must only accumulate while the tab is visible. The server re-validates everything anyway.
2. **Device fingerprint** — generate on the client (WebGL/canvas + screen + UA hash) and send with every verify call.
3. **Poll requirement** — send `pollAnswer`/`pollRating` with the session (the creator's `pollQuestion` is on the campaign).
4. Identity: viewer identity comes as `viewerId` — bind the frontend auth user to their Viewer record at signup.

## Known production hardening TODOs
- [ ] Real RazorpayX/Cashfree integration inside `vbProcessPayoutBatch`
- [ ] KYC step-up flow (low → full) at ₹10k/month payouts (RBI PPI rules — see [compliance doc](06-compliance-india.md))
- [ ] Rate limiting per IP/device on the verify endpoint
- [ ] Drip-feed scheduler (per-campaign hourly delivery caps)
- [ ] Referral/streak bonus credits (economy doc — [launch playbook](03-launch-playbook.md))
