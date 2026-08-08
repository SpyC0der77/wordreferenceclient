export interface Suggestion {
  term: string
  lang: string
  frequency: number
  flag: number
}

export interface Translation {
  text: string
  pos?: string
  note?: string
}

export interface Sense {
  id?: string
  from: string
  fromPos?: string
  sense?: string
  register?: string[]
  to: Translation[]
  examples: { from?: string; to?: string }[]
}

export interface Section {
  id: string
  title: string
  senses: Sense[]
}

export interface LookupResult {
  sections: Section[]
  notFound: boolean
  message?: string
  suggestions: string[]
}
