# irelandteamst27

The ST27 Irish Team site, hosted on Netlify from the `main` branch.

- `index.html` is the whole site.
- `netlify/functions/api.mjs` saves the team form board, comments and posted rounds in Netlify Blobs.
- Handicap tracking starts from the ST26 handicaps, set in `SQUAD` in `index.html`.

## Site password

The whole site is behind a password: the team passcode, set in Netlify under
**Site configuration → Environment variables** as `TEAM_CODE`. Nothing (pages,
data or the chat link) is served until it has been entered, and each device then
stays signed in for 180 days. The gate is `netlify/edge-functions/gate.js`.

Changing `TEAM_CODE` and redeploying signs everyone out, so do that if the
password ever gets out.

## Team chat

The "Team chat" button opens the team WhatsApp group. Set the group's invite link
(`https://chat.whatsapp.com/...`) in Netlify as `WHATSAPP_URL`, then redeploy. The
link is only given out to people who have entered the team passcode. Without it
set, the button stays hidden.

## Weather

Live Arran forecasts for all six ST27 courses come from Open-Meteo in the
browser. No key needed.
