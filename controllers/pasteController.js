const Redis = require("ioredis");
const { nanoid } = require("nanoid");
const dotenv = require('dotenv');

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);
/* -------------------- Helpers -------------------- */
function now(req) {
  if (
    process.env.TEST_MODE === "1" &&
    req.headers["x-test-now-ms"]
  ) {
    return Number(req.headers["x-test-now-ms"]);
  }
  return Date.now();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function pasteKey(id) {
  return `paste:${id}`;
}

/* -------------------- Create Paste controller -------------------- */
exports.createPaste =  async (req, res) => {
  const { content, ttl_seconds, max_views } = req.body;

  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Invalid content" });
  }

  if (
    ttl_seconds !== undefined &&
    (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)
  ) {
    return res.status(400).json({ error: "Invalid ttl_seconds" });
  }

  if (
    max_views !== undefined &&
    (!Number.isInteger(max_views) || max_views < 1)
  ) {
    return res.status(400).json({ error: "Invalid max_views" });
  }

  const id = nanoid();
  const key = pasteKey(id);

  const expiresAt = ttl_seconds
    ? now(req) + ttl_seconds * 1000
    : null;

  const data = {
    content,
    remaining_views: max_views ?? null,
    expires_at: expiresAt
  };

  await redis.set(key, JSON.stringify(data));

  if (ttl_seconds) {
    await redis.expire(key, ttl_seconds);
  }

  res.status(201).json({
    id,
    url: `${req.protocol}://${req.get("host")}/p/${id}`
  });
};
/* -------------------- Fetch Paste Controller -------------------- */
exports.getPaste = async (req, res) => {
  const key = pasteKey(req.params.id);
  const raw = await redis.get(key);

  if (!raw) {
    return res.status(404).json({ error: "Not found" });
  }

  const data = JSON.parse(raw);

  if (data.expires_at && now(req) > data.expires_at) {
    await redis.del(key);
    return res.status(404).json({ error: "Expired" });
  }

  if (data.remaining_views !== null) {
    if (data.remaining_views <= 0) {
      await redis.del(key);
      return res.status(404).json({ error: "View limit exceeded" });
    }
    data.remaining_views -= 1;
    await redis.set(key, JSON.stringify(data));
  }

  res.json({
    content: data.content,
    remaining_views: data.remaining_views,
    expires_at: data.expires_at
      ? new Date(data.expires_at).toISOString()
      : null
  });
};

/* -------------------- View Paste (HTML) -------------------- */

exports.viewPaste = async (req, res) => {
  const key = pasteKey(req.params.id);
  const raw = await redis.get(key);

  if (!raw) {
    return res.status(404).send("Not found");
  }

  const data = JSON.parse(raw);

  if (data.expires_at && now(req) > data.expires_at) {
    await redis.del(key);
    return res.status(404).send("Expired");
  }

  if (data.remaining_views !== null) {
    if (data.remaining_views <= 0) {
      await redis.del(key);
      return res.status(404).send("View limit exceeded");
    }
    data.remaining_views -= 1;
    await redis.set(key, JSON.stringify(data));
  }

  res.send(`
    <html>
      <body>
        <pre>${escapeHtml(data.content)}</pre>
      </body>
    </html>
  `);
};
