import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ViewBoost — viewer onboarding. Creates (or returns) a Viewer by email, with UPI ID.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { email, name, upiId } = await req.json().catch(() => ({}));

  if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_upi_id', example: 'name@upi' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const existing = (await base44.asServiceRole.entities.Viewer.filter({ email })) || [];
    if (existing.length > 0) {
      const v = existing[0];
      if (v.status !== 'active') {
        return new Response(JSON.stringify({ ok: false, error: 'viewer_not_active', status: v.status }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ ok: true, viewerId: v.id, existing: true, walletBalanceInr: v.walletBalanceInr || 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    const viewer = await base44.asServiceRole.entities.Viewer.create({
      email, name: name || '', upiId: upiId || '',
      kycTier: upiId ? 'low' : 'none',
      walletBalanceInr: 0, totalEarnedInr: 0,
      completedTasks: 0, streakDays: 0, status: 'active',
    });

    return new Response(JSON.stringify({ ok: true, viewerId: viewer.id, existing: false, walletBalanceInr: 0 }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'register_failed', detail: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
