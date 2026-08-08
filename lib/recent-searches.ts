const RECENT_KEY = "wr:recent-searches"
const MAX_RECENT = 8

export interface RecentSearch {
  term: string
  dict: string
  from: string
  to: string
}

export function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentSearch[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item.term === "string" &&
        typeof item.dict === "string" &&
        typeof item.from === "string" &&
        typeof item.to === "string"
    )
  } catch {
    return []
  }
}

export function pushRecentSearch(entry: RecentSearch): RecentSearch[] {
  const next = [
    entry,
    ...readRecentSearches().filter(
      (item) => !(item.term === entry.term && item.dict === entry.dict)
    ),
  ].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

export function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_KEY)
}
