import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ViewBoost — active campaigns feed for the viewer "Start Earning" page.
// Returns only what the player needs; no creator PII.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const active = (await base44.asServiceRole.entities.Campaign.filter({ status: 'active' })) || [];
    const campaigns = active.map((c: any) => ({
      id: c.id,
      videoUrl: c.videoUrl,
      tier: c.tier,
      payoutPerView: c.payoutPerView,
      pollQuestion: c.pollQuestion || '',
      viewsDelivered: c.viewsDelivered || 0,
      viewsPurchased: c.viewsPurchased,
    }));
    return new Response(JSON.stringify({ ok: true, count: campaigns.length, campaigns }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'list_failed', detail: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
