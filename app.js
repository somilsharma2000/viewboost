/* ============================================================
   ViewBoost — standalone frontend app
   Runs on any static host (GitHub Pages, Netlify, anywhere).
   Talks to the Base44 backend functions (see config.js).
   ============================================================ */

// ---------- API helper ----------
async function api(fn, body = {}) {
  try {
    const res = await fetch(`${API_BASE}/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: "network_error" };
  }
}

// ---------- Utils ----------
const $ = (sel) => document.querySelector(sel);
const inr = (n) => `₹${Number(n).toFixed(2)}`;

function toast(msg, ms = 3200) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("visible");
  setTimeout(() => t.classList.remove("visible"), ms);
}

function getViewerId() { return localStorage.getItem("vb_viewer_id"); }
function setViewerId(id) { localStorage.setItem("vb_viewer_id", id); }

// ---------- Device fingerprint (canvas + WebGL + screen + UA) ----------
function deviceFingerprint() {
  let cached = localStorage.getItem("vb_fp");
  if (cached) return cached;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200; canvas.height = 60;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "16px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(10, 10, 80, 30);
    ctx.fillStyle = "#069";
    ctx.fillText("ViewBoost-fp", 4, 17);
    const gl = document.createElement("canvas").getContext("webgl");
    const glInfo = gl
      ? [gl.getParameter(gl.RENDERER), gl.getParameter(gl.VERSION), gl.getExtension("WEBGL_debug_renderer_info") ? gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_VENDOR_WEBGL : ""].join("~")
      : "nogl";
    const raw = [canvas.toDataURL(), glInfo, navigator.userAgent, screen.width + "x" + screen.height, screen.colorDepth, new Date().getTimezoneOffset()].join("|");
    // simple djb2 hash
    let h1 = 5381;
    for (let i = 0; i < raw.length; i++) h1 = ((h1 << 5) + h1 + raw.charCodeAt(i)) >>> 0;
    let h2 = 52711;
    for (let i = raw.length - 1; i >= 0; i--) h2 = ((h2 << 5) + h2 + raw.charCodeAt(i)) >>> 0;
    cached = `fp-${h1.toString(36)}-${h2.toString(36)}`;
  } catch (e) {
    cached = `fp-unknown-${Date.now()}`;
  }
  localStorage.setItem("vb_fp", cached);
  return cached;
}

// ---------- Router ----------
const sections = ["home", "creator", "earn", "wallet"];
function nav(page) {
  sections.forEach((s) => {
    $(`#section-${s}`).classList.toggle("visible", s === page);
    $(`#nav-${s}`)?.classList.toggle("active", s === page);
  });
  window.scrollTo(0, 0);
  if (page === "earn") loadEarn();
  if (page === "wallet") loadWallet();
}

// ============================================================
// CREATOR — buy a campaign
// ============================================================
let selectedTier = "Starter";

function renderTiers() {
  const wrap = $("#tier-select");
  wrap.innerHTML = Object.entries(TIERS).map(([name, t]) => `
    <div class="tier-card ${name === selectedTier ? "selected" : ""}" data-tier="${name}">
      <div class="t-name">${name}</div>
      <div class="t-price">${inr(t.priceInr)}</div>
      <div class="t-meta">${t.views.toLocaleString("en-IN")} verified watch sessions<br>Delivered over ~${t.dripHours}h</div>
    </div>`).join("");
  wrap.querySelectorAll(".tier-card").forEach((el) =>
    el.addEventListener("click", () => { selectedTier = el.dataset.tier; renderTiers(); })
  );
}

async function createCampaign(e) {
  e.preventDefault();
  const btn = $("#btn-create");
  btn.disabled = true; btn.textContent = "Creating…";
  const r = await api("vbCreateCampaign", {
    videoUrl: $("#c-video").value.trim(),
    tier: selectedTier,
    creatorEmail: $("#c-email").value.trim(),
    pollQuestion: $("#c-poll").value.trim(),
  });
  btn.disabled = false; btn.textContent = "Launch Campaign";
  if (!r.ok) return toast(`Error: ${r.error}`);
  const t = TIERS[selectedTier];
  $("#creator-result").innerHTML = `
    <div class="banner banner-ok">
      <b>🎉 Campaign launched!</b><br>
      Campaign ID: <b>${r.campaignId}</b><br>
      ${t.views.toLocaleString("en-IN")} verified watch sessions for ${inr(t.priceInr)} —
      now live for viewers (delivery paced over ~${r.dripHours}h).<br>
      <span class="small">Complete your payment from the confirmation email to keep the campaign active.</span>
    </div>`;
  $("#creator-result").classList.remove("hidden");
}

