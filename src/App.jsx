import React, { useState, useMemo, useEffect, useRef } from "react";
import { fetchAllFeeds } from "./feedClient.js";
import { loadSaved, storeSaved, loadMine, storeMine } from "./storage.js";

const TODAY = new Date(2026, 5, 20);

const SOURCES = {
  ride: { label: "Group Rides", tag: "BIKE", color: "#E8552A" },
  music: { label: "Live / Underground", tag: "SOUND", color: "#7B3FF2" },
  food: { label: "Food & Festivals", tag: "EATS", color: "#1F9E5A" },
  free: { label: "Free", tag: "FREE", color: "#0A84C2" },
  outdoor: { label: "Outdoor / Water", tag: "OUT", color: "#2E7D32" },
  maker: { label: "Maker / Hands-on", tag: "MAKE", color: "#C2410C" },
  fish: { label: "Fishing", tag: "FISH", color: "#0E7490" },
  art: { label: "Galleries / Art", tag: "ART", color: "#BE185D" },
  weird: { label: "Underground / Weird", tag: "ODD", color: "#6B7280" },
};

const SEED = [
  { d: 0, t: "Saturday Schuylkill Shop Ride", src: "ride", where: "Trophy Bikes, Old City", time: "8:00 AM", why: "No-drop, ~25mi up the river trail. Free, just show up.", url: "https://www.trophybikes.com", src_name: "shop calendar", lat: 39.9508, lng: -75.1442 },
  { d: 0, t: "Clark Park Flea + Food Trucks", src: "food", where: "Clark Park, West Philly", time: "10:00 AM", why: "Vendors, vinyl, cheap eats. Wander-and-graze.", url: "https://www.universitycity.org", src_name: "neighborhood newsletter", lat: 39.9489, lng: -75.2103 },
  { d: 0, t: "Bartram's free kayak", src: "outdoor", where: "Bartram's Garden dock", time: "11:00 AM", why: "Free kayaking on the Schuylkill. Go early, it lines up.", url: "https://www.bartramsgarden.org", src_name: "Parks & Rec", lat: 39.9326, lng: -75.2118 },
  { d: 0, t: "PMA pay-what-you-wish", src: "art", where: "Philadelphia Museum of Art", time: "5:00 PM", why: "Late hours, name your price.", url: "https://www.philamuseum.org", src_name: "museum site", lat: 39.9656, lng: -75.1810 },
  { d: 0, t: "Fishtown porch show (BYOB)", src: "weird", where: "address on RSVP, Fishtown", time: "8:30 PM", why: "DIY acoustic set, pass-the-hat. The real stuff.", src_name: "IG / mailing list", lat: 39.9700, lng: -75.1300 },
  { d: 1, t: "Sunday slow roll - Coalition", src: "ride", where: "Art Museum steps", time: "9:30 AM", why: "Casual social pace, all bikes welcome.", url: "https://bicyclecoalition.org", src_name: "Bicycle Coalition", lat: 39.9656, lng: -75.1810 },
  { d: 1, t: "Reading Terminal browse", src: "food", where: "Reading Terminal Market", time: "9:00 AM", why: "Calmer Sunday graze through the stalls.", url: "https://readingterminalmarket.org", src_name: "market site", lat: 39.9533, lng: -75.1590 },
  { d: 1, t: "FDR skate + food trucks", src: "free", where: "FDR Park, S. Philly", time: "12:00 PM", why: "Free roam, skatepark, trucks on the loop.", url: "https://www.phila.gov/parks", src_name: "Parks & Rec", lat: 39.9006, lng: -75.1860 },
  { d: 1, t: "Wissahickon birding walk", src: "outdoor", where: "Valley Green Inn", time: "8:00 AM", why: "Guided, free, loaner binoculars.", url: "https://fow.org", src_name: "FOW", lat: 40.0556, lng: -75.2120 },
  { d: 2, t: "Tacony Creek fishing meetup", src: "fish", where: "Tacony Creek Park", time: "6:30 PM", why: "Urban stocked trout. PA license required.", url: "https://www.fishandboat.com", src_name: "angler group", lat: 40.0200, lng: -75.1030 },
  { d: 2, t: "Open mic - Tattooed Mom", src: "music", where: "Tattooed Mom, South St", time: "8:00 PM", why: "Free, sign up early, eclectic crowd.", url: "https://www.tattooedmomphilly.com", src_name: "venue calendar", lat: 39.9410, lng: -75.1530 },
  { d: 2, t: "Free yoga at Spruce Harbor", src: "free", where: "Penn's Landing", time: "6:00 PM", why: "Riverfront, mat optional, free.", url: "https://www.delawareriverwaterfront.com", src_name: "DRWC", lat: 39.9460, lng: -75.1400 },
  { d: 3, t: "PhilaMOCA experimental film", src: "weird", where: "PhilaMOCA, Spring Garden", time: "7:30 PM", why: "Old mausoleum showroom turned art space.", url: "https://www.philamoca.org", src_name: "venue calendar", lat: 39.9620, lng: -75.1560 },
  { d: 3, t: "NextFab open shop tour", src: "maker", where: "NextFab, N. 4th", time: "6:00 PM", why: "Free walkthrough - CNC, laser, welding.", url: "https://nextfab.com", src_name: "makerspace", lat: 39.9740, lng: -75.1410 },
  { d: 3, t: "Taco Tuesday crawl", src: "food", where: "9th St, Italian Market", time: "5:30 PM", why: "Self-guided, cheap, walk the corridor.", url: "https://www.visitphilly.com", src_name: "neighborhood", lat: 39.9340, lng: -75.1590 },
  { d: 3, t: "Trail maintenance ride", src: "ride", where: "Pennypack trailhead", time: "5:30 PM", why: "Light gravel + cleanup crew, all welcome.", src_name: "shop ride", lat: 40.0590, lng: -75.0470 },
  { d: 4, t: "Johnny Brenda's - local bands", src: "music", where: "Johnny Brenda's, Fishtown", time: "8:00 PM", why: "Small upstairs room, cheap cover, 3 acts.", url: "https://www.johnnybrendas.com", src_name: "venue calendar", lat: 39.9690, lng: -75.1340 },
  { d: 4, t: "Free Library film series", src: "free", where: "Parkway Central Library", time: "6:30 PM", why: "Curated screening, free, big screen.", url: "https://libwww.freelibrary.org", src_name: "Free Library", lat: 39.9596, lng: -75.1710 },
  { d: 4, t: "Hydroponics meetup", src: "maker", where: "community space, Kensington", time: "7:00 PM", why: "DWC/grow nerds swap notes. Niche but real.", src_name: "mailing list", lat: 39.9790, lng: -75.1280 },
  { d: 5, t: "First Thursday gallery crawl", src: "art", where: "Old City, 2nd & 3rd", time: "5:00 PM", why: "Galleries open late, free, wine.", url: "https://www.oldcitydistrict.org", src_name: "gallery assoc.", lat: 39.9510, lng: -75.1440 },
  { d: 5, t: "Repair cafe", src: "free", where: "Parkway Central Library", time: "4:00 PM", why: "Bring a broken thing, fix it with volunteers.", url: "https://libwww.freelibrary.org", src_name: "Free Library", lat: 39.9596, lng: -75.1710 },
  { d: 5, t: "Sunset social ride", src: "ride", where: "Lloyd Hall, Boathouse Row", time: "6:30 PM", why: "Mellow river loop, lights for after dark.", src_name: "Coalition", lat: 39.9690, lng: -75.1870 },
  { d: 5, t: "Bok Bar rooftop opening", src: "music", where: "Bok Building roof", time: "6:00 PM", why: "Skyline view, DJ, free entry.", url: "https://www.buildingbok.com", src_name: "venue calendar", lat: 39.9290, lng: -75.1610 },
  { d: 6, t: "Schuylkill moonlight ride", src: "ride", where: "Walnut St Bridge access", time: "8:30 PM", why: "Evening river ride, lights required.", url: "https://www.schuylkillbanks.org", src_name: "Schuylkill Banks", lat: 39.9530, lng: -75.1810 },
  { d: 6, t: "Night market - food + makers", src: "food", where: "The Bourse, Old City", time: "6:00 PM", why: "Vendor stalls, street food, live music.", src_name: "venue calendar", lat: 39.9490, lng: -75.1470 },
  { d: 6, t: "Warehouse noise show", src: "weird", where: "address on RSVP, Kensington", time: "9:00 PM", why: "DIY gig, BYOB, the real niche tier.", src_name: "IG / mailing list", lat: 39.9810, lng: -75.1250 },
  { d: 7, t: "Wissahickon hike + cleanup", src: "outdoor", where: "Valley Green Inn", time: "9:00 AM", why: "Forbidden Drive loop, gloves provided.", url: "https://fow.org", src_name: "FOW", lat: 40.0556, lng: -75.2120 },
  { d: 7, t: "Headhouse farmers market", src: "food", where: "Headhouse Shambles", time: "10:00 AM", why: "Producers-only, samples, coffee.", url: "https://thefoodtrust.org", src_name: "market site", lat: 39.9430, lng: -75.1460 },
  { d: 7, t: "Gravel ride - Forbidden Drive", src: "ride", where: "Northwestern Ave", time: "8:00 AM", why: "Dirt out-and-back, no traffic.", src_name: "shop ride", lat: 40.0780, lng: -75.2160 },
  { d: 7, t: "Print studio open day", src: "maker", where: "Fishtown collective", time: "1:00 PM", why: "Screenprint a poster, materials included.", src_name: "studio list", lat: 39.9720, lng: -75.1320 },
  { d: 8, t: "Underground noise show (BYOB)", src: "weird", where: "warehouse, Kensington", time: "9:00 PM", why: "Address-on-RSVP DIY gig.", src_name: "IG / mailing list", lat: 39.9800, lng: -75.1240 },
  { d: 8, t: "Spruce Harbor pop-up", src: "free", where: "Penn's Landing", time: "12:00 PM", why: "Hammocks, food barges, free roam.", url: "https://www.delawareriverwaterfront.com", src_name: "DRWC", lat: 39.9460, lng: -75.1400 },
  { d: 8, t: "Fly-casting clinic", src: "fish", where: "Pennypack Creek", time: "8:00 AM", why: "Free, loaner gear, beginner-friendly.", src_name: "angler group", lat: 40.0590, lng: -75.0470 },
  { d: 9, t: "Italian Market festival", src: "food", where: "9th St, S. Philly", time: "11:00 AM", why: "Street food, music, corridor open.", url: "https://www.italianmarketphilly.org", src_name: "neighborhood", lat: 39.9340, lng: -75.1590 },
  { d: 9, t: "Monday night crit watch", src: "ride", where: "FDR Park loop", time: "6:00 PM", why: "Watch the fast crowd or jump in.", src_name: "shop ride", lat: 39.9006, lng: -75.1860 },
  { d: 9, t: "Drawing jam - life session", src: "maker", where: "Fishtown studio", time: "7:00 PM", why: "Open figure-drawing, small fee, BYO supplies.", src_name: "studio list", lat: 39.9720, lng: -75.1320 },
  { d: 10, t: "Bok rooftop - local DJs", src: "music", where: "Bok Building roof", time: "6:00 PM", why: "Skyline, free entry, food vendors.", src_name: "venue calendar", lat: 39.9290, lng: -75.1610 },
  { d: 10, t: "Schuylkill cleanup paddle", src: "outdoor", where: "Bartram's dock", time: "9:00 AM", why: "Kayak + trash pickup, free, gear provided.", src_name: "Parks & Rec", lat: 39.9326, lng: -75.2118 },
  { d: 10, t: "Stoic reading circle", src: "free", where: "library branch, Center City", time: "6:30 PM", why: "Enchiridion discussion group, free.", src_name: "meetup", lat: 39.9520, lng: -75.1660 },
  { d: 11, t: "Pennypack fly-fishing intro", src: "fish", where: "Pennypack Creek", time: "8:00 AM", why: "Free casting clinic, loaner gear.", url: "https://www.fishandboat.com", src_name: "angler group", lat: 40.0590, lng: -75.0470 },
  { d: 11, t: "Open mic - Tattooed Mom", src: "music", where: "South St", time: "8:00 PM", why: "Free, eclectic, sign up early.", src_name: "venue calendar", lat: 39.9410, lng: -75.1530 },
  { d: 11, t: "Maker night - electronics", src: "maker", where: "NextFab, N. 4th", time: "6:30 PM", why: "Soldering + small projects, drop in.", src_name: "makerspace", lat: 39.9740, lng: -75.1410 },
  { d: 12, t: "First-Thursday encore crawl", src: "art", where: "Old City", time: "5:00 PM", why: "More galleries, free, lighter crowd.", src_name: "gallery assoc.", lat: 39.9510, lng: -75.1440 },
  { d: 12, t: "Sunset ride to the dam", src: "ride", where: "Boathouse Row", time: "6:30 PM", why: "Out to East Falls and back, mellow.", src_name: "Coalition", lat: 39.9690, lng: -75.1870 },
  { d: 12, t: "Food truck rally", src: "food", where: "The Navy Yard", time: "5:00 PM", why: "Dozen trucks, lawn, free entry.", src_name: "venue calendar", lat: 39.8900, lng: -75.1700 },
  { d: 13, t: "Screenprint open studio", src: "maker", where: "Fishtown collective", time: "1:00 PM", why: "Hands-on poster, materials included.", src_name: "studio list", lat: 39.9720, lng: -75.1320 },
  { d: 13, t: "DIY basement show", src: "weird", where: "address on RSVP, W. Philly", time: "8:30 PM", why: "Three bands, donation door. Niche gold.", src_name: "IG / mailing list", lat: 39.9560, lng: -75.2050 },
  { d: 13, t: "Night market - Chinatown", src: "food", where: "10th & Race", time: "6:00 PM", why: "Street food stalls, lanterns, music.", src_name: "neighborhood", lat: 39.9550, lng: -75.1560 },
];

