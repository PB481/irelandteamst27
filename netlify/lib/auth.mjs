// Sign-in cookie shared by the site gate and the API. The cookie holds a hash
// of the team passcode, so changing TEAM_CODE signs everyone out.
export const COOKIE = "st27_auth";

export async function tokenFor(pass) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("st27:" + pass));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function readCookie(req, name) {
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

export async function signedIn(req, pass) {
  return Boolean(pass) && readCookie(req, COOKIE) === (await tokenFor(pass));
}
