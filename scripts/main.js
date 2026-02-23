/**
 * Init-Accessibility – Main Script
 * Handles all accessibility toolbar interactions and feature logic.
 */

"use strict";

/* ============================================================
   Constants & State
   ============================================================ */
const STORAGE_KEY = "a11y-prefs";

const DEFAULT_PREFS = {
  theme: "default",       // "default" | "dark" | "high-contrast"
  colorBlind: "none",     // "none" | "protanopia" | "deuteranopia" | "tritanopia"
  fontSizeScale: 1,       // 0.8 – 1.6 (applied as CSS custom property)
  dyslexiaFont: false,
  reduceMotion: false,
  lineHeight: "normal",   // "normal" | "relaxed" | "loose"
};

let prefs = loadPrefs();
let ttsUtterance = null;
let isSpeaking = false;

/* ============================================================
   Persistence Helpers
   ============================================================ */
function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable – silently continue
  }
}

/* ============================================================
   Apply Preferences to DOM
   ============================================================ */
function applyPrefs() {
  const root = document.documentElement;

  // Theme
  root.setAttribute("data-theme", prefs.theme === "default" ? "" : prefs.theme);

  // Color-blind mode
  root.setAttribute("data-colorblind", prefs.colorBlind === "none" ? "" : prefs.colorBlind);

  // Font size
  root.style.setProperty("--font-size-scale", prefs.fontSizeScale);
  const display = document.getElementById("font-size-display");
  if (display) display.textContent = Math.round(prefs.fontSizeScale * 100) + "%";

  // Dyslexia font
  root.setAttribute("data-dyslexia-font", prefs.dyslexiaFont ? "true" : "false");
  setPressed("toggle-dyslexia", prefs.dyslexiaFont);

  // Reduce motion
  root.setAttribute("data-reduce-motion", prefs.reduceMotion ? "true" : "false");
  setPressed("toggle-motion", prefs.reduceMotion);

  // Theme buttons
  setPressed("btn-theme-default", prefs.theme === "default");
  setPressed("btn-theme-dark", prefs.theme === "dark");
  setPressed("btn-theme-hc", prefs.theme === "high-contrast");

  // Color-blind selector
  const cbSelect = document.getElementById("colorblind-select");
  if (cbSelect) cbSelect.value = prefs.colorBlind;

  // Line height
  const lineHeightSelect = document.getElementById("line-height-select");
  if (lineHeightSelect) lineHeightSelect.value = prefs.lineHeight;
  applyLineHeight(prefs.lineHeight);

  savePrefs();
}