// ============================================================
// EARN — viewer onboarding + campaign feed + watch player
// ============================================================
async function loadEarn() {
  if (!getViewerId()) {
    $("#earn-auth").classList.remove("hidden");
    $("#earn-main").classList.add("hidden");
    return;
  }
  $("#earn-auth").classList.add("hidden");
  $("#earn-main").classList.remove("hidden");
  const r = await api("vbListCampaigns");
  if (!r.ok) return toast(`Error: ${r.error}`);
  const list = $("#campaign-list");
  if (!r.campaigns.length) {
    list.innerHTML = `<p class="muted">No active campaigns right now — check back soon. New campaigns land daily.</p>`;
    return;
  }
  list.innerHTML = r.campaigns.map((c) => `
    <div class="campaign-item" style="margin-bottom:14px">
      <div>
        <div class="c-title">${escapeHtml(c.videoUrl)}</div>
        <div class="c-meta">
          <span class="pill pill-purple">${c.tier}</span>
          <span class="pill pill-green">Earn ${inr(c.payoutPerView)} per verified watch</span>
          &nbsp;${c.viewsDelivered.toLocaleString("en-IN")} / ${c.viewsPurchased.toLocaleString("en-IN")} delivered
        </div>
      </div>
      <button class="btn btn-green" onclick="startWatch('${c.id}')">▶ Watch &amp; Earn</button>
    </div>`).join("");
}

async function registerViewer(e) {
  e.preventDefault();
  const btn = $("#btn-register");
  btn.disabled = true; btn.textContent = "Signing up…";
  const r = await api("vbRegisterViewer", {
    email: $("#v-email").value.trim(),
    name: $("#v-name").value.trim(),
    upiId: $("#v-upi").value.trim(),
  });
  btn.disabled = false; btn.textContent = "Start Earning";
  if (!r.ok) return toast(`Error: ${r.error}`);
  setViewerId(r.viewerId);
  toast(r.existing ? "Welcome back!" : "Account created — start watching!");
  loadEarn();
}

// ---------- Watch session engine ----------
let W = null; // active watch state

function ytId(url) {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

async function startWatch(campaignId) {
  const r = await api("vbListCampaigns");
  const c = r.ok ? r.campaigns.find((x) => x.id === campaignId) : null;
  if (!c) return toast("Campaign no longer active");
  const vid = ytId(c.videoUrl);
  if (!vid) return toast("Unsupported video URL");

  W = {
    campaign: c,
    videoId: vid,
    player: null,
    videoDurationSec: 0,
    viewedDurationSec: 0,   // accumulates ONLY while playing AND tab visible
    visibleMs: 0,
    totalMs: 0,              // from player start to poll
    lastTick: null,
    done: false,
  };

  $("#watch-campaign-pill").textContent = c.tier;
  $("#watch-poll-question").textContent = c.pollQuestion || "Rate this video 1-5 and tell us what would make you subscribe.";
  $("#watch-result").classList.add("hidden");
  $("#form-poll").classList.add("hidden");
  $("#watch-note").classList.remove("hidden");
  pollRating = 0;
  setStars(0);
  $("#poll-answer").value = "";
  const sBtn = $("#btn-submit-watch");
  sBtn.disabled = false; sBtn.textContent = "Submit & Get Paid";
  $("#modal-watch").classList.add("visible");

  // YouTube IFrame API
  if (!window.YT) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => buildPlayer(vid);
  } else {
    buildPlayer(vid);
  }
}

function buildPlayer(vid) {
  if (!W) return; // modal closed before player ready
  W.player = new YT.Player("yt-player", {
    videoId: vid,
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: (e) => {
        W.videoDurationSec = Math.round(e.target.getDuration());
        W.lastTick = performance.now();
        updateWatchStats();
        e.target.playVideo();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED && !W.done) finishWatch();
      },
    },
  });
}

