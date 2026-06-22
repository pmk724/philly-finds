// Feed source registry for the UI side.
// Each key MUST match a key in /api/feed.js FEEDS.
// `parse` tells the app how to read each item; `defaultCat` is the fallback
// category when keyword detection finds nothing.

export const FEED_SOURCES = [
  {
    key: "freelibrary",
    label: "Free Library",
    type: "rss",
    defaultCat: "free",
    where: "Free Library of Philadelphia",
    lat: 39.9596,
    lng: -75.171,
  },
  // Add more sources here as you verify them in /api/feed.js.
  // {
  //   key: "visitphilly",
  //   label: "Visit Philly",
  //   type: "ics",
  //   defaultCat: "food",
  //   where: "Philadelphia",
  //   lat: 39.9526,
  //   lng: -75.1652,
  // },
];

// Keyword -> category mapping used to auto-sort feed events.
// Tune these to match how you think about the city.
export const CATEGORY_RULES = [
  { cat: "fish", words: ["fish", "angler", "trout", "fly-cast", "fly cast"] },
  { cat: "ride", words: ["ride", "bike", "cycl", "pedal", "gravel"] },
  { cat: "music", words: ["music", "concert", "band", "dj", "jazz", "show", "gig"] },
  { cat: "food", words: ["food", "cook", "culinary", "taste", "vegan", "chef", "dinner", "market", "beer", "wine"] },
  { cat: "outdoor", words: ["hike", "kayak", "garden", "outdoor", "trail", "park", "paddle", "walk", "bird"] },
  { cat: "art", words: ["art", "gallery", "exhibit", "paint", "draw", "first friday", "mural"] },
  { cat: "maker", words: ["make", "craft", "build", "repair", "maker", "print", "solder", "workshop"] },
  { cat: "weird", words: ["underground", "diy", "experimental", "warehouse", "basement"] },
];