function setPressed(id, pressed) {
  const el = document.getElementById(id);
  if (el) el.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function applyLineHeight(value) {
  const map = { normal: "1.6", relaxed: "2", loose: "2.4" };
  document.documentElement.style.setProperty(
    "--line-height-base",
    map[value] ?? "1.6"
  );
}

/* ============================================================
   Announce changes to screen readers via live region
   ============================================================ */
function announce(message) {
  const region = document.getElementById("live-region");
  if (!region) return;
  region.textContent = "";
  // Small timeout to ensure the DOM mutation is picked up
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}

/* ============================================================
   Theme Controls
   ============================================================ */
function setupThemeControls() {
  document.getElementById("btn-theme-default")?.addEventListener("click", () => {
    prefs.theme = "default";
    applyPrefs();
    announce("Default theme applied.");
  });

  document.getElementById("btn-theme-dark")?.addEventListener("click", () => {
    prefs.theme = "dark";
    applyPrefs();
    announce("Dark theme applied.");
  });

  document.getElementById("btn-theme-hc")?.addEventListener("click", () => {
    prefs.theme = "high-contrast";
    applyPrefs();
    announce("High contrast theme applied.");
  });
}

/* ============================================================
   Color-Blind Mode
   ============================================================ */
function setupColorBlindControl() {
  document.getElementById("colorblind-select")?.addEventListener("change", (e) => {
    prefs.colorBlind = e.target.value;
    applyPrefs();
    const label = e.target.options[e.target.selectedIndex].text;
    announce(`Color vision mode set to: ${label}.`);
  });
}

/* ============================================================
   Font Size Controls
   ============================================================ */
function setupFontSizeControls() {
  document.getElementById("btn-font-decrease")?.addEventListener("click", () => {
    prefs.fontSizeScale = Math.max(0.8, parseFloat((prefs.fontSizeScale - 0.1).toFixed(1)));
    applyPrefs();
    announce(`Font size decreased to ${Math.round(prefs.fontSizeScale * 100)}%.`);
  });

  document.getElementById("btn-font-reset")?.addEventListener("click", () => {
    prefs.fontSizeScale = 1;
    applyPrefs();
    announce("Font size reset to 100%.");
  });

  document.getElementById("btn-font-increase")?.addEventListener("click", () => {
    prefs.fontSizeScale = Math.min(1.6, parseFloat((prefs.fontSizeScale + 0.1).toFixed(1)));
    applyPrefs();
    announce(`Font size increased to ${Math.round(prefs.fontSizeScale * 100)}%.`);
  });
}

/* ============================================================
   Dyslexia Font Toggle
   ============================================================ */
function setupDyslexiaFont() {
  document.getElementById("toggle-dyslexia")?.addEventListener("click", () => {
    prefs.dyslexiaFont = !prefs.dyslexiaFont;
    applyPrefs();
    announce(prefs.dyslexiaFont ? "Dyslexia-friendly font enabled." : "Dyslexia-friendly font disabled.");
  });
}

/* ============================================================
   Reduce Motion Toggle
   ============================================================ */
function setupReduceMotion() {
  // Respect OS-level preference on first load
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    prefs.reduceMotion = true;
  }

  document.getElementById("toggle-motion")?.addEventListener("click", () => {
    prefs.reduceMotion = !prefs.reduceMotion;
    applyPrefs();
    announce(prefs.reduceMotion ? "Reduce motion enabled." : "Reduce motion disabled.");
  });
}

/* ============================================================
   Line Height Control
   ============================================================ */
function setupLineHeight() {
  document.getElementById("line-height-select")?.addEventListener("change", (e) => {
    prefs.lineHeight = e.target.value;
    applyPrefs();
    const label = e.target.options[e.target.selectedIndex].text;
    announce(`Line spacing set to ${label}.`);
  });
}

/* ============================================================
   Text-to-Speech (TTS)
   ============================================================ */
function setupTTS() {
  const ttsBtn = document.getElementById("btn-tts-play");
  const ttsPauseBtn = document.getElementById("btn-tts-pause");
  const ttsStopBtn = document.getElementById("btn-tts-stop");
  const ttsStatus = document.getElementById("tts-status");
  const ttsText = document.getElementById("tts-content");
  const ttsSpeed = document.getElementById("tts-speed");
  const ttsSpeedDisplay = document.getElementById("tts-speed-display");

  if (!ttsBtn || !("speechSynthesis" in window)) {
    const container = document.getElementById("tts-section");
    if (container) {
      container.innerHTML =
        '<p class="alert alert-info" role="status">Text-to-Speech is not supported in your browser.</p>';
    }
    return;
  }

  ttsSpeed?.addEventListener("input", () => {
    if (ttsSpeedDisplay) ttsSpeedDisplay.textContent = parseFloat(ttsSpeed.value).toFixed(1) + "×";
  });

  ttsBtn.addEventListener("click", () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
    }

    const text = ttsText?.textContent?.trim() || "";
    ttsUtterance = new SpeechSynthesisUtterance(text);
    ttsUtterance.rate = ttsSpeed ? parseFloat(ttsSpeed.value) : 1;

    ttsUtterance.onstart = () => {
      isSpeaking = true;
      if (ttsStatus) {
        ttsStatus.textContent = "🔊 Reading…";
        ttsStatus.classList.add("active");
      }
    };

    ttsUtterance.onend = ttsUtterance.onerror = () => {
      isSpeaking = false;
      if (ttsStatus) {
        ttsStatus.textContent = "";
        ttsStatus.classList.remove("active");
      }
    };

    window.speechSynthesis.speak(ttsUtterance);
  });

  ttsPauseBtn?.addEventListener("click", () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      if (ttsStatus) ttsStatus.textContent = "⏸ Paused";
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      if (ttsStatus) ttsStatus.textContent = "🔊 Reading…";
    }
  });

  ttsStopBtn?.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    if (ttsStatus) {
      ttsStatus.textContent = "";
      ttsStatus.classList.remove("active");
    }
  });
}

