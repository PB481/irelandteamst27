// Shared storage for the ST27 site: the team form board, comment threads and posted rounds.
// The site gate (edge-functions/gate.js) keeps signed-out visitors away.
// Writing needs the team passcode (TEAM_CODE), from the sign-in cookie or a header.
import { getStore } from "@netlify/blobs";
import { signedIn } from "../lib/auth.mjs";

const PLAYERS = ["pb", "baz", "stee", "boothy", "pricey", "carlo", "kev"];
const STATUSES = ["good", "little", "off"];
const TARGET = /^[a-z0-9-]{1,40}$/;
const NOTE_MAX = 80;
const NAME_MAX = 30;
const TEXT_MAX = 500;
const THREAD_MAX = 200;
const COURSE_MAX = 60;
const ROUND_NOTE_MAX = 300;
const ROUNDS_MAX = 500;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function readBody(req) {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}

// Returns a clean round, or an error code string.
function cleanRound(b) {
  const date = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : "";
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  if (!date || date < "2020-01-01" || date > tomorrow) return "bad_date";
  const course = clean(b.course, COURSE_MAX);
  if (!course) return "missing_course";
  const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
  const points = int(b.points, 0, 60);
  const gross = int(b.gross, 50, 160);
  if (points === null && gross === null) return "missing_score";
  const hcp =
    typeof b.hcp === "number" && Number.isFinite(b.hcp) && b.hcp >= -10 && b.hcp <= 54
      ? Math.round(b.hcp * 10) / 10
      : null;
  return { date, course, points, gross, hcp, comment: clean(b.comment, ROUND_NOTE_MAX) };
}

async function removeById(store, key, list, id) {
  const next = list.filter((x) => x.id !== id);
  if (next.length) await store.setJSON(key, next);
  else await store.delete(key);
  return json(next);
}

async function checkCode(req) {
  const code = Netlify.env.get("TEAM_CODE");
  if (!code) return json({ error: "not_configured" }, 503);
  if (req.headers.get("x-team-code") === code || (await signedIn(req, code))) return null;
  return json({ error: "bad_code" }, 401);
}

export default async (req) => {
  const [route, a, b] = new URL(req.url).pathname.split("/").filter(Boolean).slice(1);
  const store = getStore({ name: "st27", consistency: "strong" });

  try {
    if (req.method === "GET" && route === "state") {
      const form = {};
      const rounds = {};
      await Promise.all(
        PLAYERS.map(async (p) => {
          const [d, r] = await Promise.all([
            store.get(`form/${p}`, { type: "json" }),
            store.get(`rounds/${p}`, { type: "json" }),
          ]);
          if (d) form[p] = d;
          if (Array.isArray(r) && r.length) rounds[p] = r;
        })
      );
      const comments = {};
      const { blobs } = await store.list({ prefix: "comments/" });
      await Promise.all(
        blobs.map(async ({ key }) => {
          const list = await store.get(key, { type: "json" });
          if (Array.isArray(list) && list.length) comments[key.slice("comments/".length)] = list;
        })
      );
      return json({ form, comments, rounds });
    }

    if (req.method === "POST" && route === "login") {
      return (await checkCode(req)) || json({ ok: true });
    }

    // The WhatsApp invite link is set as WHATSAPP_URL in Netlify and only
    // handed out with the team passcode. Anyone can see whether it exists.
    if (req.method === "GET" && route === "chat") {
      const url = Netlify.env.get("WHATSAPP_URL") || "";
      if (!/^https:\/\/(chat\.whatsapp\.com|wa\.me)\/\S+$/.test(url)) return json({ configured: false });
      return (await checkCode(req)) ? json({ configured: true }) : json({ configured: true, url });
    }

    const denied = await checkCode(req);
    if (denied) return denied;

    if (req.method === "PUT" && route === "form" && PLAYERS.includes(a)) {
      const body = await readBody(req);
      const key = `form/${a}`;
      const cur = (await store.get(key, { type: "json" })) || {};
      const next = {
        status: STATUSES.includes(cur.status) ? cur.status : null,
        note: typeof cur.note === "string" ? cur.note : "",
      };
      if ("status" in body) next.status = STATUSES.includes(body.status) ? body.status : null;
      if ("note" in body) next.note = clean(body.note, NOTE_MAX);
      next.updatedAt = new Date().toISOString();
      await store.setJSON(key, next);
      return json(next);
    }

    if (route === "comments" && TARGET.test(a || "")) {
      const key = `comments/${a}`;
      const list = (await store.get(key, { type: "json" })) || [];

      if (req.method === "POST") {
        const body = await readBody(req);
        const name = clean(body.name, NAME_MAX);
        const text = clean(body.text, TEXT_MAX);
        if (!name || !text) return json({ error: "missing" }, 400);
        if (list.length >= THREAD_MAX) return json({ error: "full" }, 409);
        list.push({ id: crypto.randomUUID(), name, text, at: new Date().toISOString() });
        await store.setJSON(key, list);
        return json(list);
      }

      if (req.method === "DELETE" && b) return await removeById(store, key, list, b);
    }

    if (route === "rounds" && PLAYERS.includes(a)) {
      const key = `rounds/${a}`;
      const list = (await store.get(key, { type: "json" })) || [];

      if (req.method === "POST") {
        const round = cleanRound(await readBody(req));
        if (typeof round === "string") return json({ error: round }, 400);
        if (list.length >= ROUNDS_MAX) return json({ error: "full" }, 409);
        list.push({ id: crypto.randomUUID(), ...round, at: new Date().toISOString() });
        await store.setJSON(key, list);
        return json(list);
      }

      if (req.method === "DELETE" && b) return await removeById(store, key, list, b);
    }

    return json({ error: "not_found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
};

export const config = { path: "/api/*" };
