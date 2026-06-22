# Philly Finds

A personal, phone-friendly web app for finding small, free, and slightly weird
things to do in Philadelphia over the next two weeks. Pulls live events from
feeds you configure, lets you add your own (with a photo + link), bookmark
favorites, and view everything on a map. Built to install to your phone's home
screen like an app.

---

## What's real vs. what you maintain

- **Live feeds**: events pulled automatically from sources you list. Ships with
  one working source (Free Library of Philadelphia). You add more — see below.
- **Your own events**: the niche tier (warehouse shows, group rides, DIY gigs)
  has no machine-readable feed anywhere. You add those by hand with the **+ Add**
  button. This is the primary tool for niche stuff, not a fallback.
- **Bookmarks & added events** persist on your device via localStorage. They
  survive refresh and closing the app, but live only on that one browser/device.

---

## Deploy it (≈20 min, needs a computer)

You can't realistically do this from a phone. On a laptop/desktop:

### Option A — Vercel via GitHub (easiest)
1. Create a free account at https://vercel.com and https://github.com
2. Make a new GitHub repo and push this folder to it:
   ```bash
   cd philly-finds
   git init
   git add .
   git commit -m "initial"
   git branch -M main
   git remote add origin https://github.com/YOURNAME/philly-finds.git
   git push -u origin main
   ```
3. In Vercel: **Add New → Project → Import** your repo. Framework preset:
   **Vite**. Click **Deploy**. Done — you get a `*.vercel.app` URL.

### Option B — Vercel CLI (no GitHub)
1. Install Node.js 18+ from https://nodejs.org
2. ```bash
   cd philly-finds
   npm install
   npm install -g vercel
   vercel        # follow prompts; accept defaults
   vercel --prod # promote to your live URL
   ```

### Run locally first (optional sanity check)
```bash
npm install
npm run dev      # opens http://localhost:5173
```
Note: the `/api/feed` proxy only runs on Vercel (or `vercel dev`), not under
plain `npm run dev`. With `npm run dev` you'll see the seed events; live feeds
appear once deployed or when using `vercel dev`.

### Put it on your phone
Open your `*.vercel.app` URL in mobile Safari/Chrome → Share → **Add to Home
Screen**. It launches fullscreen like a native app.

---

## Add more event sources

Two files, kept in sync by a shared `key`:

1. **`api/feed.js`** — add the actual feed URL to the `FEEDS` object:
   ```js
   visitphilly: { url: "https://www.visitphilly.com/events/?ical=1", type: "ics" },
   ```
2. **`src/feeds.js`** — add a matching entry to `FEED_SOURCES` so the UI knows
   how to label and place it:
   ```js
   { key: "visitphilly", label: "Visit Philly", type: "ics",
     defaultCat: "food", where: "Philadelphia", lat: 39.9526, lng: -75.1652 },
   ```

**Before trusting a feed URL**, paste it into a browser. You want to see XML
(RSS) or `BEGIN:VCALENDAR` (iCal). If you get HTML or a 404, it's not a real
feed — don't add it. Feed URLs rot; expect to re-check occasionally.

Good feed patterns to try on a source's site:
- WordPress + The Events Calendar: `…/events/feed/` or `…/events/?ical=1`
- Localist / 25Live (universities): usually an RSS/iCal/JSON export button
- Squarespace: `…/eventspage?format=ical`

Sources confirmed **not** usable: Eventbrite (public search API was removed),
and anything Instagram-only (no feed, scraping blocked) — those go in via + Add.

---

## Tune categories

`src/feeds.js` → `CATEGORY_RULES` maps keywords to your nine categories. Feed
events are auto-sorted by these. Edit the word lists to match how you think
about the city. Auto-categorization is keyword-guessing — it'll miss sometimes.

---

## Files

```
api/feed.js        serverless proxy — fetches feeds server-side (kills CORS)
src/feeds.js       source list + category keyword rules  (EDIT THIS)
src/feedClient.js  fetch + RSS/iCal parsing + categorization
src/storage.js     localStorage persistence
src/App.jsx        the app UI
```

## Known limits

- Single device (no cross-device sync). Adding sync = swap `storage.js` for an
  API + tiny DB; nothing else changes.
- No notifications. That needs a scheduled function + push service; deliberately
  left out to keep this free and zero-maintenance.
- Live coverage skews institutional (libraries, etc.) — the genuinely niche
  events are yours to add.
