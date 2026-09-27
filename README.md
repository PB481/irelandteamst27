# irelandteamst27

The ST27 Irish Team site, hosted on Netlify from the `main` branch.

- `index.html` is the whole site.
- `netlify/functions/api.mjs` saves the team form board, comments and posted rounds in Netlify Blobs.
- Handicap tracking starts from the ST26 handicaps, set in `SQUAD` in `index.html`.

## Team passcode

Anyone can view the site. Saving a form check or a comment needs the team passcode.
Set it in Netlify under **Site configuration → Environment variables** as `TEAM_CODE`,
then redeploy. To change the passcode, update the variable and redeploy.

## Team chat

The "Team chat" button opens the team WhatsApp group. Set the group's invite link
(`https://chat.whatsapp.com/...`) in Netlify as `WHATSAPP_URL`, then redeploy. The
link is only given out to people who have entered the team passcode. Without it
set, the button stays hidden.

## Weather

Live Arran forecasts (Shiskine, Lamlash, Brodick) come from Open-Meteo in the
browser. No key needed.
