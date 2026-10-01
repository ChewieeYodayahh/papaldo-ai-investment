import { useEffect, useLayoutEffect, useRef } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/app/features/userData/frame/components/AppHeader";
import { AppSidebar } from "@/app/features/userData/frame/components/AppSidebar";
import { FxProvider } from "@/app/features/userData/preferences/components/Money";

import { setClipPathname } from "../shims/next-navigation";
import { SAMPLE_USER } from "./sample";

/**
 * The element that scrolls this page: the inset panel on a laptop, the
 * screen-high wrapper on a phone. Never the document: a render captures the
 * top of the document whatever its scroll, so a scrolled document would show
 * the wrong part and push fixed things (the tutorial panel) out of the shot.
 */
function scroller(screen: HTMLElement): Element {
  const inset = screen.querySelector<HTMLElement>("[data-slot=sidebar-inset]");
  return inset && inset.scrollHeight > inset.clientHeight + 1 ? inset : screen;
}

/**
 * The signed-in app around a page, exactly as AppShell renders it (its
 * markup, with the real sidebar and header), for the sample account. At the
 * phone size the sidebar folds into its sheet and the header takes its phone
 * layout, because the clip's viewport *is* a phone.
 *
 * `path` tells the sidebar and header which page this is. `scrollY` scrolls
 * the page for real (set every frame, so it wins over anything the page
 * scrolls itself), which keeps fixed things -- the phone's tutorial panel --
 * fixed to the screen.
 */
export const AppFrame: React.FC<{
  path: string;
  scrollY?: number;
  children: React.ReactNode;
}> = ({ path, scrollY = 0, children }) => {
  setClipPathname(path);
  const ref = useRef<HTMLDivElement>(null);

  const wanted = useRef(scrollY);
  wanted.current = scrollY;

  // Set on every render, and kept set while the page finishes loading:
  // focus and layout work during loading can put the scroll back to the top.
  useLayoutEffect(() => {
    if (ref.current) scroller(ref.current).scrollTop = wanted.current;
  });
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (ref.current) scroller(ref.current).scrollTop = wanted.current;
    }, 40);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <FxProvider fx={null}>
      <div ref={ref} className="h-svh overflow-hidden">
        <div
          data-app-shell
          className="app-backdrop min-h-svh md:p-(--frame-gap)"
        >
          <SidebarProvider
            defaultOpen
            className="app-frame relative mx-auto min-h-svh max-w-[2000px] md:h-[calc(100svh-2*var(--frame-gap))] md:min-h-0 md:overflow-hidden md:rounded-[1.75rem] md:ring-1 md:ring-foreground/10"
          >
            <AppSidebar isAdmin={false} />
            <SidebarInset className="min-w-0 bg-transparent md:overflow-hidden">
              <div className="w-full px-4 pb-24 md:pr-5 md:pl-2">
                <AppHeader
                  user={SAMPLE_USER}
                  notifications={[]}
                  social={[]}
                  greetingSeed={1}
                />
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </div>
    </FxProvider>
  );
};
