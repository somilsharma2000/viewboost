import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ViewBoost — nightly UPI payout batch. Marks all pending payouts as processed
// under one batch ID. In production, swap the inner loop for RazorpayX/Cashfree
// Payout API calls (keep UPI_PAYOUT credentials as platform secrets).

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const pending = await base44.asServiceRole.entities.Payout.filter({ status: 'pending' });
    const payouts = pending || [];
    const batchId = 'UPIBATCH-' + new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const now = new Date().toISOString();

    let totalInr = 0;
    for (const p of payouts) {
      await base44.asServiceRole.entities.Payout.update(p.id, {
        status: 'processed', batchId, processedAt: now,
      });
      totalInr += p.amountInr || 0;
    }

    return new Response(JSON.stringify({
      ok: true, batchId,
      payoutsProcessed: payouts.length,
      totalInr: Math.round(totalInr * 100) / 100,
      processedAt: now,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'batch_failed', detail: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
