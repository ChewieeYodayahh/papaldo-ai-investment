/**
 * The app's server services pass Next's own fetch option
 * (`next: { revalidate }`), which Next declares globally. The video
 * type-checks those files through the components it imports, so it declares
 * the option too. Types only.
 */
export {};

declare global {
  interface RequestInit {
    next?: { revalidate?: number | false; tags?: string[] };
  }
}