// tick loop — the anti-cheat core on the client side
setInterval(() => {
  if (!W || W.done || !W.player?.getCurrentTime) return;
  const now = performance.now();
  const dt = now - W.lastTick;
  W.lastTick = now;
  W.totalMs += dt;

  const playing = W.player.getPlayerState() === YT.PlayerState.PLAYING;
  const visible = document.visibilityState === "visible";
  if (playing && visible) {
    W.viewedDurationSec += dt / 1000;
    W.visibleMs += dt;
  }
  updateWatchStats();

  // completion reached? (video ended OR >= 80% watched — server re-validates)
  if (!W.done && W.videoDurationSec > 0 && W.viewedDurationSec / W.videoDurationSec >= 0.8) finishWatch();
}, 250);

document.addEventListener("visibilitychange", () => {
  if (!W || W.done) return;
  if (document.visibilityState === "hidden" && W.player?.getPlayerState?.() === YT.PlayerState.PLAYING) {
    W.player.pauseVideo();
    $("#watch-warn").classList.remove("hidden");
    setTimeout(() => $("#watch-warn")?.classList.add("hidden"), 4000);
  }
});

function updateWatchStats() {
  if (!W || !W.videoDurationSec) return;
  const pct = Math.min(100, (W.viewedDurationSec / W.videoDurationSec) * 100);
  $("#watch-progress > div").style.width = `${pct.toFixed(1)}%`;
  $("#watch-pct").textContent = `${pct.toFixed(1)}%`;
  $("#watch-sec").textContent = `${Math.round(W.viewedDurationSec)}s / ${W.videoDurationSec}s`;
}

function finishWatch() {
  if (!W || W.done) return;
  W.done = true;
  W.player?.stopVideo?.();
  updateWatchStats();
  $("#watch-note").classList.add("hidden");
  $("#form-poll").classList.remove("hidden");
}

// ---------- Poll + submit verification ----------
let pollRating = 0;
function setStars(n) {
  pollRating = n;
  document.querySelectorAll(".star").forEach((s, i) => s.classList.toggle("on", i < n));
}
document.querySelectorAll(".star").forEach((s, i) =>
  s.addEventListener("click", () => setStars(i + 1))
);

async function submitWatch(e) {
  e.preventDefault();
  if (!W) return;
  if (!pollRating) return toast("Please tap a star rating first");
  const btn = $("#btn-submit-watch");
  btn.disabled = true; btn.textContent = "Verifying…";

  const tabVisiblePercent = W.totalMs > 0 ? (W.visibleMs / W.totalMs) * 100 : 0;
  const r = await api("vbVerifyWatchSession", {
    campaignId: W.campaign.id,
    viewerId: getViewerId(),
    deviceFingerprint: deviceFingerprint(),
    videoDurationSec: W.videoDurationSec,
    viewedDurationSec: Math.round(W.viewedDurationSec),
    tabVisiblePercent: Math.round(tabVisiblePercent * 10) / 10,
    pollAnswer: $("#poll-answer").value.trim(),
    pollRating,
  });
  btn.disabled = false; btn.textContent = "Submit & Get Paid";

  const box = $("#watch-result");
  box.classList.remove("hidden", "banner-ok", "banner-err", "banner-warn");
  if (r.ok) {
    box.classList.add("banner-ok");
    box.innerHTML = `<b>✅ Verified — you earned ${inr(r.payoutInr)}!</b><br>
      Wallet balance: <b>${inr(r.walletBalanceInr)}</b> — cash out any time at ${inr(MIN_PAYOUT_INR)}.
      <br><span class="small">Watch session ${r.campaignViewsDelivered}/${r.campaignViewsPurchased} on this campaign.</span>`;
  } else if (r.error === "session_flagged_for_review") {
    box.classList.add("banner-warn");
    box.innerHTML = `<b>⏳ Session flagged for review</b> (${r.reason})<br><span class="small">Our fraud checks noticed something. A human reviews flagged sessions before payouts.</span>`;
  } else {
    const reasons = {
      watch_below_80_percent: "you didn't complete at least 80% of the video",
      duplicate_view_by_viewer: "you already watched this campaign",
      campaign_not_active: "this campaign is no longer active",
      campaign_fully_delivered: "all views on this campaign were already delivered",
      below_minimum_threshold: "payout threshold not met",
      viewer_not_found: "your account could not be found — refresh the page and sign up again",
      network_error: "network hiccup — check your connection and try again",
    };
    if (r.error === "viewer_not_found") { localStorage.removeItem("vb_viewer_id"); }
    box.classList.add("banner-err");
    box.innerHTML = `<b>❌ Session not credited</b><br><span class="small">${reasons[r.error] || r.error}. Keep watching — the next one can still pay.</span>`;
  }
}

