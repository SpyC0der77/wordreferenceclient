import { Suspense } from "react"

import { SearchApp } from "@/components/search/search-app"

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <SearchApp />
    </Suspense>
  )
}
