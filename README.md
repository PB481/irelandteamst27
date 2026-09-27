# irelandteamst27

The ST27 Irish Team site, hosted on Netlify from the `main` branch.

- `index.html` is the whole site.
- `netlify/functions/api.mjs` saves the team form board and comments in Netlify Blobs.

## Team passcode

Anyone can view the site. Saving a form check or a comment needs the team passcode.
Set it in Netlify under **Site configuration → Environment variables** as `TEAM_CODE`,
then redeploy. To change the passcode, update the variable and redeploy.
