// Persistence via localStorage. Single-device, no backend, survives refresh
// and app close. If you later want cross-device sync, this is the layer you'd
// swap for an API — nothing else in the app changes.

const K_SAVED = "pf_saved_v1";
const K_MINE = "pf_mine_v1";

export function loadSaved() {
  try {
    return new Set(JSON.parse(localStorage.getItem(K_SAVED) || "[]"));
  } catch {
    return new Set();
  }
}

export function storeSaved(set) {
  try {
    localStorage.setItem(K_SAVED, JSON.stringify([...set]));
  } catch {
    /* storage full or blocked; ignore */
  }
}

export function loadMine() {
  try {
    return JSON.parse(localStorage.getItem(K_MINE) || "[]");
  } catch {
    return [];
  }
}

export function storeMine(arr) {
  try {
    localStorage.setItem(K_MINE, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}
