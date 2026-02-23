/**
 * GET /api/resources
 * Returns all active community resources ordered by id.
 * Falls back to built-in defaults when the database is unavailable.
 */

const { sql } = require("@vercel/postgres");

const FALLBACK_RESOURCES = [
  {
    id: 1,
    title: "Multi-Language Interface",
    description:
      "Switch the page into English, Spanish, French, or Arabic. RTL layout is applied automatically for Arabic.",
    tag: "Built-in",
    url: null,
  },
  {
    id: 2,
    title: "WCAG 2.1 Guidelines",
    description:
      "The W3C WCAG 2.1 standard forms the foundation of every design decision — targeting Level AA compliance.",
    tag: "Standard",
    url: "https://www.w3.org/WAI/WCAG21/quickref/",
  },
  {
    id: 3,
    title: "Digital Equity Initiative",
    description:
      "Programs that bring affordable devices and broadband access to under-resourced homes, schools, and community centres.",
    tag: "Awareness",
    url: null,
  },
  {
    id: 4,
    title: "Screen Reader Compatibility",
    description:
      "Semantic HTML and ARIA landmarks ensure compatibility with NVDA, JAWS, VoiceOver, and TalkBack.",
    tag: "Built-in",
    url: null,
  },
  {
    id: 5,
    title: "Low-Bandwidth Friendly",
    description:
      "No external fonts, no heavy images, no JS frameworks — under 50 KB for limited connectivity.",
    tag: "Built-in",
    url: null,
  },
  {
    id: 6,
    title: "Persistent Preferences",
    description:
      "Accessibility settings sync to the cloud so returning users keep their setup on any device.",
    tag: "Built-in",
    url: null,
  },
];

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  // Cache for 60 s on CDN, 10 s stale-while-revalidate
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=10");

  try {
    const { rows } = await sql`
      SELECT id, title, description, tag, url
      FROM resources
      WHERE is_active = TRUE
      ORDER BY id ASC
    `;
    return res.status(200).json({ resources: rows });
  } catch (err) {
    console.error("[resources GET] DB error – returning fallback:", err.message);
    // Graceful degradation: return hard-coded resources if DB is unreachable
    return res.status(200).json({ resources: FALLBACK_RESOURCES, fallback: true });
  }
};
