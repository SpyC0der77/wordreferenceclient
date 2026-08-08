/** ISO 3166-1 alpha-2 country codes for flag images (flagcdn). */
const LANGUAGE_COUNTRIES: Record<string, string> = {
  en: "gb",
  es: "es",
  fr: "fr",
  it: "it",
  pt: "pt",
  de: "de",
  nl: "nl",
  sv: "se",
  ru: "ru",
  pl: "pl",
  ro: "ro",
  cz: "cz",
  gr: "gr",
  tr: "tr",
  zh: "cn",
  ja: "jp",
  ko: "kr",
  ar: "sa",
}

export function getLanguageCountryCode(code: string): string | null {
  return LANGUAGE_COUNTRIES[code] ?? null
}

export function getLanguageFlagUrl(code: string, width = 20): string | null {
  const country = getLanguageCountryCode(code)
  if (!country) return null
  return `https://flagcdn.com/w${width}/${country}.png`
}
