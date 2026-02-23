/**
 * GET /api/setup
 * Creates database tables (if they don't exist) and seeds initial resources.
 * Call once after provisioning the Vercel Postgres database.
 * Protect with SETUP_SECRET env var in production.
 */

const { sql } = require("@vercel/postgres");

const SEED_RESOURCES = [
  {
    title: "Multi-Language Interface",
    description:
      "Switch the page into English, Spanish, French, or Arabic. RTL layout is applied automatically for Arabic.",
    tag: "Built-in",
    url: null,
  },
  {
    title: "WCAG 2.1 Guidelines",
    description:
      "The W3C WCAG 2.1 standard forms the foundation of every design decision — targeting Level AA compliance.",
    tag: "Standard",
    url: "https://www.w3.org/WAI/WCAG21/quickref/",
  },
  {
    title: "Digital Equity Initiative",
    description:
      "Programs that bring affordable devices and broadband access to under-resourced homes, schools, and community centres.",
    tag: "Awareness",
    url: null,
  },
  {
    title: "Screen Reader Compatibility",
    description:
      "Semantic HTML and ARIA landmarks ensure compatibility with NVDA, JAWS, VoiceOver, and TalkBack screen readers.",
    tag: "Built-in",
    url: null,
  },
  {
    title: "Low-Bandwidth Friendly",
    description:
      "No external fonts, no heavy images, no JS frameworks — the page loads under 50 KB for users with limited connectivity.",
    tag: "Built-in",
    url: null,
  },
  {
    title: "Persistent Preferences",
    description:
      "Accessibility settings are saved to the cloud so returning users keep their configuration on any device.",
    tag: "Built-in",
    url: null,
  },
];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional secret protection
  const secret = process.env.SETUP_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id          SERIAL PRIMARY KEY,
        session_id  VARCHAR(64) UNIQUE NOT NULL,
        preferences JSONB NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_preferences_session
        ON user_preferences (session_id)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(120),
        email      VARCHAR(254),
        category   VARCHAR(64) NOT NULL DEFAULT 'general',
        message    TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS resources (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        tag         VARCHAR(64) NOT NULL DEFAULT 'General',
        url         VARCHAR(512),
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Seed resources if table is empty
    const { rowCount } = await sql`SELECT 1 FROM resources LIMIT 1`;
    if (rowCount === 0) {
      for (const r of SEED_RESOURCES) {
        await sql`
          INSERT INTO resources (title, description, tag, url)
          VALUES (${r.title}, ${r.description}, ${r.tag}, ${r.url})
        `;
      }
    }

    return res.status(200).json({ success: true, message: "Database initialized." });
  } catch (err) {
    console.error("[setup] DB error:", err);
    return res.status(500).json({ error: "Database initialization failed." });
  }
};
