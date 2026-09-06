# 03 — Launch Playbook (India, 2026)

Two-sided marketplace: creators buy verified watch sessions; viewers earn UPI cash for verified attention.

---

## Unit economics & margin model

| Tier | Creator CPV | Viewer payout/view | Platform gross margin |
| :--- | :--- | :--- | :--- |
| Starter ₹199/1k | ₹0.199 | ₹0.12 | ₹0.079 (~40%) |
| Growth ₹449/3k | ₹0.15 | ₹0.085 | ~40% |
| Pro ₹999/10k | ₹0.10 | ₹0.06 | ₹0.040 (~40%) |
| Viral ₹1,999/25k | ₹0.08 | ₹0.05 | ₹0.030 (~37.5%) |

Net margin after gateway fees depends on the payout strategy — see Risk 3 below.

---

## 1. Case studies: how Indian gig apps hit 100k users

### WinZO & MPL
- ₹10–₹25 instant signup bonus + 10–15% lifetime referral overrides
- **CAC < ₹12 via WhatsApp/Telegram referral loops** vs. ₹45–₹70 on Meta Ads
- **ViewBoost takeaway:** ₹25 instant UPI threshold establishes trust in Tier-2/3 markets

### TaskBucks & RozDhan
- Gamified daily loops: watch-streaks, coin-to-rupee conversion, daily check-ins
- 10M+ downloads, **>65% organic acquisition** from referral messages
- **ViewBoost takeaway:** 7-day watch streak multipliers to sustain >35% viewer DAU/MAU

### Google Task Mate
- Invite-code scarcity spawned hundreds of Telegram groups trading codes; 500k+ monthly searches for "Task Mate Referral Code" during beta, zero paid acquisition
- **ViewBoost takeaway:** pre-launch with **VIP Creator Access Codes** — access as an exclusive asset

## 2. Low-cost launch channels

| Channel | Tactic | Economics |
| :--- | :--- | :--- |
| **Campus ambassadors** ("Campus ViewBoost Champions") | DU/Mumbai/Anna/IIT E-Cells & Rotaract clubs; hook: students earn ₹200–₹500/week pocket money | ₹5 per active viewer recruited + 10% of campus creator spend |
| **Telegram/WhatsApp communities** | 5,000+ "Sub4Sub"/"YouTube Growth"/"Daily Earn UPI" groups; admins get "VIP Admin Partner" status | 5% fee override + leaderboard bots pinned in group |
| **Micro-creator seeding** | 10k–50k sub tech/earning creators; angles: "How I completed my monetization hours" / "Earn ₹100/day watching Shorts" | ₹2,000–₹5,000/video or free ₹1,999 campaign + affiliate |
| **Product Hunt / Indian tech Twitter** | "Proof-of-Attention Infrastructure for the Creator Economy" — lead with PageVisibility API, canvas fingerprinting, completion telemetry | Free; credibility play |
| **ASO / SEO** | "buy real YouTube views India UPI" · "watch videos earn money UPI" · "instant UPI payout earning app" | Compounding organic intent |

## 3. Referral & economy design (balanced liquidity engine)

### Viewer side
1. **Welcome bonus:** ₹10 locked credit, unlocks after 10 verified watches (kills fake signups)
2. **Watch streaks:** 3-day = 1.1× multiplier; 7-day = 1.25× + ₹15 bonus
3. **Daily cap:** 50 videos/day (~₹4–6/day) — prevents bot-farming and invalid-traffic flags
4. **Daily leaderboard:** top 50 viewers split ₹1,000/day (1st place ₹250, UPI at midnight)

### Creator side
1. **First-campaign incentive:** 250 free verified views on profile setup
2. **Creator referral loop:** invite a creator; when they spend ₹199+, you get 500 free views
3. **Volume tiers:** clear progression Starter → Viral

---

## 4. Launch phases

### Phase 1 — Pre-launch (Weeks −4 → 0)
**Milestone: 500 beta creators, 2,500 whitelisted viewers**
1. Deploy PageVisibility tracking + UPI wallet on the live app
2. Onboard 20 Telegram group admins as VIP partners
3. Seed 50 micro-creators with free Tier-1 codes for launch-day reviews
4. Internal pen-test of anti-bot systems (canvas fingerprint + IP checks)

### Phase 2 — Launch week (Days 1–7)
**Milestone: 10,000 registered users, 100,000 verified views delivered**
- **Day 1:** Product Hunt launch + public VIP code release
- **Day 2:** 24-Hour Monetization Speedrun livestream
- **Day 3:** ₹50,000 Anti-Bot Hacker Bounty announced (LinkedIn + tech Twitter)
- **Day 4:** #InstantUPIProof challenge goes live on Reels/Shorts
- **Day 5–7:** Daily watch leaderboards (₹1,000/day pool) for Day-7 retention

### Phase 3 — First 90 days
**Milestone: 100,000 active users, 15,000 paid campaigns, ₹15L+ monthly gross**
1. Campus Ambassador Program across 50 campuses
2. Batch UPI payouts — cashouts under 10 seconds
3. Launch "ViewBoost for Business" (D2C brands buying verified human attention on promo Reels)
4. Campaign scheduling: drip-feed settings, demographics targeting, watch-duration options

---

## 5. Top 3 risks & mitigations

### Risk 1 — Platform invalid-traffic crackdowns
Sudden single-source spikes get views flagged/frozen.
- **Drip-feed pacing engine:** deliver over 24–72h, mimicking viral curves
- **Referrer/source randomization:** direct links, embeds, social-share landers, search-entry prompts
- **80% retention floor** + ±15% natural duration variance (no identical-duration bot signatures)

### Risk 2 — Sybil attacks & headless bot farms
- PageVisibility API enforcement (playback halts on tab blur)
- WebGL canvas fingerprinting + hardware concurrency + mouse/touch telemetry
- **1:1 identity binding:** OTP-verified mobile = UPI VPA = one device = one account
- Datacenter/VPN/proxy IP blocking

### Risk 3 — UPI gateway fees erasing margins
₹1–₹2 flat fee per payout destroys micro-payout economics.
- Internal wallet ledger accumulates micro-earnings
- **₹25 minimum threshold** (~200–300 tasks)
- Nightly batch payout APIs / UPI Lite → overhead under ₹0.15/cashout

---

## Immediate next steps
1. Verify PageVisibility API listeners — playback must halt instantly on tab blur
2. Configure ₹25 withdrawal threshold + batch UPI processing
3. Distribute 50 creator promo codes (`FREEDEMO1K`) via Telegram/WhatsApp
