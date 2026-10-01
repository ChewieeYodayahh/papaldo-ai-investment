/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import path from "node:path";

import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

// Webpack, not Rspack: the config override below (aliases, Tailwind) only applies to webpack here.
// Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

const here = process.cwd();
const appSrc = path.resolve(here, "../../src");
const shim = (file: string) => path.resolve(here, "src/shims", file);
const own = (pkg: string) => path.resolve(here, "node_modules", pkg);

/**
 * The video renders Papaldo's real components (src/ of the app, two folders
 * up) instead of recreations:
 *
 *   @/...           the app's import alias
 *   next/link,      tiny stand-ins: a video has no router, so links are
 *   next/navigation plain anchors and navigation is a no-op
 *   server-only     empty (client components only; nothing server runs here)
 *   react*          one copy for everything -- the app's node_modules has its
 *                   own React, and two Reacts break hooks
 *
 * Tailwind v4 compiles the app's own globals.css (src/app.css imports it).
 */
Config.overrideWebpackConfig((config) => {
  const withAliases = {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias as Record<string, string>),
        "@": appSrc,
        "next/link": shim("next-link.tsx"),
        "next/navigation": shim("next-navigation.ts"),
        "server-only": shim("server-only.ts"),
        react: own("react"),
        "react-dom": own("react-dom"),
      },
    },
  };
  if (process.env.DEBUG_ALIAS) console.log("ALIAS", JSON.stringify(withAliases.resolve?.alias).slice(0, 600), Array.isArray(config.resolve?.alias));
  return enableTailwind(withAliases);
});
