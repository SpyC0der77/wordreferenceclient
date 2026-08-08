import type { Suggestion } from "./types"

export function parseAutocomplete(body: string): Suggestion[] {
  if (!body.trim()) return []

  return body
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [term, lang, frequency, flag] = line.split("\t")
      return {
        term: term ?? "",
        lang: lang ?? "",
        frequency: Number(frequency) || 0,
        flag: Number(flag) || 0,
      }
    })
    .filter((s) => s.term)
}

/** Strip accents/diacritics and lowercase for verbatim comparison. */
export function foldTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
}

/**
 * Pin accent-insensitive exact matches to the top:
 * entry-language match first, exit-language match second, then the rest.
 */
export function rankSuggestions(
  suggestions: Suggestion[],
  query: string,
  fromLang: string,
  toLang: string
): Suggestion[] {
  const needle = foldTerm(query.trim())
  if (!needle) return suggestions

  const exact = suggestions.filter((s) => foldTerm(s.term) === needle)
  const entryExact = exact.find((s) => s.lang === fromLang)
  const exitExact = exact.find((s) => s.lang === toLang)

  const pinned: Suggestion[] = []
  if (entryExact) pinned.push(entryExact)
  if (exitExact && exitExact !== entryExact) pinned.push(exitExact)

  if (pinned.length === 0) return suggestions

  const pinnedKeys = new Set(pinned.map((s) => `${s.lang}\0${s.term}`))
  const rest = suggestions.filter((s) => !pinnedKeys.has(`${s.lang}\0${s.term}`))
  return [...pinned, ...rest]
}
