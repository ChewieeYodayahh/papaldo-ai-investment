---
name: nextjs-project-structure
description: Proper Next.js App Router routing and folder structure. Use when creating routes, pages, layouts or API route handlers; when deciding where a component, hook, service or asset file belongs; when scaffolding a feature or a new screen; or when auditing a Next.js project's folder layout.
---

# Next.js project structure

The layout every route, component, service and asset in a Next.js App Router project
should match. Put a new file where this document says it goes; when reorganising, move
files toward this shape.

## Canonical tree

```
public/
  assets/
    fonts/
      <family>/                      # one folder per typeface (futura_display/, poppins/, vt323/)
    icons/
    logos/
    <domain>/                        # domain asset sets (resume_templates/)
src/
  app/
    api/
      <resource>/
        route.ts                     # one route handler per resource noun
    core/
      services/
        <client>.ts                  # one file per external API client (claude.ts)
    themes/                          # theme tokens / palettes
    features/
      <feature>/                     # snake_case feature module
        <section>/                   # one folder per UI section (hero/, about/, sample/)
          <section>.web.tsx
          <section>.mobile.tsx
        <feature>.desktop.tsx        # feature-root composition, one per target
        <feature>.mobile.tsx
    <segment>/
      page.tsx                       # routable segment; thin, composes a feature
    layout.tsx
    page.tsx
    globals.css
    favicon.ico
  components/                        # cross-feature presentational components
  lib/                              # framework-agnostic helpers
  <domain>_components/               # component bucket for one product surface (rb_components/)
```

## Routing — `src/app/`

- **All application code lives under `src/`.** The repository root holds configuration
  only (`next.config.ts`, `tsconfig.json`, `package.json`, `middleware.ts`, lockfiles).
- `src/app/` is the App Router root. Keep `layout.tsx`, `page.tsx`, `globals.css` and
  `favicon.ico` at its top level.
- **Route handlers go in `src/app/api/<resource>/route.ts`**, one folder per resource
  noun (`api/review/route.ts`, `api/auth/route.ts`). Nest deeper for sub-resources
  (`api/auth/callback/route.ts`).
- **A routable page segment is a plain folder under `src/app/`** with a `page.tsx` that
  stays thin: it composes a feature module and passes it data, nothing more. Business
  logic and markup live in the feature, not in `page.tsx`.
- **`src/app/core/`** holds app-wide infrastructure that is not itself a route.
  `core/services/` holds one file per external API client wrapper (`claude.ts` wraps the
  Anthropic API); a component or feature imports the wrapper, never the raw SDK or
  `fetch` to a third-party host.
- **`src/app/themes/`** holds theme tokens, palettes and mode definitions.

## Features — `src/app/features/<feature>/`

- Each product surface is one feature folder under `src/app/features/`, named in
  `snake_case` (`landing_page`, `onboarding`).
- **Split the feature into section folders** — one per distinct UI region of that
  surface (`hero/`, `about/`, `features/`, `sample/`).
- **Feature-root composition files** sit directly in `<feature>/`, named after the
  feature (`landing.desktop.tsx`, `landing.mobile.tsx`). They assemble the sections into
  the full surface.
- The `src/app/<segment>/page.tsx` that renders the feature imports only the
  feature-root composition file for the current target.

## Responsive variants — `<name>.<target>.tsx`

- Name a responsive component `<name>.<target>.tsx` where `target` is `web`, `mobile` or
  `desktop`.
- **Section files are named after their section** (`sample.web.tsx`,
  `sample.mobile.tsx`); **feature-root files are named after the feature**
  (`landing.desktop.tsx`, `landing.mobile.tsx`).
- Pick one target axis per component and use it consistently — either `web` / `mobile`
  or `desktop` / `mobile`. Keep shared, layout-agnostic logic in a plain `<name>.tsx`
  and let each variant import it.

## Shared buckets — `src/`

- **`src/components/`** — presentational components reused across more than one feature.
- **`src/lib/`** — framework-agnostic helpers and utilities (formatting, math, parsing).
  No React, no Next.js imports.
- **`src/<domain>_components/`** — a component bucket scoped to a single product surface
  that is large enough to warrant its own namespace (`rb_components/` for the
  resume-builder surface). Prefix with the surface's short name.

## Static assets — `public/assets/`

- Group by kind: `public/assets/fonts/`, `public/assets/icons/`, `public/assets/logos/`.
- Under `fonts/`, one folder per typeface family (`fonts/poppins/`).
- Domain-specific asset sets get their own folder (`public/assets/resume_templates/`).

## Where does this file go?

| The file is… | Put it in |
| --- | --- |
| a user-visible route | `src/app/<segment>/page.tsx` (thin; composes a feature) |
| an HTTP handler | `src/app/api/<resource>/route.ts` |
| one UI region of a feature | `src/app/features/<feature>/<section>/<section>.<target>.tsx` |
| the whole-feature layout | `src/app/features/<feature>/<feature>.<target>.tsx` |
| a wrapper around an external API | `src/app/core/services/<client>.ts` |
| theme tokens / palette | `src/app/themes/` |
| a component used by 2+ features | `src/components/` |
| a pure helper (no React/Next) | `src/lib/` |
| a component library for one big surface | `src/<domain>_components/` |
| a font, icon, logo or template asset | `public/assets/<kind>/` |

## Stated inferences

A folder tree does not show intent. These two conventions are read from the reference
structure and named here so they can be corrected if the reference project meant
something else:

- **`core/services/` = one file per external API client.** The reference shows only
  `core/services/claude.ts`; the rule generalises that to "external integrations live
  here, one file each".
- **`<domain>_components/` uses a short domain prefix.** The reference shows
  `rb_components/`; `rb` is read as the resume-builder surface's abbreviation.
