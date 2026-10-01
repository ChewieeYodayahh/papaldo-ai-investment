import { forwardRef } from "react";

/** Stand-in for next/link in the video: a plain anchor (a video has no router). */
const Link = forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string | { pathname?: string }; prefetch?: boolean; replace?: boolean; scroll?: boolean }>(
  function Link({ href, prefetch: _prefetch, replace: _replace, scroll: _scroll, ...rest }, ref) {
    return <a ref={ref} href={typeof href === "string" ? href : (href.pathname ?? "#")} {...rest} />;
  },
);

export default Link;
export const useLinkStatus = () => ({ pending: false });
