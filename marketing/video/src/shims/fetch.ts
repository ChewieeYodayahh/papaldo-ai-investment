import sp500 from "../../public/data/history-SP500.json";

/**
 * The DCA tool fetches /api/calculators/history like it does in the app.
 * There is no API in a video, so that one request is answered from the S&P
 * 500 history captured from the running app (public/data, 2026-10-01).
 *
 * Every other app API call is refused (2026-10-02): a clip shows the real
 * order ticket and its confirm dialog, and nothing it does may ever reach a
 * trading, auth or database route.
 */
const HISTORY: Record<string, unknown> = { SP500: sp500 };
const realFetch = window.fetch.bind(window);

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const match = /\/api\/calculators\/history\?asset=([A-Za-z0-9.]+)/.exec(url);
  if (match && HISTORY[match[1]]) {
    return Promise.resolve(new Response(JSON.stringify(HISTORY[match[1]]), { headers: { "Content-Type": "application/json" } }));
  }
  if (/\/api\//.test(url)) {
    return Promise.resolve(
      new Response(JSON.stringify({ ok: false, message: "Not available in a video." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  return realFetch(input, init);
};

export {};
