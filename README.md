# ViewBoost 🚀

> **Reach the right audience. Reward verified attention.**
>
> Live product: https://flawless-view-boost-hub.base44.app

ViewBoost is a two-sided marketplace connecting **creators** who need real human attention on their videos with **verified human viewers** who earn UPI cash for fully watching content.

- **Creator side:** Packages from ₹199 / 1,000 verified views (₹0.199/view) to ₹1,999 / 25,000 views (₹0.08/view)
- **Viewer side:** Earn per fully-watched video — 80% completion + tab-visibility + device-fingerprint verification, cash out via UPI
- **Trust layer:** No passwords, immutable wallet ledger, human review of suspicious sessions, fraud appeals

---

## 📂 What's in this repo

This is the **strategy & intelligence layer** for ViewBoost — every document you need to understand the product, beat the competition, launch loud, and scale to unicorn level.

| Doc | What it covers |
| :--- | :--- |
| [Product Audit](docs/01-product-audit.md) | Full teardown of the live landing page: content, design system, UX, messaging, trust architecture |
| [Competitor Landscape](docs/02-competitor-landscape.md) | Direct + indirect competitors, pricing benchmarks, market gaps, ToS reality |
| [Launch Playbook](docs/03-launch-playbook.md) | Pre-launch → launch week → first 90 days, referral economy design, unit economics |
| [Hype Vault](docs/04-hype-vault.md) | Crazy-but-viable marketing stunts and viral mechanics |
| [Unicorn Roadmap](docs/05-roadmap-unicorn.md) | Phased roadmap: ₹0 → ₹15L MRR → ₹100Cr ARR thesis |
| [India Compliance](docs/06-compliance-india.md) | GST, TDS, RBI KYC, UPI payout rules — what the platform must handle |
| [Positioning Pivot](docs/07-positioning-pivot.md) | The strategic reframe: from "views for sale" to "viewer research & feedback marketplace" |
| [Operational Backend](docs/08-operational-backend.md) | **Live & tested**: entity model, 7 API endpoints, verification engine rules, nightly payout workflow, full test results |
| [Rebuild Anywhere](docs/09-rebuild-anywhere.md) | **The resilience doc**: rebuild the full environment from this repo in 15 minutes — SDK gotchas, acceptance tests, deploy steps |

---

## 🔁 This repo IS the product (credit-proof)

Everything needed to run ViewBoost lives here. If any agent loses credits or a workspace resets, a new one rebuilds the entire platform from these files alone:

- **`backend/`** — all 7 API functions (deploy-ready Deno), 5 entity schemas, nightly payout workflow definition
- **`frontend/`** — complete standalone web app: creator checkout, watch player with tab-visibility anti-cheat, UPI wallet. No build step — host anywhere (GitHub Pages, Netlify, or a Base44 app)
- **`docs/09-rebuild-anywhere.md`** — the 15-minute rebuild guide + 10-point acceptance test suite

The frontend talks to the live backend over a CORS-open API — changing ONE line in `frontend/config.js` points it at any redeployment.

## 💰 Unit economics at a glance

| Tier | Price | Views | ₹/view | Gross margin* |
| :--- | :--- | :--- | :--- | :--- |
| Starter | ₹199 | 1,000 | ₹0.199 | ~40% |
| Growth | ₹449 | 3,000 | ₹0.15 | ~40% |
| Pro | ₹999 | 10,000 | ₹0.10 | ~40% |
| Viral | ₹1,999 | 25,000 | ₹0.08 | ~37% |

*Before payment gateway fees; see [Launch Playbook](docs/03-launch-playbook.md) for the full margin model.

**Key benchmark:** Google Ads CPV in India runs ₹0.30–₹1.50. Legit agency wrappers (VeeFly, Sprizzy) charge ₹0.83–₹4.15/view with $10–$50 minimums. ViewBoost undercuts everyone legit by **50–75%** while guaranteeing 80% watch completion — something no ad platform can promise.

---

## ⚠️ The one thing to read first

YouTube's Fake Engagement Policy prohibits paid/incentivized views. Read the [Positioning Pivot](docs/07-positioning-pivot.md) before anything else — it explains how ViewBoost reframes the offer (audience feedback marketplace with retention heatmaps and micro-polls) so it's both **safer legally** and a **genuinely unfilled market gap**.

---

## 🧭 North-star metrics

1. **Liquidity ratio** — verified watch-hours delivered / watch-hours purchased (never below 95%)
2. **Time-to-first-payout** — new viewer's first UPI cashout (target: under 24h, threshold ₹25)
3. **Retention heatmap coverage** — % of campaigns delivering second-by-second drop-off data
4. **Fraud reject rate** — sessions blocked before payout (publicly displayed = trust weapon)
5. **CAC** — blended, target under ₹12 via referral loops, not ads

---

*Built and maintained with Velo (Base44 Superagent). Tax/GST classification requires Indian professional review.*
