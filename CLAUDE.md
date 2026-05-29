# Vulvaverse

Anna Katharina's vulva-positive education / workshops / products site. Plain `index.html` + `styles.css` + `script.js`, **no build step, no framework**. Hosted on GitHub Pages — pushing to `main` deploys in ~1 min.

For deep context (palette, integrations, gotchas, what not to do), use the `vulvaverse` agent — it has the full reference. The essentials below auto-load every session.

## Workflow

- **Edit → commit → push is one task.** After every change: `git add <files>` → `git commit -m "<concise sentence-case>"` → `git push`. Don't wait to be asked.
- **Reply in 1–3 sentences.** Anna is non-technical and prefers short. No bulleted recaps, no "here's what I did" essays.
- **Match the existing commit style:** sentence-case, single line, no body, no Co-Authored-By footer.

## Critical reminders

- **iOS Safari URL bar cannot be programmatically collapsed.** No JS scroll trick works. If it looks bad, the fix is visual (theme-color + viewport-fit=cover, already applied).
- **Anna reviews on iPhone 15 Pro.** After meta-tag changes she must **close and reopen** the Safari tab, not just refresh. Say so explicitly. Desktop preview can't verify iOS-Safari-specific behavior.
- **Brand spelling:** "Vulvaverse" (not "Vulvaiverse"). "Vulvastic" is canonical, not a typo. Don't fix Anna's copy unless asked.

## Hard no's

- No build tooling, frameworks, package.json
- No CAPTCHA on the contact form (honeypot + 3s floor is the intentional anti-spam)
- No `backdrop-filter` on the sticky header or large content panels (Chrome flickers/chokes)
- Don't auto-close the mobile menu on scroll
- Don't programmatically dilate/re-stroke the logo PNGs — ship what Anna sends
- Don't paste the long Instagram-bio Ko-fi URL (use `?utm_source=website&utm_medium=products`)

## Where things live

- Site source: `index.html`, `styles.css`, `script.js`
- Contact form backend: `integrations/google-apps-script/Code.js` (mirror of the live Apps Script)
- Full project reference: `.claude/agents/vulvaverse.md`
- Local dev: `python3 -m http.server 8080` or use `.claude/launch.json` "static-site"
