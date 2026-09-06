import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ViewBoost — the verification engine. The ONLY place wallet credits are created.
// A watch session is credited only if:
//   1. viewer is active
//   2. campaign is active with undelivered views
//   3. viewedDurationSec >= 80% of videoDurationSec (playback pauses on tab blur, so this is real watch time)
//   4. tabVisiblePercent >= 99 (PageVisibility API telemetry)
//   5. this viewer has no prior verified session on this campaign
//   6. this device fingerprint was not already used on this campaign
// Failures are recorded (rejected/flagged) for the human review queue — never silently dropped.

const MIN_COMPLETION = 0.80;
const MIN_TAB_VISIBLE = 99;

const r2 = (n: number) => Math.round(n * 100) / 100;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const b = await req.json().catch(() => ({}));
  const { campaignId, viewerId, deviceFingerprint, videoDurationSec, viewedDurationSec, tabVisiblePercent, pollAnswer, pollRating } = b;

  if (!campaignId || !viewerId || !deviceFingerprint) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_params', required: ['campaignId', 'viewerId', 'deviceFingerprint'] }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const recordSession = async (status: string, reason: string, payoutInr: number) => {
    await base44.asServiceRole.entities.WatchSession.create({
      campaignId, viewerId, deviceFingerprint,
      videoDurationSec: videoDurationSec || 0,
      viewedDurationSec: viewedDurationSec || 0,
      tabVisiblePercent: tabVisiblePercent ?? 0,
      pollAnswer: pollAnswer || '', pollRating: pollRating || null,
      status, rejectionReason: reason, payoutInr: status === 'verified' ? payoutInr : 0,
    });
  };

  try {
    // 1. viewer
    let viewer;
    try {
      viewer = await base44.asServiceRole.entities.Viewer.get(viewerId);
    } catch (_e) {
      return new Response(JSON.stringify({ ok: false, error: 'viewer_not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    if (viewer.status !== 'active') {
      await recordSession('rejected', 'viewer_' + viewer.status, 0);
      return new Response(JSON.stringify({ ok: false, error: 'viewer_not_active', status: viewer.status }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. campaign
    let campaign;
    try {
      campaign = await base44.asServiceRole.entities.Campaign.get(campaignId);
    } catch (_e) {
      return new Response(JSON.stringify({ ok: false, error: 'campaign_not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    if (campaign.status !== 'active') {
      await recordSession('rejected', 'campaign_' + campaign.status, 0);
      return new Response(JSON.stringify({ ok: false, error: 'campaign_not_active', status: campaign.status }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. completion check
    if (!videoDurationSec || !viewedDurationSec || viewedDurationSec / videoDurationSec < MIN_COMPLETION) {
      await recordSession('rejected', 'watch_below_80_percent', 0);
      return new Response(JSON.stringify({ ok: false, error: 'watch_below_80_percent', viewedDurationSec: viewedDurationSec || 0, videoDurationSec: videoDurationSec || 0 }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. tab visibility check
    if (tabVisiblePercent === undefined || tabVisiblePercent < MIN_TAB_VISIBLE) {
      await recordSession('flagged', 'tab_hidden_during_watch', 0);
      return new Response(JSON.stringify({ ok: false, error: 'session_flagged_for_review', reason: 'tab_hidden_during_watch' }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. duplicate viewer on this campaign
    const byViewer = (await base44.asServiceRole.entities.WatchSession.filter({ campaignId, viewerId })) || [];
    if (byViewer.some((s: any) => s.status === 'verified')) {
      await recordSession('rejected', 'duplicate_view_by_viewer', 0);
      return new Response(JSON.stringify({ ok: false, error: 'duplicate_view_by_viewer' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    // 6. duplicate device fingerprint on this campaign (different account, same device = sybil)
    const byFingerprint = (await base44.asServiceRole.entities.WatchSession.filter({ campaignId, deviceFingerprint })) || [];
    if (byFingerprint.some((s: any) => s.viewerId !== viewerId)) {
      await recordSession('flagged', 'device_fingerprint_reuse', 0);
      return new Response(JSON.stringify({ ok: false, error: 'session_flagged_for_review', reason: 'device_fingerprint_reuse' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    if ((campaign.viewsDelivered || 0) >= campaign.viewsPurchased) {
      await recordSession('rejected', 'campaign_fully_delivered', 0);
      return new Response(JSON.stringify({ ok: false, error: 'campaign_fully_delivered' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // === ALL CHECKS PASSED — credit the wallet (server-side only) ===
    const payout = r2(campaign.payoutPerView);
    const newBalance = r2((viewer.walletBalanceInr || 0) + payout);

    await recordSession('verified', '', payout);

    await base44.asServiceRole.entities.Viewer.update(viewerId, {
      walletBalanceInr: newBalance,
      totalEarnedInr: r2((viewer.totalEarnedInr || 0) + payout),
      completedTasks: (viewer.completedTasks || 0) + 1,
    });

    await base44.asServiceRole.entities.WalletTransaction.create({
      viewerId, type: 'credit', amountInr: payout,
      reason: 'verified_watch_session', campaignId,
      balanceAfterInr: newBalance,
    });

    const delivered = (campaign.viewsDelivered || 0) + 1;
    await base44.asServiceRole.entities.Campaign.update(campaignId, {
      viewsDelivered: delivered,
      status: delivered >= campaign.viewsPurchased ? 'completed' : 'active',
    });

    return new Response(JSON.stringify({
      ok: true, status: 'verified', payoutInr: payout,
      walletBalanceInr: newBalance,
      campaignViewsDelivered: delivered,
      campaignViewsPurchased: campaign.viewsPurchased,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'verification_failed', detail: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
