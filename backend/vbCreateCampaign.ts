import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ViewBoost — create a creator campaign from a package tier.

const TIERS = {
  Starter: { priceInr: 199, views: 1000, payoutPerView: 0.12, dripHours: 24 },
  Growth: { priceInr: 449, views: 3000, payoutPerView: 0.085, dripHours: 36 },
  Pro: { priceInr: 999, views: 10000, payoutPerView: 0.06, dripHours: 48 },
  Viral: { priceInr: 1999, views: 25000, payoutPerView: 0.05, dripHours: 72 },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json().catch(() => ({}));
  const { videoUrl, tier, creatorEmail, pollQuestion } = body;

  if (!videoUrl || typeof videoUrl !== 'string' || !/^https?:\/\//.test(videoUrl)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_video_url' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const t = TIERS[tier];
  if (!t) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_tier', validTiers: Object.keys(TIERS) }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const campaign = await base44.asServiceRole.entities.Campaign.create({
      videoUrl,
      tier,
      creatorEmail: creatorEmail || '',
      pollQuestion: pollQuestion || 'Rate this video 1-5 and tell us what would make you subscribe.',
      priceInr: t.priceInr,
      viewsPurchased: t.views,
      viewsDelivered: 0,
      payoutPerView: t.payoutPerView,
      dripHours: t.dripHours,
      status: 'active',
    });
    return new Response(JSON.stringify({ ok: true, campaignId: campaign.id, tier, priceInr: t.priceInr, viewsPurchased: t.views, dripHours: t.dripHours }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'create_failed', detail: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
