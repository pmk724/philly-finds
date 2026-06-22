// Fetches each configured feed through our own /api/feed proxy, parses
// RSS or iCal, normalizes into the app's event shape, and categorizes.
//
// Event shape: { id, d, t, src, where, time, why, url, src_name, live, lat, lng }
//   d = integer day offset from today (0..13)

import { FEED_SOURCES, CATEGORY_RULES } from "./feeds.js";

const WINDOW_DAYS = 14;

function dayOffset(date) {
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(date);
  b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000);
}

function categorize(text, fallback) {
  const t = (text || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some((w) => t.includes(w))) return rule.cat;
  }
  return fallback;
}

function fmtTime(date) {
  try {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "see link";
  }
}

// ---- RSS ----
function parseRSS(xmlText, source) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const items = Array.from(doc.querySelectorAll("item"));
  const out = [];
  items.forEach((it, i) => {
    const title = (it.querySelector("title")?.textContent || "").trim();
    if (!title) return;
    const link = (it.querySelector("link")?.textContent || "").trim();
    const desc = (it.querySelector("description")?.textContent || "")
      .replace(/<[^>]+>/g, "")
      .trim();
    const pub = it.querySelector("pubDate")?.textContent;
    let d = 0;
    let time = "see link";
    if (pub) {
      const dt = new Date(pub);
      if (!isNaN(dt)) {
        d = dayOffset(dt);
        time = fmtTime(dt);
      }
    }
    if (d < 0 || d >= WINDOW_DAYS) return;
    out.push({
      id: `${source.key}-${i}`,
      d,
      t: title,
      src: categorize(`${title} ${desc}`, source.defaultCat),
      where: source.where,
      time,
      why: desc.slice(0, 140) + (desc.length > 140 ? "…" : ""),
      url: link || "",
      src_name: `${source.label} (live)`,
      live: true,
      lat: source.lat,
      lng: source.lng,
    });
  });
  return out;
}

// ---- iCal (.ics) ----
function unfoldICS(text) {
  // iCal folds long lines with CRLF + space/tab. Unfold first.
  return text.replace(/\r?\n[ \t]/g, "");
}
function parseICS(icsText, source) {
  const text = unfoldICS(icsText);
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  const out = [];
  blocks.forEach((block, i) => {
    const get = (key) => {
      const m = block.match(new RegExp(`${key}[^:]*:(.*)`));
      return m ? m[1].trim() : "";
    };
    const title = get("SUMMARY");
    if (!title) return;
    const dtRaw = get("DTSTART");
    const url = get("URL");
    const desc = get("DESCRIPTION").replace(/\\n/g, " ").replace(/\\,/g, ",").trim();
    const loc = get("LOCATION").replace(/\\,/g, ",").trim();
    let d = 0;
    let time = "see link";
    if (dtRaw) {
      // formats: 20260620 or 20260620T183000Z etc.
      const y = dtRaw.slice(0, 4), mo = dtRaw.slice(4, 6), da = dtRaw.slice(6, 8);
      const hh = dtRaw.slice(9, 11), mm = dtRaw.slice(11, 13);
      const dt = new Date(
        Number(y), Number(mo) - 1, Number(da),
        hh ? Number(hh) : 0, mm ? Number(mm) : 0
      );
      if (!isNaN(dt)) {
        d = dayOffset(dt);
        if (hh) time = fmtTime(dt);
      }
    }
    if (d < 0 || d >= WINDOW_DAYS) return;
    out.push({
      id: `${source.key}-${i}`,
      d,
      t: title,
      src: categorize(`${title} ${desc}`, source.defaultCat),
      where: loc || source.where,
      time,
      why: desc.slice(0, 140) + (desc.length > 140 ? "…" : ""),
      url,
      src_name: `${source.label} (live)`,
      live: true,
      lat: source.lat,
      lng: source.lng,
    });
  });
  return out;
}

// Fetch one source via our proxy.
async function fetchSource(source) {
  const res = await fetch(`/api/feed?src=${encodeURIComponent(source.key)}`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${source.key}: HTTP ${res.status}`);
  const text = await res.text();
  return source.type === "ics" ? parseICS(text, source) : parseRSS(text, source);
}

// Fetch all sources; never throw — return whatever succeeded plus a report.
export async function fetchAllFeeds() {
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchSource));
  const events = [];
  const report = [];
  results.forEach((r, idx) => {
    const label = FEED_SOURCES[idx].label;
    if (r.status === "fulfilled") {
      events.push(...r.value);
      report.push({ label, ok: true, count: r.value.length });
    } else {
      report.push({ label, ok: false, error: String(r.reason) });
    }
  });
  return { events, report };
}
