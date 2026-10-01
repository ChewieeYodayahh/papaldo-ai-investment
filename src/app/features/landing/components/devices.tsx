'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * The real app on a laptop and a phone (2026-10-02). The clips are renders
 * of Papaldo's own components with a sample account (marketing/video,
 * scripts/render-clips.mjs), at real device sizes -- the phone clip is the
 * app's actual phone layout. Each loads only when it is about to be seen,
 * plays while on screen, and stays a still frame for reduced motion.
 */

export type ClipScene = 'dashboard' | 'quiz' | 'trade' | 'learn' | 'markets'
type Device = 'laptop' | 'phone'

const clip = (scene: ClipScene, device: Device, ext: string) => `/landing/clips/${scene}-${device}.${ext}`

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function ClipVideo({ scene, device, active = true, eager = false }: { scene: ClipScene; device: Device; active?: boolean; eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = usePrefersReducedMotion()
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (inView && active && !reduced) {
      // Autoplay can be refused (data saver, power saving): the poster stays.
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [inView, active, reduced])

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload={eager ? 'metadata' : 'none'}
      poster={clip(scene, device, 'jpg')}
      aria-hidden
      tabIndex={-1}
      className="absolute inset-0 size-full object-cover object-top"
    >
      <source src={clip(scene, device, 'webm')} type="video/webm" />
      <source src={clip(scene, device, 'mp4')} type="video/mp4" />
    </video>
  )
}

/** A laptop: screen in a thin graphite bezel, on a shallow base. The screen is the clip's 16:10. */
export function Laptop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="rounded-t-[4%_6.4%] bg-device p-[1.6%] pb-[2.2%] shadow-[0_30px_60px_-20px_color-mix(in_oklch,var(--device)_85%,transparent)] ring-1 ring-device-edge">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.6%_0.96%] bg-background">{children}</div>
      </div>
      <div className="relative -mx-[5%] h-[3.6%] min-h-2.5 rounded-b-[40%_100%] bg-device-edge">
        <div className="absolute top-0 left-1/2 h-1/2 w-[14%] -translate-x-1/2 rounded-b-md bg-device" />
      </div>
    </div>
  )
}

/** A phone: rounded graphite body, the screen at the clip's 392 x 848, a camera island. */
export function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14%_6.6%] bg-device p-[3.4%] shadow-[0_26px_50px_-18px_color-mix(in_oklch,var(--device)_85%,transparent)] ring-1 ring-device-edge">
      <div className="relative aspect-[392/848] overflow-hidden rounded-[11%_5.2%] bg-background">
        {children}
        <div className="absolute top-[1.6%] left-1/2 h-[3.1%] w-[30%] -translate-x-1/2 rounded-full bg-device" />
      </div>
    </div>
  )
}

/**
 * One screen of the app, on both devices: the laptop, and the phone standing
 * in front of its corner. `active` lets a stack of pairs (How it works) play
 * only the one showing.
 */
export function DevicePair({
  scene,
  label,
  active = true,
  eager = false,
  className,
}: {
  scene: ClipScene
  /** What the clip shows, for screen readers. */
  label: string
  active?: boolean
  eager?: boolean
  className?: string
}) {
  return (
    <figure className={cn('relative pb-[9%]', className)}>
      <div className="w-[88%]">
        <Laptop>
          <ClipVideo scene={scene} device="laptop" active={active} eager={eager} />
        </Laptop>
      </div>
      <div className="absolute right-0 bottom-0 w-[31%] sm:w-[25%]">
        <Phone>
          <ClipVideo scene={scene} device="phone" active={active} eager={eager} />
        </Phone>
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  )
}
