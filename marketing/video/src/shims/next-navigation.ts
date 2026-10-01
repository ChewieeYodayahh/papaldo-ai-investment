/**
 * Stand-ins for next/navigation in the video: navigation is a no-op.
 *
 * The pathname is settable so each landing clip can tell the real sidebar and
 * header which page they are on (the dashboard greets, /markets says
 * "Markets"). A clip calls `setClipPathname` while rendering, before its app
 * frame renders.
 */
const router = { push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, forward: () => {}, prefetch: () => {} };

let pathname = "/tools";

export function setClipPathname(path: string) {
  pathname = path;
}

export const useRouter = () => router;
export const usePathname = () => pathname;
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
export const redirect = () => {};
export const notFound = () => {};