const dayKey = (offset) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offset);
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};
const dayShort = (offset) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offset);
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const dayPillLabel = (offset) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offset);
  if (offset === 0) return "Today";
  return dt.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
};

export default function App() {
  const [events, setEvents] = useState(() => [...SEED, ...loadMine()]);
  const [liveStatus, setLiveStatus] = useState("idle"); // idle | loading | ok | fail
  const [liveCount, setLiveCount] = useState(0);
  const [liveReport, setLiveReport] = useState([]);
  const [expanded, setExpanded] = useState(new Set()); // day offsets shown in full
  const [active, setActive] = useState(new Set());
  const [q, setQ] = useState("");
  const [view, setView] = useState("list");
  const [saved, setSaved] = useState(() => loadSaved());
  const [showAdd, setShowAdd] = useState(false);
  const [dayPick, setDayPick] = useState("all"); // "all" or day offset number

  // ---- LIVE FEEDS via our own /api/feed proxy ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLiveStatus("loading");
      try {
        const { events: live, report } = await fetchAllFeeds();
        if (cancelled) return;
        const okCount = report.filter((r) => r.ok).reduce((a, r) => a + r.count, 0);
        setEvents((prev) => [...prev.filter((e) => !e.live), ...live]);
        setLiveCount(okCount);
        setLiveReport(report);
        setLiveStatus(live.length ? "ok" : "fail");
      } catch {
        if (!cancelled) setLiveStatus("fail");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (k) =>
    setActive((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  useEffect(() => { storeSaved(saved); }, [saved]);

  const idOf = (e) => e.id || `${e.d}-${e.t}`;
  const toggleSave = (e) =>
    setSaved((p) => { const n = new Set(p); const id = idOf(e); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const addEvent = (ev) => {
    const rec = { ...ev, id: `user-${Date.now()}`, src_name: "added by you", mine: true };
    setEvents((p) => {
      const next = [...p, rec];
      storeMine(next.filter((x) => x.mine));
      return next;
    });
    setShowAdd(false);
  };
  const removeEvent = (e) => setEvents((p) => {
    const next = p.filter((x) => idOf(x) !== idOf(e));
    storeMine(next.filter((x) => x.mine));
    return next;
  });

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (view === "saved" && !saved.has(idOf(e))) return false;
      if (dayPick !== "all" && e.d !== Number(dayPick)) return false;
      if (active.size && !active.has(e.src)) return false;
      if (q) { const hay = (e.t + e.where + e.why).toLowerCase(); if (!hay.includes(q.toLowerCase())) return false; }
      return true;
    });
  }, [events, active, q, view, saved, dayPick]);

  const daysWithEvents = useMemo(() => {
    const base = events.filter((e) => {
      if (view === "saved" && !saved.has(idOf(e))) return false;
      if (active.size && !active.has(e.src)) return false;
      if (q) { const hay = (e.t + e.where + e.why).toLowerCase(); if (!hay.includes(q.toLowerCase())) return false; }
      return true;
    });
    return new Set(base.map((e) => e.d));
  }, [events, active, q, view, saved]);

  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach((e) => (m[e.d] = m[e.d] || []).push(e));
    return Object.entries(m).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [filtered]);

  return (
    <div style={S.shell}>
      <style>{CSS}</style>
      <header style={S.header}>
        <div style={S.kicker}>PHL - next two weeks</div>
        <div style={S.titleRow}>
          <h1 style={S.h1}>Philly <span style={S.h1accent}>Finds</span></h1>
          <button style={S.addBtn} onClick={() => setShowAdd(true)} aria-label="Add an event">+ Add</button>
        </div>
        <p style={S.sub}>The small, the free, the slightly weird.</p>
        <div style={S.liveBar}>
          {liveStatus === "loading" && <span style={S.liveLoad}>● fetching live Free Library events...</span>}
          {liveStatus === "ok" && <span style={S.liveOk}>● {liveCount} live events loaded (Free Library)</span>}
          {liveStatus === "fail" && <span style={S.liveFail}>● live feed unreachable - showing sample data</span>}
        </div>
        <div style={S.tabs}>
          {[["list", "List"], ["map", "Map"], ["saved", `Saved${saved.size ? ` - ${saved.size}` : ""}`]].map(([k, lbl]) => (
            <button key={k} onClick={() => setView(k)} style={{ ...S.tab, ...(view === k ? S.tabOn : {}) }}>{lbl}</button>
          ))}
        </div>
        {view !== "map" && (
          <input style={S.search} placeholder="search rides, fish, noise shows..." value={q} onChange={(e) => setQ(e.target.value)} />
        )}
        <div style={S.chips}>
          {Object.entries(SOURCES).map(([k, s]) => {
            const on = active.has(k);
            return (
              <button key={k} onClick={() => toggle(k)} className="chip"
                style={{ ...S.chip, borderColor: s.color, background: on ? s.color : "transparent", color: on ? "#fff" : s.color }}>
                {s.label}
              </button>
            );
          })}
        </div>
        <div style={S.dayStrip}>
          <button onClick={() => setDayPick("all")}
            style={{ ...S.dayPill, ...(dayPick === "all" ? S.dayPillOn : {}) }}>All</button>
          {Array.from({ length: 14 }, (_, i) => i).filter((i) => daysWithEvents.has(i)).map((i) => (
            <button key={i} onClick={() => setDayPick(i)}
              style={{ ...S.dayPill, ...(dayPick === i ? S.dayPillOn : {}) }}>{dayPillLabel(i)}</button>
          ))}
        </div>
      </header>

      {view === "map" ? (
        <MapView events={filtered} saved={saved} idOf={idOf} />
      ) : (
        <main style={S.main}>
          {grouped.length === 0 && (
            <div style={S.empty}>
              {view === "saved" ? "No saved events yet. Tap the star on any card." : "Nothing matches. Loosen a filter or clear search."}
            </div>
          )}
          {grouped.map(([offset, items]) => (
            <section key={offset} style={S.daySec}>
              <div style={S.dayHead}>
                <span style={S.dayName}>{dayKey(Number(offset))}</span>
                <span style={S.dayLine} />
                <span style={S.dayCount}>{items.length}</span>
              </div>
              {(expanded.has(Number(offset)) ? items : items.slice(0, 6)).map((e, i) => {
                const s = SOURCES[e.src];
                const isSaved = saved.has(idOf(e));
                return (
                  <article key={i} className="card" style={S.card}>
                    <div style={{ ...S.tag, background: s.color }}>{s.tag}</div>
                    <div style={S.cardBody}>
                      {e.img && <img src={e.img} alt="" style={S.cardImg} />}
                      <div style={S.cardTop}>
                        <h3 style={S.cardTitle}>{e.t}</h3>
                        <button onClick={() => toggleSave(e)} style={{ ...S.star, color: isSaved ? "#E8552A" : "#c9bda8" }}
                          aria-label={isSaved ? "Remove bookmark" : "Save event"}>{isSaved ? "\u2605" : "\u2606"}</button>
                      </div>
                      <div style={S.metaRow}>
                        <span style={S.time}>{e.time}</span>
                        <span style={S.where}>{e.where}</span>
                      </div>
                      {e.why && <p style={S.why}>{e.why}</p>}
                      <div style={S.cardFoot}>
                        <span style={S.srcName}>{e.live && <b style={S.livePill}>LIVE</b>}{e.mine ? "" : "via "}{e.src_name}</span>
                        <span style={S.footRight}>
                          {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" style={S.details}>Details &rarr;</a>}
                          {e.mine && <button style={S.del} onClick={() => removeEvent(e)}>delete</button>}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {items.length > 6 && !expanded.has(Number(offset)) && (
                <button style={S.showMore} onClick={() => setExpanded((p) => new Set(p).add(Number(offset)))}>
                  show {items.length - 6} more on {dayPillLabel(Number(offset))}
                </button>
              )}
            </section>
          ))}
          <footer style={S.footer}>Demo - sample data - {filtered.length} shown</footer>
        </main>
      )}

      {showAdd && <AddForm onClose={() => setShowAdd(false)} onAdd={addEvent} />}
    </div>
  );
}

function AddForm({ onClose, onAdd }) {
  const [t, setT] = useState("");
  const [src, setSrc] = useState("music");
  const [d, setD] = useState(0);
  const [time, setTime] = useState("");
  const [where, setWhere] = useState("");
  const [why, setWhy] = useState("");
  const [img, setImg] = useState(null);
  const [link, setLink] = useState("");

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImg(r.result);
    r.readAsDataURL(f);
  };

  const valid = t.trim() && time.trim() && where.trim();
  const submit = () => {
    if (!valid) return;
    onAdd({ t: t.trim(), src, d: Number(d), time: time.trim(), where: where.trim(), why: why.trim(), url: link.trim() || null, img, lat: 39.952, lng: -75.163 });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.sheetHead}>
          <h2 style={S.sheetTitle}>Add an event</h2>
          <button style={S.x} onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <label style={S.lbl}>Photo / flyer (optional)</label>
        {img ? (
          <div style={{ position: "relative" }}>
            <img src={img} alt="flyer" style={S.preview} />
            <button style={S.imgClear} onClick={() => setImg(null)}>remove photo</button>
          </div>
        ) : (
          <label style={S.upload}>
            <span style={{ fontSize: 26 }}>+</span>
            <span style={{ fontSize: 12.5 }}>Attach a screenshot to reference while you type</span>
            <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
          </label>
        )}

        <label style={S.lbl}>Title *</label>
        <input style={S.field} value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. Basement show @ the spot" />

        <label style={S.lbl}>Category *</label>
        <div style={S.catGrid}>
          {Object.entries(SOURCES).map(([k, s]) => (
            <button key={k} onClick={() => setSrc(k)}
              style={{ ...S.catBtn, borderColor: s.color, background: src === k ? s.color : "transparent", color: src === k ? "#fff" : s.color }}>
              {s.label}
            </button>
          ))}
        </div>

        <label style={S.lbl}>Day *</label>
        <select style={S.field} value={d} onChange={(e) => setD(e.target.value)}>
          {Array.from({ length: 14 }, (_, i) => (
            <option key={i} value={i}>{dayShort(i)}{i === 0 ? " (today)" : ""}</option>
          ))}
        </select>

        <label style={S.lbl}>Time *</label>
        <input style={S.field} value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 8:30 PM" />

        <label style={S.lbl}>Place *</label>
        <input style={S.field} value={where} onChange={(e) => setWhere(e.target.value)} placeholder="e.g. address on RSVP, Kensington" />

        <label style={S.lbl}>Note (optional)</label>
        <input style={S.field} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="e.g. donation door, BYOB" />

        <label style={S.lbl}>Link (optional)</label>
        <input style={S.field} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://... (IG post, venue page)" inputMode="url" />

        <button style={{ ...S.save, opacity: valid ? 1 : 0.4 }} disabled={!valid} onClick={submit}>Save event</button>
        <p style={S.hint}>* required. Demo only - added events reset on refresh.</p>
      </div>
    </div>
  );
}

function MapView({ events, saved, idOf }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    js.onload = () => setReady(true);
    document.body.appendChild(js);
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    const L = window.L;
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current, { zoomControl: true }).setView([39.952, -75.163], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "(c) OpenStreetMap", maxZoom: 18 }).addTo(mapRef.current);
    }
    if (layerRef.current) layerRef.current.remove();
    layerRef.current = L.layerGroup().addTo(mapRef.current);
    events.forEach((e) => {
      const s = SOURCES[e.src];
      const isSaved = saved.has(idOf(e));
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${s.color};width:18px;height:18px;border-radius:50%;border:2.5px solid #161310;box-shadow:1px 1px 0 #161310;${isSaved ? "outline:2px solid #E8552A;outline-offset:2px;" : ""}"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
      const m = L.marker([e.lat, e.lng], { icon }).addTo(layerRef.current);
      m.bindPopup(`<b style="font-size:14px">${e.t}</b><br><span style="color:#E8552A;font-weight:700">${e.time}</span> - ${e.where}<br><span style="font-size:12px">${e.why || ""}</span>${e.url ? `<br><a href="${e.url}" target="_blank" rel="noopener" style="color:#E8552A;font-weight:700;font-size:12px">Details &rarr;</a>` : ""}`);
    });
    if (events.length) {
      const b = window.L.latLngBounds(events.map((e) => [e.lat, e.lng]));
      mapRef.current.fitBounds(b, { padding: [40, 40], maxZoom: 14 });
    }
  }, [ready, events, saved]);

  return (
    <div style={S.mapWrap}>
      {!ready && <div style={S.empty}>Loading map...</div>}
      <div ref={ref} style={S.map} />
      <div style={S.mapNote}>{events.length} pins - tap for details</div>
    </div>
  );
}

