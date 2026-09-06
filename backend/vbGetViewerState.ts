import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ViewBoost — viewer wallet screen: balance, lifetime earnings, recent ledger + payouts.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { viewerId } = await req.json().catch(() => ({}));

  if (!viewerId) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_viewerId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    let viewer;
    try {
      viewer = await base44.asServiceRole.entities.Viewer.get(viewerId);
    } catch (_e) {
      return new Response(JSON.stringify({ ok: false, error: 'viewer_not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const txns = (await base44.asServiceRole.entities.WalletTransaction.filter({ viewerId })) || [];
    const payouts = (await base44.asServiceRole.entities.Payout.filter({ viewerId })) || [];

    const byDate = (a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime();

    return new Response(JSON.stringify({
      ok: true,
      viewer: {
        id: viewer.id, name: viewer.name, email: viewer.email, upiId: viewer.upiId,
        kycTier: viewer.kycTier, status: viewer.status,
        walletBalanceInr: viewer.walletBalanceInr || 0,
        totalEarnedInr: viewer.totalEarnedInr || 0,
        completedTasks: viewer.completedTasks || 0,
        streakDays: viewer.streakDays || 0,
      },
      transactions: (txns || []).sort(byDate).slice(0, 25).map((t: any) => ({
        type: t.type, amountInr: t.amountInr, reason: t.reason,
        balanceAfterInr: t.balanceAfterInr, date: t.created_date,
      })),
      payouts: (payouts || []).sort(byDate).slice(0, 25).map((p: any) => ({
        amountInr: p.amountInr, status: p.status, batchId: p.batchId,
        upiId: p.upiId, date: p.created_date, processedAt: p.processedAt,
      })),
      minimumPayoutInr: 25,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'state_failed', detail: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
