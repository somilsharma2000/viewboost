# 06 — India Compliance Brief (GST · TDS · RBI · UPI)

> ⚠️ This is research context, not legal advice. Engage an Indian CA/tax counsel before launch — the platform's own footer already says so.

---

## A. RBI / payout & KYC framework

- **UPI micro-payouts:** verified businesses can process bulk automated UPI payouts via RazorpayX / Cashfree Payout APIs to UPI VPAs (GPay/PhonePe/Paytm handles). Standard accounts cap at 100 outbound UPI transactions/day; business payout APIs lift this.
- **KYC tiers (RBI PPI / Master Direction on KYC):**
  - **Low-KYC tier:** up to ₹10,000/month payouts — mobile OTP + verified UPI ID
  - **Full-KYC tier:** above ₹10,000/mo or ₹1,00,000/yr cumulative — Aadhaar/PAN validation mandatory
- **Design implication:** keep per-viewer payouts under the low-KYC line at first; prompt full KYC only for power earners.

## B. Taxation

### GST @ 18%
- Package sales are digital services → 18% GST once turnover crosses the ₹20L threshold, **or from day 1 if operating as an e-commerce operator (ECO)**. Get classification reviewed early.
- UPI transactions themselves aren't transactionally taxed; the platform's service charge is.

### TDS
- **Section 194R** (benefits/perquisites): if rewards to a recipient exceed ₹20,000/financial year.
- **Section 194C** (contractual micro-services, 1%): if single payouts exceed ₹30,000 or aggregate exceeds ₹1,00,000/yr per individual — classify viewer payments as micro-service income, not gaming winnings.
- **Avoid 194B/194BA** classification (30% tax on "winnings") at all costs — this platform pays for *tasks*, not prizes. Wording everywhere must say "earnings for completed verified tasks."

## C. Operational checklist before launch

- [ ] GST registration + auto-generated GST invoices for creators (they can claim input credit — a B2B selling point no SMM panel offers)
- [ ] Viewer TDS tracking dashboard (auto-flag users approaching 194C/194R thresholds)
- [ ] KYC flow: OTP → UPI VPA verification → step-up to Aadhaar/PAN at ₹10k/mo
- [ ] Payout float held over-collateralized in a separate account
- [ ] Terms & Privacy pages finalized with counsel, including the incentivized-viewing disclosures already on the site
- [ ] Data protection: device fingerprinting and telemetry data need explicit consent language in Privacy Policy

## D. Second-order compliance advantages (turn legal boring into marketing)
- **Public fraud-reject rate** = "we're the honest one"
- **Auto GST invoices** = "we're the professional one" (B2B/agency-ready)
- **Published payout SLA + human review appeals** = "we're the fair one"
- Every competitor's weakness (opaque, risky, tax-ignorant) maps to a marketable ViewBoost strength.
