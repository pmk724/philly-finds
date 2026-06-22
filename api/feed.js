// Vercel Serverless Function: /api/feed?src=<key>
// Fetches a whitelisted RSS/iCal feed server-side and returns the raw text.
// This is what removes the CORS problem AND the dependency on a public relay:
// the request is made by Vercel's server, not the browser, so no CORS applies.
//
// To add a source: add an entry to FEEDS below, then add it to src/feeds.js
// so the UI knows how to label/categorize it. Keep the two in sync by key.

const FEEDS = {
  // key: { url, type }   type is "rss" or "ics"
  freelibrary: {
    url: "http://libwww.freelibrary.org/rss/rss.cfm",
    type: "rss",
  },
  uwishunu: {
    url: "https://www.visitphilly.com/feed/uwishunu",
    type: "rss",
  },
};
  // --- Add more here once you verify the URL returns XML/ICS in a browser. ---
  // Examples of likely-working patterns (VERIFY before trusting):
  // visitphilly:  { url: "https://www.visitphilly.com/events/?ical=1", type: "ics" },
  // pennevents:   { url: "https://events.upenn.edu/rss", type: "rss" },
  // drexel:       { url: "https://drexel.edu/calendar/feed/", type: "rss" },
};

export default async function handler(req, res) {
  const { src } = req.query;

  if (!src || !FEEDS[src]) {
    res.status(400).json({ error: "Unknown or missing src", available: Object.keys(FEEDS) });
    return;
  }

  const { url, type } = FEEDS[src];

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "PhillyFinds/1.0 (personal events app)" },
      // 10s is generous; feeds that hang longer aren't worth blocking on.
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      res.status(502).json({ error: `Upstream ${upstream.status}`, src });
      return;
    }

    const body = await upstream.text();

    // Cache at the edge for 30 min so you're not hammering sources and
    // your app loads fast. Adjust max-age to taste.
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.setHeader("Content-Type", type === "ics" ? "text/calendar" : "application/xml");
    res.status(200).send(body);
  } catch (err) {
    res.status(504).json({ error: "Fetch failed or timed out", src, detail: String(err) });
  }
}
