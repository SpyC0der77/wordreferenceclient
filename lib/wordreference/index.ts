export type { Suggestion, Translation, Sense, Section, LookupResult } from "./types"
export type { Language } from "./dictionaries"
export {
  LANGUAGES,
  VALID_DICTS,
  getLanguageLabel,
  toDictCode,
  isValidDict,
  getSourceLanguages,
  getTargetsFor,
  canSwap,
} from "./dictionaries"
export { parseAutocomplete, foldTerm, rankSuggestions } from "./parse-autocomplete"
export { parseTranslation } from "./parse-translation"
export { fetchAutocomplete, fetchTranslation } from "./fetch"
