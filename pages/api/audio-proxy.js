import { get } from "https";

export const config = {
  api: {
    responseLimit: false,
  },
};

const ALLOWED_HOST = "firebasestorage.googleapis.com";

function streamFromUrl(targetUrl, res, redirectsLeft = 5) {
  const request = get(targetUrl, (upstream) => {
    if (
      [301, 302, 307, 308].includes(upstream.statusCode) &&
      upstream.headers.location
    ) {
      if (redirectsLeft <= 0) {
        res.status(502).end();
        return;
      }
      streamFromUrl(upstream.headers.location, res, redirectsLeft - 1);
      return;
    }

    if (upstream.statusCode !== 200) {
      res.status(upstream.statusCode).end();
      return;
    }

    const contentType =
      upstream.headers["content-type"] || "audio/webm";

    res.setHeader("Content-Type", contentType);
    if (upstream.headers["content-length"]) {
      res.setHeader("Content-Length", upstream.headers["content-length"]);
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Accept-Ranges", "bytes");

    upstream.pipe(res);
  });

  request.on("error", (err) => {
    console.error("Audio proxy error:", err);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });

  request.setTimeout(30000, () => {
    request.destroy();
    if (!res.headersSent) {
      res.status(504).end();
    }
  });
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const { url } = req.query;
  if (!url) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  if (parsed.hostname !== ALLOWED_HOST) {
    res.status(403).json({ error: "URL not allowed" });
    return;
  }

  streamFromUrl(url, res);
}