function closeWatch() {
  $("#modal-watch").classList.remove("visible");
  if (W?.player?.destroy) W.player.destroy();
  W = null;
  $("#yt-player").outerHTML = '<div id="yt-player"></div>';
  loadEarn();
}

// ============================================================
// WALLET — balance, ledger, cashout
// ============================================================
async function loadWallet() {
  if (!getViewerId()) {
    $("#wallet-auth-note").classList.remove("hidden");
    $("#wallet-main").classList.add("hidden");
    return;
  }
  $("#wallet-auth-note").classList.add("hidden");
  const r = await api("vbGetViewerState", { viewerId: getViewerId() });
  if (!r.ok) {
    if (r.error === "viewer_not_found") { localStorage.removeItem("vb_viewer_id"); }
    $("#wallet-main").classList.add("hidden");
    return toast(`Error: ${r.error}`);
  }
  const v = r.viewer;
  $("#wallet-main").classList.remove("hidden");
  $("#w-balance").textContent = inr(v.walletBalanceInr);
  $("#w-total").textContent = inr(v.totalEarnedInr);
  $("#w-tasks").textContent = v.completedTasks;
  $("#w-upi").textContent = v.upiId || "— add UPI at signup —";
  $("#w-streak").textContent = `${v.streakDays} day${v.streakDays === 1 ? "" : "s"}`;

  const btn = $("#btn-cashout");
  const need = Math.max(0, MIN_PAYOUT_INR - v.walletBalanceInr);
  btn.disabled = v.walletBalanceInr < MIN_PAYOUT_INR;
  $("#cashout-note").textContent = v.walletBalanceInr < MIN_PAYOUT_INR
    ? `Watch ${Math.ceil(need / 0.12)} more videos (~${inr(need)} more) to unlock cashout`
    : "Full balance is paid out in one UPI transfer — processed nightly at 12:30am IST";

  // ledger
  $("#w-txns").innerHTML = r.transactions.length
    ? r.transactions.map((t) => `
      <tr>
        <td class="muted">${new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
        <td>${t.type === "credit" ? "⬆" : "⬇"} ${t.reason.replace(/_/g, " ")}</td>
        <td style="color:${t.type === "credit" ? "var(--green)" : "var(--red)"}">${t.type === "credit" ? "+" : "−"}${inr(t.amountInr)}</td>
        <td class="muted">${inr(t.balanceAfterInr)}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" class="muted center" style="padding:24px">No transactions yet — watch your first video!</td></tr>`;

  // payouts
  $("#w-payouts").innerHTML = r.payouts.length
    ? r.payouts.map((p) => `
      <tr>
        <td class="muted">${new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
        <td>${inr(p.amountInr)}</td>
        <td>${p.upiId}</td>
        <td><span class="pill ${p.status === "processed" ? "pill-green" : "pill-purple"}">${p.status}</span></td>
      </tr>`).join("")
    : `<tr><td colspan="4" class="muted center" style="padding:24px">No payouts yet.</td></tr>`;
}

async function requestCashout() {
  const btn = $("#btn-cashout");
  btn.disabled = true; btn.textContent = "Requesting…";
  const r = await api("vbRequestPayout", { viewerId: getViewerId() });
  btn.disabled = false; btn.textContent = "Cash Out to UPI";
  if (!r.ok) return toast(r.error === "below_minimum_threshold"
    ? `Need ${inr(r.needInr)} more to reach the ${inr(MIN_PAYOUT_INR)} minimum` : `Error: ${r.error}`);
  toast(`💸 ${inr(r.amountInr)} cashout queued to ${r.upiId} — paid tonight!`);
  loadWallet();
}

// ---------- misc ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", () => {
  renderTiers();
  $("#form-creator").addEventListener("submit", createCampaign);
  $("#form-register").addEventListener("submit", registerViewer);
  $("#form-poll").addEventListener("submit", submitWatch);
  $("#btn-cashout").addEventListener("click", requestCashout);
});