/* ============================================================
   Language Selector (i18n demo)
   ============================================================ */
const TRANSLATIONS = {
  en: {
    "hero-title": "Accessibility for Everyone",
    "hero-subtitle":
      "A toolkit designed to empower elderly users, neurodivergent individuals, and marginalized communities with adaptable, inclusive tools.",
    "section-elderly": "👴 Elderly Tools",
    "section-neuro": "🧠 Neurodivergent-Friendly",
    "section-community": "🌍 Community Resources",
    "toolbar-heading": "Accessibility Toolbar",
  },
  es: {
    "hero-title": "Accesibilidad para Todos",
    "hero-subtitle":
      "Un conjunto de herramientas diseñado para empoderar a personas mayores, individuos neurodivergentes y comunidades marginadas con herramientas inclusivas y adaptables.",
    "section-elderly": "👴 Herramientas para Personas Mayores",
    "section-neuro": "🧠 Interfaz para Neurodivergentes",
    "section-community": "🌍 Recursos Comunitarios",
    "toolbar-heading": "Barra de Accesibilidad",
  },
  fr: {
    "hero-title": "L'Accessibilité pour Tous",
    "hero-subtitle":
      "Une boîte à outils conçue pour autonomiser les personnes âgées, les personnes neurodivergentes et les communautés marginalisées.",
    "section-elderly": "👴 Outils pour Seniors",
    "section-neuro": "🧠 Interface Neurodivergente",
    "section-community": "🌍 Ressources Communautaires",
    "toolbar-heading": "Barre d'Accessibilité",
  },
  ar: {
    "hero-title": "إمكانية الوصول للجميع",
    "hero-subtitle":
      "مجموعة أدوات مصممة لتمكين كبار السن والأفراد المختلفين عصبياً والمجتمعات المهمشة.",
    "section-elderly": "👴 أدوات لكبار السن",
    "section-neuro": "🧠 واجهة للمختلفين عصبياً",
    "section-community": "🌍 موارد المجتمع",
    "toolbar-heading": "شريط إمكانية الوصول",
  },
};

function applyTranslations(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS["en"];
  Object.entries(t).forEach(([key, value]) => {
    const el = document.getElementById(key);
    if (el) el.textContent = value;
  });

  // RTL support for Arabic
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang);
}

function setupLanguageSelector() {
  document.getElementById("lang-select")?.addEventListener("change", (e) => {
    const lang = e.target.value;
    applyTranslations(lang);
    const langNames = { en: "English", es: "Spanish", fr: "French", ar: "Arabic" };
    announce(`Language changed to ${langNames[lang] || lang}.`);
  });
}

/* ============================================================
   Mouse vs Keyboard Detection (for focus-ring visibility)
   ============================================================ */
function setupInputModeDetection() {
  document.body.addEventListener("mousedown", () => document.body.classList.add("using-mouse"));
  document.body.addEventListener("keydown", () => document.body.classList.remove("using-mouse"));
}

/* ============================================================
   Reset All Preferences
   ============================================================ */
function setupReset() {
  document.getElementById("btn-reset")?.addEventListener("click", () => {
    prefs = { ...DEFAULT_PREFS };
    applyPrefs();
    applyTranslations("en");
    const langSelect = document.getElementById("lang-select");
    if (langSelect) langSelect.value = "en";
    announce("All accessibility preferences have been reset.");
  });
}

/* ============================================================
   Init
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  setupThemeControls();
  setupColorBlindControl();
  setupFontSizeControls();
  setupDyslexiaFont();
  setupReduceMotion();
  setupLineHeight();
  setupTTS();
  setupLanguageSelector();
  setupInputModeDetection();
  setupReset();
  applyPrefs();
});
