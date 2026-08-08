const BASE_URL = "https://www.wordreference.com"

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
}

export async function fetchAutocomplete(dict: string, query: string): Promise<string> {
  const url = new URL("/autocomplete", BASE_URL)
  url.searchParams.set("dict", dict)
  url.searchParams.set("query", query)

  const res = await fetch(url, { headers: HEADERS, cache: "no-store" })
  return res.text()
}

export async function fetchTranslation(dict: string, term: string): Promise<string> {
  const url = new URL("/dictionary/translation", BASE_URL)
  url.searchParams.set("dict", dict)
  url.searchParams.set("w", term)

  const res = await fetch(url, { headers: HEADERS, cache: "no-store" })
  if (!res.ok && res.status !== 404) {
    throw new Error(`WordReference request failed (${res.status})`)
  }
  return res.text()
}
