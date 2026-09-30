'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

import { hexToRgb, hsvToRgb, normalizeHex, readableOn, rgbToHex, rgbToHsv, type Hsv } from '../colors'
import { usePreferences, type CustomColors } from '../store'

/** The picker's square, in CSS pixels: one step per 0-255 channel value (Carlos, 2026-09-30). */
const SIZE = 255
type Target = keyof CustomColors

/**
 * Settings → Themes → Custom… (Carlos, 2026-09-30): pick a primary and a
 * secondary colour on a 255 x 255 saturation/brightness square with a hue
 * bar, or type a hex code. Saving switches the palette to Custom.
 *
 * The square and hue bar draw raw colours by nature -- they are the one
 * place a literal colour is the point, not a token.
 */
export function CustomThemeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const saved = usePreferences((s) => s.customColors)
  const setCustomColors = usePreferences((s) => s.setCustomColors)
  const [draft, setDraft] = useState<CustomColors>(saved)
  const [target, setTarget] = useState<Target>('primary')
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(hexToRgb(saved.primary)))
  const [hexText, setHexText] = useState(saved.primary)
  const squareRef = useRef<HTMLDivElement>(null)
  const hexId = useId()

  // Each time the dialog opens, start from what is saved.
  useEffect(() => {
    if (!open) return
    setDraft(saved)
    setTarget('primary')
    setHsv(rgbToHsv(hexToRgb(saved.primary)))
    setHexText(saved.primary)
  }, [open, saved])

  function apply(next: Hsv) {
    setHsv(next)
    const hex = rgbToHex(hsvToRgb(next))
    setHexText(hex)
    setDraft((current) => ({ ...current, [target]: hex }))
  }

  function pick(target: Target) {
    setTarget(target)
    setHsv(rgbToHsv(hexToRgb(draft[target])))
    setHexText(draft[target])
  }

  function fromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const box = squareRef.current?.getBoundingClientRect()
    if (!box) return
    const s = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width))
    const v = Math.min(1, Math.max(0, 1 - (event.clientY - box.top) / box.height))
    apply({ ...hsv, s, v })
  }

  const current = draft[target]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your own theme</DialogTitle>
          <DialogDescription>Pick a primary and a secondary colour. Buttons, highlights and charts follow them.</DialogDescription>
        </DialogHeader>

        <ToggleGroup variant="outline" spacing={0} className="w-full" value={[target]} onValueChange={(value) => value[0] && pick(value[0] as Target)}>
          {(['primary', 'secondary'] as const).map((key) => (
            <ToggleGroupItem key={key} value={key} className="h-10 flex-1 gap-2 capitalize aria-pressed:bg-accent">
              <span aria-hidden className="size-4 rounded-full ring-1 ring-foreground/20" style={{ background: draft[key] }} />
              {key}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="grid justify-items-center gap-4">
          <div
            ref={squareRef}
            role="slider"
            tabIndex={0}
            aria-label={`${target} colour: saturation and brightness`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(hsv.s * 100)}
            aria-valuetext={`${current}: saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              fromPointer(event)
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event)
            }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 0.1 : 1 / SIZE
              const moves: Record<string, Partial<Hsv>> = {
                ArrowLeft: { s: Math.max(0, hsv.s - step) },
                ArrowRight: { s: Math.min(1, hsv.s + step) },
                ArrowUp: { v: Math.min(1, hsv.v + step) },
                ArrowDown: { v: Math.max(0, hsv.v - step) },
              }
              const move = moves[event.key]
              if (!move) return
              event.preventDefault()
              apply({ ...hsv, ...move })
            }}
            className="relative cursor-crosshair touch-none rounded-lg ring-1 ring-foreground/15 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            style={{
              width: SIZE,
              height: SIZE,
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow"
              style={{ left: hsv.s * SIZE, top: (1 - hsv.v) * SIZE, background: current, borderColor: readableOn(current) }}
            />
          </div>
          <Slider
            aria-label="Hue"
            min={0}
            max={359}
            value={[Math.round(hsv.h)]}
            onValueChange={(value) => apply({ ...hsv, h: Array.isArray(value) ? value[0] : value })}
            className="hue-slider"
            style={{ width: SIZE }}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={hexId}>Hex code</Label>
            <Input
              id={hexId}
              value={hexText}
              maxLength={7}
              spellCheck={false}
              onChange={(event) => {
                setHexText(event.target.value)
                const hex = normalizeHex(event.target.value)
                if (hex) {
                  setHsv(rgbToHsv(hexToRgb(hex)))
                  setDraft((d) => ({ ...d, [target]: hex }))
                }
              }}
              className={cn('figure h-10 rounded-xl uppercase', !normalizeHex(hexText) && 'ring-2 ring-destructive/60')}
            />
          </div>
          <span
            className="grid h-10 min-w-24 place-items-center rounded-xl px-3 text-sm font-semibold"
            style={{ background: draft.primary, color: readableOn(draft.primary) }}
          >
            Preview
          </span>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-full"
            onClick={() => {
              setCustomColors(draft)
              onOpenChange(false)
            }}
          >
            Use these colours
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
