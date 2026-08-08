import * as cheerio from "cheerio"
import type { AnyNode, Element } from "domhandler"

import type { LookupResult, Section, Sense, Translation } from "./types"

function cleanText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/ⓘ/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function decodeAttr(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    return decodeURIComponent(value.replace(/\+/g, " "))
  } catch {
    return value
  }
}

function textWithout($: cheerio.CheerioAPI, el: cheerio.Cheerio<AnyNode>, exclude: string): string {
  const clone = el.clone()
  clone.find(exclude).remove()
  return cleanText(clone.text())
}

function parseTranslationCell(
  $: cheerio.CheerioAPI,
  cell: cheerio.Cheerio<AnyNode>,
  note?: string
): Translation | null {
  const pos = decodeAttr(cell.find("em.POS2").first().attr("data-abbr"))
  const text = textWithout($, cell, "em.POS2")
  if (!text) return null
  return { text, pos, note: note || undefined }
}

function collectRegister($: cheerio.CheerioAPI, row: cheerio.Cheerio<Element>): string[] {
  const labels: string[] = []
  row.find("i.Fr2").each((_, el) => {
    const t = cleanText($(el).text())
    if (t) labels.push(t)
  })
  row.find("span.dsense").each((_, el) => {
    const t = cleanText($(el).text()).replace(/^\(|\)$/g, "")
    if (t) labels.push(t)
  })
  return labels
}

function middleCellNote($: cheerio.CheerioAPI, row: cheerio.Cheerio<Element>): string | undefined {
  const cells = row.children("td")
  if (cells.length < 2) return undefined
  const middle = $(cells.get(1))
  if (middle.hasClass("FrEx") || middle.hasClass("ToEx") || middle.hasClass("FrWrd") || middle.hasClass("ToWrd")) {
    return undefined
  }
  const clone = middle.clone()
  clone.find("i.Fr2, span.dsense").remove()
  const note = cleanText(clone.text())
  return note || undefined
}

function parseTables($: cheerio.CheerioAPI): Section[] {
  const sections: Section[] = []
  const tables = $("#articleWRD table.WRD").toArray()

  for (const table of tables) {
    let currentSection: Section | null = null
    let currentSense: Sense | null = null
    let pendingFromExample: string | undefined

    const rows = $(table).find("tr").toArray()
    for (const rowEl of rows) {
      const row = $(rowEl)

      if (row.hasClass("wrtopsection")) {
        if (currentSection && currentSection.senses.length > 0) sections.push(currentSection)
        const header = row.find("td").first()
        currentSection = {
          id: header.attr("id") || "section",
          title: header.attr("title") || cleanText(header.text()) || "Translations",
          senses: [],
        }
        currentSense = null
        pendingFromExample = undefined
        continue
      }

      if (!currentSection) continue
      if (row.hasClass("langHeader")) continue
      if (!row.hasClass("odd") && !row.hasClass("even")) continue

      const frWrd = row.find("td.FrWrd").first()
      const strong = frWrd.find("strong").first()
      const strongText = strong.length ? cleanText(strong.text()) : ""

      if (frWrd.length && strongText) {
        if (currentSense) currentSection.senses.push(currentSense)
        pendingFromExample = undefined

        const fromPos = decodeAttr(frWrd.find("em.POS2").first().attr("data-abbr"))
        const senseGloss = middleCellNote($, row)
        const register = collectRegister($, row)
        const toCell = row.find("td.ToWrd").first()
        const middleDsense = row.children("td").eq(1).find("span.dsense")
        const toNote = middleDsense.length
          ? cleanText(middleDsense.text()).replace(/^\(|\)$/g, "")
          : undefined

        const translations: Translation[] = []
        if (toCell.length) {
          const t = parseTranslationCell($, toCell, toNote)
          if (t) translations.push(t)
        }

        currentSense = {
          id: row.attr("id") || undefined,
          from: strongText,
          fromPos,
          sense: senseGloss,
          register: register.length ? register : undefined,
          to: translations,
          examples: [],
        }
        continue
      }

      if (!currentSense) continue

      const toWrd = row.find("td.ToWrd").first()
      if (toWrd.length) {
        const noteParts = collectRegister($, row)
        const t = parseTranslationCell($, toWrd, noteParts.join(", ") || undefined)
        if (t) currentSense.to.push(t)
        continue
      }

      const frEx = row.find("td.FrEx").first()
      if (frEx.length) {
        pendingFromExample = cleanText(frEx.text())
        continue
      }

      const toEx = row.find("td.ToEx").first()
      if (toEx.length) {
        currentSense.examples.push({
          from: pendingFromExample,
          to: cleanText(toEx.text()),
        })
        pendingFromExample = undefined
        continue
      }

      if (pendingFromExample) {
        currentSense.examples.push({ from: pendingFromExample })
        pendingFromExample = undefined
      }
    }

    if (currentSense && currentSection) currentSection.senses.push(currentSense)
    if (currentSection && currentSection.senses.length > 0) sections.push(currentSection)
  }

  return sections
}

function parseSpellSuggestions($: cheerio.CheerioAPI): string[] {
  const suggestions: string[] = []
  $("#spellSug a").each((_, el) => {
    const href = $(el).attr("href") || ""
    const match = href.match(/tranword=([^&]+)/i)
    if (match?.[1]) {
      suggestions.push(decodeURIComponent(match[1].replace(/\+/g, " ")))
      return
    }
    const text = cleanText($(el).text())
    if (text) suggestions.push(text)
  })
  return [...new Set(suggestions)]
}

export function parseTranslation(html: string): LookupResult {
  const $ = cheerio.load(html)
  // WR injects ⓘ tooltip notes (e.g. "not a translation of the original") — drop always
  $(".tooltip").remove()
  const sections = parseTables($)
  const noEntry = $("#noEntryFound")
  const notFound = sections.length === 0 && ($("#noTransFound").length > 0 || noEntry.length > 0)

  return {
    sections,
    notFound,
    message: notFound ? cleanText(noEntry.attr("title") || noEntry.text()) || "No translation found." : undefined,
    suggestions: notFound ? parseSpellSuggestions($) : [],
  }
}
