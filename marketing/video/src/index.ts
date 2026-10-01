import "./shims/fetch";
import "./app.css";

import { registerRoot } from "remotion";

import { RemotionRoot } from "./Root";

// Dialogs and popovers portal to <body>, outside the scenes' themed wrapper:
// put the app's dark Midnight theme on <html>, as the app itself does.
document.documentElement.classList.add("dark");
document.documentElement.setAttribute("data-palette", "midnight");

registerRoot(RemotionRoot);
