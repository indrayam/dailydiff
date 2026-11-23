# The Daily Diff

A static newspaper of posts, threads, and signals worth Anand Sharma's attention, curated from sources such as X, Hacker News, GitHub, and the web. It uses the shared `indrayam.com` chrome: the site nav (Home | About Me | Resume | Daily Diff | Field Notes | Sightings | Writings), the 10px orange top bar, a white page with no box around the content, and the shared copyright footer. Inside, a centered Source Sans Pro masthead ("The Daily Diff") sits over a Newsreader newspaper layout.

**Live:** https://dailydiff.indrayam.com

## Files

| File | Role |
| --- | --- |
| `index.html` | Newspaper shell: site nav, masthead with loading placeholders for the edition date and story count, filter bar, and empty story columns. Preloads `edition.json`. |
| `app.js` | Fetches `./edition.json`, fills the masthead, and renders the stories with source and interest filters. |
| `edition.json` | The current edition's content and the data contract with `app.js`. |
| `styles.css` | Shared chrome (nav, top bar, footer) plus the newspaper layout: Source Sans Pro masthead, Newsreader body, orange accent, `#900` links. |
| `404.html` | Custom not-found page with the shared nav and footer and the `images/404.webp` illustration. |
| `images/og-daily-diff.png` | 1200x630 share image used by the `og:image` and `twitter:image` tags. |
| `favicon.ico`, `apple-touch-icon.png` | The icon shared by every indrayam.com site. |
| `robots.txt`, `sitemap.xml` | Crawler files for this host. |
| `vercel.json` | Shared security headers, plus `Cache-Control: max-age=0, must-revalidate` on `edition.json` so each visit gets the latest edition. |
| `.vercelignore` | Keeps `AGENTS.md`, `README.md`, `preflight.txt`, `.env*`, and `.claude/` out of deployments. |
| `preflight.txt` | Working log from the edition pipeline; not deployed. |

No bundler, no framework. Serve the directory with any static file server (the workspace's `.claude/launch.json` has a `samachar` entry on port 8084), then open the local URL. Direct `file://` opening is not supported because the app loads `edition.json` with `fetch`.

Canonical host is Vercel (Git-connected, project `samachar`): a push to `main` deploys. GitHub Pages is off.
