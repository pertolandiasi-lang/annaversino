# Vulvaverse Site Clone

Static website recreation of the Vulvaverse site, organized for simple GitHub upload and static hosting.

## Structure

- `index.html` - main page markup
- `styles.css` - site styling
- `script.js` - interactions and background motion
- `assets/vulvaverse/` - images used by the live site
- `archive/legacy-unused/` - old files kept for reference, not used by the current site

## Run Locally

From the project folder:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy

This project is static, so it can be uploaded directly to:

- GitHub Pages
- Netlify
- Vercel static hosting
- any standard web server

## Notes

- The current live site only uses files inside `assets/vulvaverse/`
- Archived files are intentionally separated so the repository stays clean without losing earlier material
- Google Sheets contact intake setup files live in `integrations/google-apps-script/`
