/**
 * GET  /api/preferences?session_id=<uuid>  – load saved preferences
 * POST /api/preferences                    – upsert preferences
 *   Body: { session_id: string, preferences: object }
 */

const { sql } = require("@vercel/postgres");

// Allowed preference keys with their validators
const PREF_VALIDATORS = {
  theme: (v) => ["default", "dark", "high-contrast"].includes(v),
  colorBlind: (v) => ["none", "protanopia", "deuteranopia", "tritanopia"].includes(v),
  fontSizeScale: (v) => typeof v === "number" && v >= 0.8 && v <= 1.6,
  dyslexiaFont: (v) => typeof v === "boolean",
  reduceMotion: (v) => typeof v === "boolean",
  lineHeight: (v) => ["normal", "relaxed", "loose"].includes(v),
};

/** Validate and strip unknown / invalid preference keys */
function sanitizePrefs(raw) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const clean = {};
  for (const [key, validate] of Object.entries(PREF_VALIDATORS)) {
    if (key in raw && validate(raw[key])) {
      clean[key] = raw[key];
    }
  }
  return clean;
}

/** Simple UUID v4 format check */
function isValidSessionId(id) {
  return typeof id === "string" && /^[0-9a-f-]{36,64}$/i.test(id);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { session_id } = req.query;

    if (!isValidSessionId(session_id)) {
      return res.status(400).json({ error: "Invalid session_id." });
    }

    try {
      const { rows } = await sql`
        SELECT preferences
        FROM user_preferences
        WHERE session_id = ${session_id}
      `;
      return res.status(200).json({ preferences: rows[0]?.preferences ?? null });
    } catch (err) {
      console.error("[preferences GET] DB error:", err);
      return res.status(500).json({ error: "Could not retrieve preferences." });
    }
  }

  if (req.method === "POST") {
    const { session_id, preferences } = req.body ?? {};

    if (!isValidSessionId(session_id)) {
      return res.status(400).json({ error: "Invalid session_id." });
    }

    const clean = sanitizePrefs(preferences);

    try {
      await sql`
        INSERT INTO user_preferences (session_id, preferences)
        VALUES (${session_id}, ${JSON.stringify(clean)}::jsonb)
        ON CONFLICT (session_id) DO UPDATE
          SET preferences = ${JSON.stringify(clean)}::jsonb,
              updated_at  = NOW()
      `;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[preferences POST] DB error:", err);
      return res.status(500).json({ error: "Could not save preferences." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
};