const INK = "#161310";
const PAPER = "#F3EDE1";
const CSS = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; }
  .chip:active { transform: scale(0.96); }
  .card { transition: transform .12s ease, box-shadow .12s ease; }
  @media (hover:hover){ .card:hover { box-shadow: 6px 6px 0 ${INK}; transform: translate(-1px,-1px); } }
  input::placeholder { color: #9a8f7d; }
  *:focus-visible { outline: 3px solid #E8552A; outline-offset: 2px; }
  .leaflet-popup-content { font-family: ui-sans-serif, system-ui, sans-serif; margin: 10px 12px; line-height: 1.4; }
`;

const S = {
  shell: { minHeight: "100vh", background: PAPER, color: INK, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif", maxWidth: 480, margin: "0 auto" },
  header: { padding: "22px 18px 14px", borderBottom: `3px solid ${INK}`, position: "sticky", top: 0, background: PAPER, zIndex: 1000 },
  kicker: { fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: "#E8552A", textTransform: "uppercase" },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  h1: { margin: 0, fontSize: 38, lineHeight: 0.95, fontWeight: 900, letterSpacing: "-0.03em", fontFamily: "Georgia, serif" },
  h1accent: { fontStyle: "italic", color: "#E8552A" },
  addBtn: { background: INK, color: PAPER, border: "none", fontSize: 14, fontWeight: 800, padding: "9px 14px", cursor: "pointer", letterSpacing: "0.02em" },
  sub: { margin: "6px 0 8px", fontSize: 13, color: "#5c5346" },
  liveBar: { marginBottom: 12, minHeight: 16 },
  liveLoad: { fontSize: 11.5, color: "#9a8f7d", fontWeight: 700 },
  liveOk: { fontSize: 11.5, color: "#1F9E5A", fontWeight: 800 },
  liveFail: { fontSize: 11.5, color: "#b91c1c", fontWeight: 800 },
  livePill: { background: "#1F9E5A", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 3, marginRight: 6, letterSpacing: "0.06em" },
  tabs: { display: "flex", marginBottom: 12, border: `2px solid ${INK}`, width: "fit-content" },
  tab: { padding: "7px 16px", fontSize: 13, fontWeight: 700, background: "transparent", border: "none", borderRight: `2px solid ${INK}`, cursor: "pointer", color: INK },
  tabOn: { background: INK, color: PAPER },
  search: { width: "100%", padding: "11px 14px", fontSize: 15, border: `2px solid ${INK}`, borderRadius: 0, background: "#fff", marginBottom: 12 },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: { fontSize: 11, fontWeight: 700, padding: "5px 10px", border: "2px solid", borderRadius: 999, cursor: "pointer" },
  dayStrip: { display: "flex", gap: 6, overflowX: "auto", marginTop: 11, paddingBottom: 2, WebkitOverflowScrolling: "touch" },
  dayPill: { flex: "0 0 auto", fontSize: 12, fontWeight: 800, padding: "6px 12px", border: `2px solid ${INK}`, background: "#fff", color: INK, cursor: "pointer", borderRadius: 0, whiteSpace: "nowrap" },
  dayPillOn: { background: INK, color: PAPER },
  main: { padding: "8px 16px 40px" },
  daySec: { marginTop: 20 },
  dayHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  dayName: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" },
  dayLine: { flex: 1, height: 2, background: INK },
  dayCount: { fontSize: 11, fontWeight: 800, background: INK, color: PAPER, borderRadius: 999, padding: "1px 8px" },
  card: { display: "flex", border: `2.5px solid ${INK}`, background: "#fff", marginBottom: 11, boxShadow: `4px 4px 0 ${INK}` },
  tag: { writingMode: "vertical-rl", transform: "rotate(180deg)", color: "#fff", fontWeight: 800, fontSize: 10.5, letterSpacing: "0.15em", padding: "10px 5px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 28 },
  cardBody: { padding: "11px 13px", flex: 1, minWidth: 0 },
  cardImg: { width: "100%", height: 140, objectFit: "cover", border: `2px solid ${INK}`, marginBottom: 9 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { margin: 0, fontSize: 16.5, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.01em" },
  star: { background: "none", border: "none", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: 0, marginTop: -2 },
  metaRow: { display: "flex", gap: 8, alignItems: "baseline", marginTop: 4, flexWrap: "wrap" },
  time: { fontSize: 12, fontWeight: 800, color: "#E8552A", whiteSpace: "nowrap" },
  where: { fontSize: 12, color: "#5c5346", fontWeight: 600 },
  why: { fontSize: 13, lineHeight: 1.45, margin: "7px 0 5px", color: "#2b2722" },
  cardFoot: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  srcName: { fontSize: 10.5, color: "#9a8f7d", fontStyle: "italic" },
  del: { background: "none", border: "none", color: "#b91c1c", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 },
  footRight: { display: "flex", gap: 12, alignItems: "center" },
  details: { fontSize: 12, fontWeight: 800, color: "#E8552A", textDecoration: "none", letterSpacing: "0.01em" },
  empty: { textAlign: "center", padding: "60px 20px", color: "#5c5346", fontSize: 14 },
  footer: { marginTop: 28, textAlign: "center", fontSize: 11, color: "#9a8f7d" },
  showMore: { width: "100%", padding: "9px", marginTop: 2, marginBottom: 4, background: "transparent", border: `2px dashed ${INK}`, fontSize: 12.5, fontWeight: 800, color: INK, cursor: "pointer", letterSpacing: "0.02em" },
  mapWrap: { position: "relative" },
  map: { height: "calc(100vh - 230px)", width: "100%", background: "#ddd" },
  mapNote: { position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: INK, color: PAPER, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999, zIndex: 1000 },
  overlay: { position: "fixed", inset: 0, background: "rgba(22,19,16,0.55)", zIndex: 2000, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { background: PAPER, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", borderTop: `3px solid ${INK}`, padding: "18px 18px 28px" },
  sheetHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sheetTitle: { margin: 0, fontSize: 24, fontWeight: 900, fontFamily: "Georgia, serif" },
  x: { background: "none", border: "none", fontSize: 30, lineHeight: 1, cursor: "pointer", color: INK },
  lbl: { display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5c5346", margin: "12px 0 5px" },
  field: { width: "100%", padding: "10px 12px", fontSize: 15, border: `2px solid ${INK}`, background: "#fff", borderRadius: 0 },
  upload: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "22px", border: `2px dashed ${INK}`, cursor: "pointer", color: "#5c5346", textAlign: "center" },
  preview: { width: "100%", maxHeight: 220, objectFit: "contain", border: `2px solid ${INK}`, background: "#fff" },
  imgClear: { position: "absolute", top: 6, right: 6, background: INK, color: PAPER, border: "none", fontSize: 11, fontWeight: 700, padding: "4px 8px", cursor: "pointer" },
  catGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  catBtn: { fontSize: 11, fontWeight: 700, padding: "6px 10px", border: "2px solid", borderRadius: 999, cursor: "pointer" },
  save: { width: "100%", marginTop: 18, padding: "13px", background: "#E8552A", color: "#fff", border: `2px solid ${INK}`, fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: `4px 4px 0 ${INK}` },
  hint: { fontSize: 11, color: "#9a8f7d", textAlign: "center", marginTop: 10 },
};
