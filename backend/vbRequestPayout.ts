import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ViewBoost — viewer requests a UPI cashout. Enforces the ₹25 minimum threshold,
// moves the full balance into a pending Payout, debits the wallet + writes the ledger.
// Actual UPI transfer happens in the nightly batch (vbProcessPayoutBatch).

const MIN_PAYOUT_INR = 25;

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
    if (viewer.status !== 'active') {
      return new Response(JSON.stringify({ ok: false, error: 'viewer_not_active' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    if (!viewer.upiId) {
      return new Response(JSON.stringify({ ok: false, error: 'no_upi_id_on_file' }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    const balance = Math.round((viewer.walletBalanceInr || 0) * 100) / 100;
    if (balance < MIN_PAYOUT_INR) {
      return new Response(JSON.stringify({
        ok: false, error: 'below_minimum_threshold',
        balanceInr: balance, minimumInr: MIN_PAYOUT_INR,
        needInr: Math.round((MIN_PAYOUT_INR - balance) * 100) / 100,
      }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    const payout = await base44.asServiceRole.entities.Payout.create({
      viewerId, upiId: viewer.upiId, amountInr: balance, status: 'pending',
    });

    await base44.asServiceRole.entities.Viewer.update(viewerId, { walletBalanceInr: 0 });

    await base44.asServiceRole.entities.WalletTransaction.create({
      viewerId, type: 'debit', amountInr: balance,
      reason: 'payout_requested', payoutId: payout.id,
      balanceAfterInr: 0,
    });

    return new Response(JSON.stringify({
      ok: true, payoutId: payout.id, amountInr: balance,
      upiId: viewer.upiId, status: 'pending',
      note: 'Payout queued — processed in the nightly UPI batch.',
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'payout_request_failed', detail: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
