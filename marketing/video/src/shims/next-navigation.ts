/** Stand-ins for next/navigation in the video: navigation is a no-op. */
const router = { push: () => {}, replace: () => {}, refresh: () => {}, back: () => {}, forward: () => {}, prefetch: () => {} };

export const useRouter = () => router;
export const usePathname = () => "/tools";
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
export const redirect = () => {};
export const notFound = () => {};
