export interface Language {
  code: string
  label: string
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "de", label: "German" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
  { code: "ru", label: "Russian" },
  { code: "pl", label: "Polish" },
  { code: "ro", label: "Romanian" },
  { code: "cz", label: "Czech" },
  { code: "gr", label: "Greek" },
  { code: "tr", label: "Turkish" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
]

/** Valid bilingual dictionary codes from WordReference. */
export const VALID_DICTS = new Set([
  "enes",
  "esen",
  "enfr",
  "fren",
  "enit",
  "iten",
  "enpt",
  "pten",
  "ende",
  "deen",
  "ennl",
  "nlen",
  "ensv",
  "sven",
  "enru",
  "ruen",
  "enpl",
  "plen",
  "enro",
  "roen",
  "encz",
  "czen",
  "engr",
  "gren",
  "entr",
  "tren",
  "enzh",
  "zhen",
  "enja",
  "jaen",
  "enko",
  "koen",
  "enar",
  "aren",
  "esfr",
  "fres",
  "espt",
  "ptes",
  "esit",
  "ites",
  "esde",
  "dees",
  "frit",
])

const LANGUAGE_BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]))

export function getLanguageLabel(code: string): string {
  return LANGUAGE_BY_CODE.get(code)?.label ?? code
}

export function toDictCode(from: string, to: string): string | null {
  const code = `${from}${to}`
  return VALID_DICTS.has(code) ? code : null
}

export function isValidDict(dict: string): boolean {
  return VALID_DICTS.has(dict)
}

export function getSourceLanguages(): Language[] {
  const sources = new Set<string>()
  for (const dict of VALID_DICTS) {
    sources.add(dict.slice(0, 2))
  }
  return LANGUAGES.filter((l) => sources.has(l.code))
}

export function getTargetsFor(from: string): Language[] {
  const targets = new Set<string>()
  for (const dict of VALID_DICTS) {
    if (dict.startsWith(from) && dict.length === 4) targets.add(dict.slice(2))
  }
  return LANGUAGES.filter((l) => targets.has(l.code))
}

export function canSwap(from: string, to: string): boolean {
  return toDictCode(to, from) !== null
}
