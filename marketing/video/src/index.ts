import "./shims/fetch";
import "./app.css";

import { registerRoot } from "remotion";

import { RemotionRoot } from "./Root";
import { fontFamily } from "./theme";

// Dialogs and popovers portal to <body>, outside the scenes' themed wrapper:
// put the app's dark Midnight theme and its font on <html>, as the app does.
document.documentElement.classList.add("dark");
document.documentElement.setAttribute("data-palette", "midnight");
document.documentElement.style.setProperty("--font-sans", fontFamily);

// Real components scroll their targets into view smoothly (Tutorial Mode). A
// frame is a photograph: jump there at once so every frame sees the same page.
const scrollIntoView = Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView = function (options?: boolean | ScrollIntoViewOptions) {
  scrollIntoView.call(this, typeof options === "object" ? { ...options, behavior: "instant" } : options);
};

registerRoot(RemotionRoot);
