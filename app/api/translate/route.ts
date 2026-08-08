import { NextResponse } from "next/server"

import {
  fetchTranslation,
  isValidDict,
  parseTranslation,
} from "@/lib/wordreference"

const cache = new Map<string, { at: number; data: ReturnType<typeof parseTranslation> }>()
const TTL_MS = 1000 * 60 * 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dict = searchParams.get("dict") ?? ""
  const term = (searchParams.get("w") ?? "").trim()

  if (!isValidDict(dict)) {
    return NextResponse.json({ error: "Invalid dictionary" }, { status: 400 })
  }

  if (!term) {
    return NextResponse.json({ error: "Missing term" }, { status: 400 })
  }

  const key = `${dict}:${term.toLowerCase()}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.data)
  }

  try {
    const html = await fetchTranslation(dict, term)
    const data = parseTranslation(html)
    cache.set(key, { at: Date.now(), data })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Translation lookup failed" }, { status: 502 })
  }
}
