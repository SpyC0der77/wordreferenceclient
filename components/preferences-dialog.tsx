"use client"

import { useTheme } from "next-themes"
import { SettingsIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { usePreferences } from "@/components/preferences-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
] as const

export function PreferencesDialog() {
  const { theme, setTheme } = useTheme()
  const { showFlags, setShowFlags, mounted: prefsMounted } = usePreferences()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const ready = mounted && prefsMounted

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Preferences" />
        }
      >
        <SettingsIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>Appearance settings for this client.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid gap-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  disabled={!ready}
                  className={cn(
                    ready && theme === option.value && "border-foreground bg-muted"
                  )}
                  onClick={() => setTheme(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={showFlags}
                disabled={!ready}
                onCheckedChange={(checked) => setShowFlags(checked === true)}
              />
              Show language flags
            </label>
            <p className="pl-6 text-xs text-muted-foreground">
              In language dropdowns and search suggestions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
