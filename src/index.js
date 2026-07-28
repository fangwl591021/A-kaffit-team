const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...(init.headers || {}),
    },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "akaffit-team",
        version: "0.1.0",
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }

    return env.ASSETS.fetch(request);
  },
};
