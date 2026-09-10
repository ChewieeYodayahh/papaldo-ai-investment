/**
 * Test-only stand-in for the `server-only` package, wired up in
 * vitest.config.mts. The real package throws when it is pulled into a client
 * bundle; under Vitest there is no bundler graph to guard, so importing it
 * would fail every server module's test for no safety gain.
 */
export {}
