/**
 * The shareable result card (Carlos, 2026-09-29): a 1200x630 image -- the
 * size link previews use -- drawn on a canvas in the page's own theme
 * colours, then saved as PNG or JPG, or handed to the phone's share sheet.
 *
 * Drawn by hand rather than screenshotting the DOM: no extra dependency, and
 * the card has its own layout instead of whatever the page looked like.
 * Everything happens in the browser; nothing is uploaded.
 */

export type ShareCard = {
  eyebrow: string
  title: string
  subtitle: string
  stats: Array<{ label: string; value: string }>
  buysLabel: string
  buys: string[]
  footer: string
}

export type ImageFormat = 'png' | 'jpeg'

const WIDTH = 1200
const HEIGHT = 630
const PAD = 64

/** A CSS custom property as a colour the canvas understands, with a fallback. */
function token(name: string, fallback: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value || fallback
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    } else {
      line = next
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function renderShareImage(card: ShareCard, format: ImageFormat): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot draw images.')

  await document.fonts?.ready
  const font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'
  const background = token('--background', '#0f1a12')
  const surface = token('--card', '#16241a')
  const text = token('--foreground', '#f4f7f4')
  const muted = token('--muted-foreground', '#a3b3a5')
  const accent = token('--primary', '#9be15d')
  const border = token('--border', 'rgba(255,255,255,0.1)')

  // Ground, then a soft accent glow in the top-right corner.
  ctx.fillStyle = background
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  const glow = ctx.createRadialGradient(WIDTH - 120, 40, 20, WIDTH - 120, 40, 520)
  glow.addColorStop(0, accent)
  glow.addColorStop(1, 'transparent')
  ctx.globalAlpha = 0.18
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.globalAlpha = 1

  ctx.textBaseline = 'top'
  ctx.fillStyle = muted
  ctx.font = `600 22px ${font}`
  ctx.fillText(card.eyebrow, PAD, PAD - 8)

  ctx.fillStyle = text
  ctx.font = `700 52px ${font}`
  let y = PAD + 32
  for (const line of wrap(ctx, card.title, WIDTH - PAD * 2, 2)) {
    ctx.fillText(line, PAD, y)
    y += 62
  }

  ctx.fillStyle = muted
  ctx.font = `500 24px ${font}`
  ctx.fillText(card.subtitle, PAD, y + 4)
  y += 56

  // Stat boxes.
  const stats = card.stats.slice(0, 4)
  const gap = 18
  const boxW = (WIDTH - PAD * 2 - gap * (stats.length - 1)) / Math.max(1, stats.length)
  stats.forEach((stat, i) => {
    const x = PAD + i * (boxW + gap)
    ctx.fillStyle = surface
    roundRect(ctx, x, y, boxW, 108, 20)
    ctx.fill()
    ctx.strokeStyle = border
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = muted
    ctx.font = `500 19px ${font}`
    ctx.fillText(stat.label, x + 22, y + 20)
    ctx.fillStyle = i === 0 ? accent : text
    ctx.font = `700 34px ${font}`
    ctx.fillText(stat.value, x + 22, y + 54, boxW - 44)
  })
  y += 140

  // What it buys, as chips.
  if (card.buys.length) {
    ctx.fillStyle = muted
    ctx.font = `500 20px ${font}`
    ctx.fillText(card.buysLabel, PAD, y)
    y += 36
    let x = PAD
    ctx.font = `600 24px ${font}`
    for (const item of card.buys) {
      const w = ctx.measureText(item).width + 40
      if (x + w > WIDTH - PAD) break
      ctx.fillStyle = surface
      roundRect(ctx, x, y, w, 48, 24)
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = text
      ctx.fillText(item, x + 20, y + 12)
      x += w + 12
    }
  }

  ctx.fillStyle = muted
  ctx.font = `500 17px ${font}`
  ctx.textBaseline = 'bottom'
  ctx.fillText(card.footer, PAD, HEIGHT - 32)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be created.'))),
      format === 'png' ? 'image/png' : 'image/jpeg',
      0.92,
    )
  })
}

/** Saves the image, or opens the share sheet where the browser supports sharing files. */
export async function shareOrDownload(card: ShareCard, format: ImageFormat, filename: string, preferShare: boolean) {
  const blob = await renderShareImage(card, format)
  const file = new File([blob], `${filename}.${format === 'png' ? 'png' : 'jpg'}`, { type: blob.type })

  if (preferShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: card.title })
      return 'shared' as const
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return 'cancelled' as const
      // Fall through to a download when sharing fails for any other reason.
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded' as const
}
