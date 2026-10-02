import Image from 'next/image'

import { cn } from '@/lib/utils'

/**
 * The real app on a MacBook and an iPhone (2026-10-02, static). Each screen
 * is a still of Papaldo's own components with a sample account, rendered at
 * 2x by marketing/video (scripts/render-shots.mjs): the laptop at 1024 x 640,
 * where the app is already at its roomiest, and the phone at the app's real
 * 392 x 848 phone layout. The two devices are never combined, so each gets
 * the room to be read. The animated clips stay for the promo video.
 *
 * The device bodies are Adobe Stock mockups Carlos licenses (front view,
 * transparent screen) in public/landing/devices/. Until a file is in place
 * its frame below is null and a drawn CSS frame stands in.
 */

export type LaptopShot = 'dashboard' | 'quiz' | 'trade' | 'learn' | 'markets'
export type PhoneShot = 'dashboard' | 'trade' | 'learn'

type Frame = {
  src: string
  /** The PNG's own size, for its aspect ratio. */
  width: number
  height: number
  /** Where its screen sits, in percent of the PNG, measured from the file. */
  screen: { left: number; top: number; width: number; height: number; radius: string }
}

const MACBOOK_FRAME: Frame | null = null
const IPHONE_FRAME: Frame | null = null

const shot = (name: string) => `/landing/shots/${name}.webp`

/** The screenshot under a mockup PNG whose screen is transparent, so the PNG's own bezel, notch and corners sit on top. */
function MockupFrame({ frame, src, alt, sizes, priority, className }: { frame: Frame; src: string; alt: string; sizes: string; priority?: boolean; className?: string }) {
  const { screen } = frame
  return (
    <figure className={cn('relative', className)} style={{ aspectRatio: `${frame.width} / ${frame.height}` }}>
      <div
        className="absolute overflow-hidden bg-background"
        style={{ left: `${screen.left}%`, top: `${screen.top}%`, width: `${screen.width}%`, height: `${screen.height}%`, borderRadius: screen.radius }}
      >
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover object-top" />
      </div>
      <Image src={frame.src} alt="" aria-hidden fill priority={priority} sizes={sizes} className="pointer-events-none object-contain" />
    </figure>
  )
}

export function MacBook({
  shot: name,
  alt,
  priority = false,
  sizes = '(min-width: 1280px) 1100px, 92vw',
  className,
}: {
  shot: LaptopShot
  /** What the screen shows, for screen readers. */
  alt: string
  priority?: boolean
  sizes?: string
  className?: string
}) {
  const src = shot(`${name}-laptop`)
  if (MACBOOK_FRAME) return <MockupFrame frame={MACBOOK_FRAME} src={src} alt={alt} sizes={sizes} priority={priority} className={className} />

  // Stand-in: the screen in a thin graphite bezel with a notch, on a shallow base. The screen is the still's 16:10.
  return (
    <figure className={cn('relative', className)}>
      <div className="rounded-t-[2.4%_3.8%] bg-device p-[1.4%] pb-[1.8%] shadow-[0_40px_80px_-28px_color-mix(in_oklch,var(--device)_85%,transparent)] ring-1 ring-device-edge">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.5%_0.8%] bg-background">
          <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover object-top" />
          <div aria-hidden className="absolute top-0 left-1/2 h-[2.6%] w-[12%] -translate-x-1/2 rounded-b-[0.6rem] bg-device" />
        </div>
      </div>
      <div aria-hidden className="relative -mx-[6%] h-[2.6%] min-h-2 rounded-b-[45%_100%] bg-device-edge">
        <div className="absolute top-0 left-1/2 h-1/2 w-[13%] -translate-x-1/2 rounded-b-md bg-device" />
      </div>
    </figure>
  )
}

export function IPhone({
  shot: name,
  alt,
  sizes = '(min-width: 1024px) 320px, 70vw',
  className,
}: {
  shot: PhoneShot
  alt: string
  sizes?: string
  className?: string
}) {
  const src = shot(`${name}-phone`)
  if (IPHONE_FRAME) return <MockupFrame frame={IPHONE_FRAME} src={src} alt={alt} sizes={sizes} className={className} />

  // Stand-in: rounded graphite body, the screen at the app's 392 x 848, a Dynamic Island.
  return (
    <figure className={cn('rounded-[15%_7%] bg-device p-[3.2%] shadow-[0_30px_60px_-22px_color-mix(in_oklch,var(--device)_85%,transparent)] ring-1 ring-device-edge', className)}>
      <div className="relative aspect-[392/848] overflow-hidden rounded-[12%_5.6%] bg-background">
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" />
        <div aria-hidden className="absolute top-[1.5%] left-1/2 h-[3.4%] w-[31%] -translate-x-1/2 rounded-full bg-device" />
      </div>
    </figure>
  )
}
