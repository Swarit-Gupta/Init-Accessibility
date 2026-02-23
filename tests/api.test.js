/**
 * Unit tests for API helper logic (no DB required).
 * Run with: node tests/api.test.js
 */

"use strict";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

/* ============================================================
   Inline the pure logic extracted from api/preferences.js
   ============================================================ */
const PREF_VALIDATORS = {
  theme: (v) => ["default", "dark", "high-contrast"].includes(v),
  colorBlind: (v) => ["none", "protanopia", "deuteranopia", "tritanopia"].includes(v),
  fontSizeScale: (v) => typeof v === "number" && v >= 0.8 && v <= 1.6,
  dyslexiaFont: (v) => typeof v === "boolean",
  reduceMotion: (v) => typeof v === "boolean",
  lineHeight: (v) => ["normal", "relaxed", "loose"].includes(v),
};

function sanitizePrefs(raw) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const clean = {};
  for (const [key, validate] of Object.entries(PREF_VALIDATORS)) {
    if (key in raw && validate(raw[key])) clean[key] = raw[key];
  }
  return clean;
}

function isValidSessionId(id) {
  return typeof id === "string" && /^[0-9a-f-]{36,64}$/i.test(id);
}

/* ============================================================
   Inline the pure logic extracted from api/feedback.js
   ============================================================ */
const ALLOWED_CATEGORIES = [
  "general", "elderly-tools", "neurodivergent",
  "community-resources", "bug-report", "feature-request",
];
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;

function sanitizeText(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

/* ============================================================
   Tests – sanitizePrefs
   ============================================================ */
console.log("\n── sanitizePrefs ──");

assert(
  "keeps valid theme",
  sanitizePrefs({ theme: "dark" }).theme === "dark"
);
assert(
  "strips invalid theme",
  !("theme" in sanitizePrefs({ theme: "rainbow" }))
);
assert(
  "keeps fontSizeScale in range",
  sanitizePrefs({ fontSizeScale: 1.2 }).fontSizeScale === 1.2
);
assert(
  "strips fontSizeScale out of range",
  !("fontSizeScale" in sanitizePrefs({ fontSizeScale: 2.5 }))
);
assert(
  "keeps valid colorBlind",
  sanitizePrefs({ colorBlind: "protanopia" }).colorBlind === "protanopia"
);
assert(
  "strips unknown key",
  !("hacker" in sanitizePrefs({ hacker: "<script>" }))
);
assert(
  "handles non-object input gracefully",
  Object.keys(sanitizePrefs(null)).length === 0
);
assert(
  "handles array input gracefully",
  Object.keys(sanitizePrefs([])).length === 0
);
assert(
  "keeps boolean dyslexiaFont",
  sanitizePrefs({ dyslexiaFont: true }).dyslexiaFont === true
);
assert(
  "strips string value for boolean field",
  !("dyslexiaFont" in sanitizePrefs({ dyslexiaFont: "yes" }))
);

/* ============================================================
   Tests – isValidSessionId
   ============================================================ */
console.log("\n── isValidSessionId ──");

assert(
  "accepts UUID v4",
  isValidSessionId("550e8400-e29b-41d4-a716-446655440000")
);
assert(
  "rejects empty string",
  !isValidSessionId("")
);
assert(
  "rejects SQL injection attempt",
  !isValidSessionId("'; DROP TABLE users; --")
);
assert(
  "rejects non-string",
  !isValidSessionId(12345)
);
assert(
  "rejects null",
  !isValidSessionId(null)
);

/* ============================================================
   Tests – sanitizeText
   ============================================================ */
console.log("\n── sanitizeText ──");

assert(
  "trims whitespace",
  sanitizeText("  hello  ", 50) === "hello"
);
assert(
  "truncates to maxLen",
  sanitizeText("abcdef", 3) === "abc"
);
assert(
  "returns empty string for non-string",
  sanitizeText(42, 10) === ""
);

/* ============================================================
   Tests – feedback validation logic
   ============================================================ */
console.log("\n── feedback validation ──");

assert(
  "accepts valid category",
  ALLOWED_CATEGORIES.includes("bug-report")
);
assert(
  "rejects unknown category",
  !ALLOWED_CATEGORIES.includes("hacking")
);
assert(
  "validates well-formed email",
  EMAIL_RE.test("user@example.com")
);
assert(
  "rejects email without @",
  !EMAIL_RE.test("userexample.com")
);
assert(
  "rejects email without domain",
  !EMAIL_RE.test("user@")
);

/* ============================================================
   Summary
   ============================================================ */
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
