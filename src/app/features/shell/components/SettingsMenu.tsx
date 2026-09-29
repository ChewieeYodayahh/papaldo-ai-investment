'use client'

import { useRouter } from 'next/navigation'
import { Globe, LogOut, Palette as PaletteIcon, Settings, UserRound } from 'lucide-react'
import { useTheme } from 'next-themes'

import { useSignOut } from '@/app/features/auth/components/SignOutButton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCopy } from '@/app/features/preferences/copy'
import {
  FONTS,
  LANGUAGES,
  PALETTES,
  usePreferences,
  type Font,
  type Language,
  type Palette,
} from '@/app/features/preferences/store'

const FONT_LABELS: Record<Font, string> = {
  figtree: 'Figtree',
  geist: 'Geist',
  system: 'System default',
}

/**
 * The header gear: Profile, Themes (mode, palette, font), Language and, when
 * signed in, Sign out. Also in the public top bar, where only the display
 * settings show.
 *
 * Palette swatches are painted by rendering a tiny element under that
 * palette's own `data-palette` attribute, so the preview is the real token --
 * no second copy of the colour lives in this file.
 */
export function SettingsMenu({ signedIn }: { signedIn: boolean }) {
  const t = useCopy()
  const router = useRouter()
  const { signOut } = useSignOut()
  const { theme, setTheme } = useTheme()
  const palette = usePreferences((s) => s.palette)
  const setPalette = usePreferences((s) => s.setPalette)
  const font = usePreferences((s) => s.font)
  const setFont = usePreferences((s) => s.setFont)
  const language = usePreferences((s) => s.language)
  const setLanguage = usePreferences((s) => s.setLanguage)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={t('header.settings')}
            className="rounded-full bg-card ring-1 ring-foreground/10"
          />
        }
      >
        <Settings className="size-[1.125rem]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {signedIn ? (
          <>
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <UserRound />
              {t('header.profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <PaletteIcon />
            {t('header.themes')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('header.mode')}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme ?? 'dark'} onValueChange={(value) => setTheme(String(value))}>
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <DropdownMenuRadioItem key={mode} value={mode}>
                    {t(`header.mode.${mode}`)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('header.themes')}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={palette} onValueChange={(value) => setPalette(value as Palette)}>
                {PALETTES.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    <span
                      // The swatch wears its own palette, so it shows the real token.
                      data-palette={option}
                      className="size-4 rounded-full bg-sidebar ring-1 ring-foreground/20"
                      aria-hidden
                    />
                    {t(`header.palette.${option}`)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('header.fonts')}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={font} onValueChange={(value) => setFont(value as Font)}>
                {FONTS.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {FONT_LABELS[option]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Globe />
            {t('header.language')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as Language)}>
              {LANGUAGES.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {t(`header.lang.${option}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {signedIn ? null : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-normal">{t('header.guestNote')}</DropdownMenuLabel>
            </DropdownMenuGroup>
          </>
        )}

        {signedIn ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut />
              {t('header.signout')}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
