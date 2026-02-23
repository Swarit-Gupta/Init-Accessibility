/**
 * POST /api/feedback
 * Body: { name?: string, email?: string, category: string, message: string }
 *
 * GET  /api/feedback  (admin – requires ADMIN_SECRET query param)
 * Returns the latest 100 feedback entries.
 */

const { sql } = require("@vercel/postgres");

const ALLOWED_CATEGORIES = [
  "general",
  "elderly-tools",
  "neurodivergent",
  "community-resources",
  "bug-report",
  "feature-request",
];

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;

function sanitizeText(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET: admin-only list ──────────────────────────────────
  if (req.method === "GET") {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || req.query.secret !== adminSecret) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    try {
      const { rows } = await sql`
        SELECT id, name, email, category, message, created_at
        FROM feedback
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return res.status(200).json({ feedback: rows });
    } catch (err) {
      console.error("[feedback GET] DB error:", err);
      return res.status(500).json({ error: "Could not retrieve feedback." });
    }
  }

  // ── POST: submit feedback ─────────────────────────────────
  if (req.method === "POST") {
    const body = req.body ?? {};

    const name = sanitizeText(body.name ?? "", 120) || null;
    const email = sanitizeText(body.email ?? "", 254) || null;
    const category = sanitizeText(body.category ?? "general", 64);
    const message = sanitizeText(body.message ?? "", 2000);

    // Validate
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (message.length < 5) {
      return res.status(400).json({ error: "Message too short (min 5 characters)." });
    }
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category." });
    }
    if (email && !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    try {
      await sql`
        INSERT INTO feedback (name, email, category, message)
        VALUES (${name}, ${email}, ${category}, ${message})
      `;
      return res.status(201).json({ success: true, message: "Feedback received. Thank you!" });
    } catch (err) {
      console.error("[feedback POST] DB error:", err);
      return res.status(500).json({ error: "Could not save feedback." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
};
