// ViewBoost API configuration
// -----------------------------
// These are the deployed Base44 backend functions. If you redeploy the backend
// to a different Base44 app, change ONLY this URL to: https://<your-app>.base44.app/functions
const API_BASE = "https://velo-7a3ffbb6.base44.app/functions";

// Package tiers — display only. The server (vbCreateCampaign) is authoritative.
const TIERS = {
  Starter: { priceInr: 199,  views: 1000,  payoutPerView: 0.12,  dripHours: 24 },
  Growth:  { priceInr: 449,  views: 3000,  payoutPerView: 0.085, dripHours: 36 },
  Pro:     { priceInr: 999,  views: 10000, payoutPerView: 0.06,  dripHours: 48 },
  Viral:   { priceInr: 1999, views: 25000, payoutPerView: 0.05,  dripHours: 72 },
};

const MIN_PAYOUT_INR = 25;
