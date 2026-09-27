// Password gate for the whole site. Nothing is served until the visitor has
// entered the team passcode (TEAM_CODE in Netlify). A cookie then keeps that
// device signed in.
import { COOKIE, signedIn, tokenFor } from "../lib/auth.mjs";

const MAX_AGE = 60 * 60 * 24 * 180; // 180 days

const safeNext = (v) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/";

const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export default async (request, context) => {
  const pass = Netlify.env.get("TEAM_CODE");
  const url = new URL(request.url);
  if (!pass) {
    return new Response("The site password hasn't been set up yet.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (url.pathname === "/login" && request.method === "POST") {
    const form = await request.formData().catch(() => null);
    const given = form ? String(form.get("password") || "").trim() : "";
    const next = safeNext(form ? String(form.get("next") || "") : "");
    if (given && given === pass) {
      return new Response(null, {
        status: 303,
        headers: {
          location: next,
          "set-cookie": `${COOKIE}=${await tokenFor(pass)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          "cache-control": "no-store",
        },
      });
    }
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return loginPage(next, true);
  }

  if (await signedIn(request, pass)) return context.next();

  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "signed_out" }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  return loginPage(safeNext(url.pathname + url.search), false);
};

export const config = { path: "/*" };

function loginPage(next, failed) {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>ST27 Irish Team</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@800;900&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;background:#0B2433;color:#fff}
.ld{position:fixed;inset:0;display:grid;place-items:end center;overflow:hidden}
.ld-scene{position:absolute;inset:0;width:100%;height:100%}
.ld-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,20,26,.2) 0%,rgba(6,20,26,0) 35%,rgba(6,20,26,.8) 100%)}
.ld-inner{position:relative;display:grid;justify-items:center;text-align:center;gap:14px;padding:24px 16px calc(56px + env(safe-area-inset-bottom,0px));width:100%;max-width:900px}
.ld-crest{filter:drop-shadow(0 4px 12px rgba(0,0,0,.4))}
.ld-eyebrow{font-weight:700;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#F7C08C}
h1{font-family:"Big Shoulders Display","Arial Narrow",Impact,sans-serif;font-weight:900;text-transform:uppercase;line-height:.85;margin:0;font-size:clamp(64px,15vw,168px);text-shadow:0 4px 30px rgba(0,0,0,.35);display:grid;justify-items:center}
h1 .yr{display:flex;align-items:center;gap:.25em;font-size:.5em;color:#F0954A;margin-top:.14em}
h1 .yr::before,h1 .yr::after{content:"";width:1.3em;height:.13em;border-radius:2px;background:linear-gradient(90deg,#169B62 0 33.3%,#FFFFFF 33.3% 66.6%,#FF883E 66.6%)}
form{display:grid;gap:10px;justify-items:center;width:100%;max-width:340px;margin-top:8px}
label{font-size:14px;color:rgba(255,255,255,.85)}
input{width:100%;font:inherit;font-size:17px;text-align:center;color:#0F2A21;background:#fff;border:2px solid transparent;border-radius:999px;padding:10px 18px}
input:focus-visible{outline:3px solid #F0954A;outline-offset:2px}
button{font-family:"Big Shoulders Display","Arial Narrow",Impact,sans-serif;font-weight:800;font-size:24px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#0E6B4C;border:2px solid #3FB488;border-radius:999px;padding:8px 44px;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.35)}
button:hover{background:#12805B}
button:focus-visible{outline:3px solid #F0954A;outline-offset:4px}
.err{margin:0;font-weight:700;color:#FFB4A8}
@keyframes ld-drift{from{transform:translateX(0)}to{transform:translateX(-240px)}}
@keyframes ld-shim{0%,100%{opacity:.2}50%{opacity:.9}}
.cloud{animation:ld-drift 70s linear infinite alternate}
.shim line{animation:ld-shim 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
</head><body>
<main class="ld">
  <svg class="ld-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="ld-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B2433"/><stop offset=".55" stop-color="#2F5866"/><stop offset=".8" stop-color="#C98A5A"/><stop offset="1" stop-color="#F2B176"/></linearGradient>
      <linearGradient id="ld-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27505A"/><stop offset="1" stop-color="#081A20"/></linearGradient>
      <radialGradient id="ld-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD9A8" stop-opacity=".95"/><stop offset=".35" stop-color="#F7B26E" stop-opacity=".5"/><stop offset="1" stop-color="#F7B26E" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="620" fill="url(#ld-sky)"/>
    <circle cx="1040" cy="585" r="240" fill="url(#ld-sun)"/>
    <g class="cloud" fill="#F3D2B0" opacity=".18"><ellipse cx="300" cy="190" rx="240" ry="26"/><ellipse cx="820" cy="120" rx="320" ry="22"/><ellipse cx="1350" cy="240" rx="260" ry="20"/><ellipse cx="1750" cy="160" rx="220" ry="18"/></g>
    <path fill="#3E6068" opacity=".85" d="M0 620 V560 C120 545 210 525 300 505 L380 472 L430 432 L470 398 L500 372 L530 388 L560 352 L592 330 L622 362 L662 346 L702 382 L760 402 L822 432 L900 470 L1000 500 L1100 520 L1200 540 L1300 553 L1420 565 L1600 575 V620 Z"/>
    <path fill="#1A3840" d="M0 620 V590 L150 580 L262 570 L342 556 L420 540 L482 521 L540 531 L602 515 L682 540 L760 560 L880 580 L1000 590 L1080 585 L1600 604 V620 Z"/>
    <path fill="#122C33" d="M1170 620 C1210 603 1255 578 1302 568 C1344 571 1374 592 1410 620 Z"/>
    <rect y="620" width="1600" height="280" fill="url(#ld-sea)"/>
    <path fill="#F7B26E" opacity=".28" d="M1000 620 H1080 L1120 900 H960 Z"/>
    <g class="shim" stroke="#F7C999" stroke-width="2" stroke-linecap="round" opacity=".5"><line x1="1328" y1="762" x2="1457" y2="762" style="animation-delay:1.1s"/><line x1="585" y1="690" x2="634" y2="690" style="animation-delay:0.3s"/><line x1="1105" y1="725" x2="1177" y2="725" style="animation-delay:1.5s"/><line x1="825" y1="686" x2="896" y2="686" style="animation-delay:3.6s"/><line x1="1005" y1="850" x2="1054" y2="850" style="animation-delay:2.9s"/><line x1="1305" y1="786" x2="1428" y2="786" style="animation-delay:0.3s"/><line x1="870" y1="838" x2="963" y2="838" style="animation-delay:3.0s"/><line x1="1346" y1="752" x2="1430" y2="752" style="animation-delay:0.0s"/><line x1="1316" y1="762" x2="1388" y2="762" style="animation-delay:0.6s"/><line x1="691" y1="796" x2="814" y2="796" style="animation-delay:0.9s"/><line x1="1073" y1="676" x2="1125" y2="676" style="animation-delay:3.9s"/><line x1="618" y1="873" x2="753" y2="873" style="animation-delay:3.2s"/><line x1="76" y1="838" x2="203" y2="838" style="animation-delay:2.1s"/><line x1="348" y1="757" x2="478" y2="757" style="animation-delay:0.6s"/><line x1="1106" y1="653" x2="1168" y2="653" style="animation-delay:3.9s"/><line x1="1331" y1="643" x2="1428" y2="643" style="animation-delay:3.1s"/><line x1="709" y1="867" x2="822" y2="867" style="animation-delay:2.3s"/><line x1="133" y1="718" x2="229" y2="718" style="animation-delay:3.5s"/><line x1="957" y1="730" x2="998" y2="730" style="animation-delay:1.4s"/><line x1="543" y1="685" x2="644" y2="685" style="animation-delay:1.4s"/><line x1="1057" y1="655" x2="1163" y2="655" style="animation-delay:1.0s"/><line x1="425" y1="835" x2="559" y2="835" style="animation-delay:2.0s"/><line x1="187" y1="725" x2="270" y2="725" style="animation-delay:3.1s"/><line x1="805" y1="727" x2="926" y2="727" style="animation-delay:0.5s"/><line x1="520" y1="843" x2="631" y2="843" style="animation-delay:2.8s"/><line x1="168" y1="716" x2="266" y2="716" style="animation-delay:1.9s"/></g>
  </svg>
  <div class="ld-shade"></div>
  <div class="ld-inner">
    <svg class="ld-crest" viewBox="0 0 40 46" width="64" height="74" aria-hidden="true"><path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="#0E6B4C" stroke="#FFFFFF" stroke-width="1.5"/><path d="M8 11 H32 V15 H8 Z" fill="#FFFFFF"/><path d="M8 17 H32 V21 H8 Z" fill="#E0782A"/><text x="20" y="34" text-anchor="middle" font-family="Big Shoulders Display, Arial Narrow, Impact, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">ST27</text></svg>
    <div class="ld-eyebrow">Squires' Trophy 2027 · Isle of Arran</div>
    <h1 aria-label="Ireland Team, ST27">Ireland Team<span class="yr">ST27</span></h1>
    <form method="post" action="/login">
      <label for="pw">Team members only. Enter the team password.</label>
      <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus${failed ? ' aria-describedby="err"' : ""}>
      ${failed ? '<p class="err" id="err" role="alert">That password isn’t right. Try again.</p>' : ""}
      <input type="hidden" name="next" value="${esc(next)}">
      <button type="submit">Enter</button>
    </form>
  </div>
</main>
<script>
  // Keep any #section in the link, and skip the welcome screen once signed in.
  var f=document.querySelector('form'), n=f.elements.next;
  if(location.hash) n.value=n.value.split('#')[0]+location.hash;
  f.addEventListener('submit',function(){try{sessionStorage.setItem('st27-entered','1');}catch(_){}});
</script>
</body></html>`;
  return new Response(html, {
    status: 401,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
