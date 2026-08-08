import { NextResponse } from "next/server"

import {
  fetchAutocomplete,
  isValidDict,
  parseAutocomplete,
  rankSuggestions,
} from "@/lib/wordreference"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dict = searchParams.get("dict") ?? ""
  const query = (searchParams.get("query") ?? "").trim()

  if (!isValidDict(dict)) {
    return NextResponse.json({ error: "Invalid dictionary" }, { status: 400 })
  }

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const fromLang = dict.slice(0, 2)
  const toLang = dict.slice(2)

  try {
    const body = await fetchAutocomplete(dict, query)
    const suggestions = rankSuggestions(
      parseAutocomplete(body),
      query,
      fromLang,
      toLang
    )
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ error: "Autocomplete failed" }, { status: 502 })
  }
}
