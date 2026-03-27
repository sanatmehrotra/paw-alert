// =============================================================
// PawAlert — Gemini Vision AI Triage Service
// Analyses animal injury photos using Google Gemini Vision API
// Server-side only — GEMINI_API_KEY stays secret
// =============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface TriageResult {
  severity: number;           // 1–10
  severityLabel: string;      // CRITICAL, HIGH, MODERATE, LOW
  description: string;        // AI summary of visible injuries
  tags: string[];             // e.g. ["fracture", "bleeding", "malnourished"]
  note: string;               // Triage recommendation for NGO
}

// Tag color mappings for the frontend
export const TAG_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  // Life-threatening
  "bleeding":       { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🩸" },
  "hemorrhage":     { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🩸" },
  "internal injury":{ bg: "#FF4F4F20", text: "#FF4F4F", emoji: "⚠️" },
  "critical":       { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🚨" },
  "unconscious":    { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "😵" },
  "poisoning":      { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "☠️" },

  // Skeletal / structural
  "fracture":       { bg: "#E47F4220", text: "#E47F42", emoji: "🦴" },
  "broken bone":    { bg: "#E47F4220", text: "#E47F42", emoji: "🦴" },
  "dislocation":    { bg: "#E47F4220", text: "#E47F42", emoji: "🦴" },
  "limping":        { bg: "#E47F4220", text: "#E47F42", emoji: "🦿" },
  "sprain":         { bg: "#E47F4220", text: "#E47F42", emoji: "🦿" },

  // Wounds / skin
  "wound":          { bg: "#FF8C0020", text: "#FF8C00", emoji: "🩹" },
  "laceration":     { bg: "#FF8C0020", text: "#FF8C00", emoji: "🩹" },
  "bite wound":     { bg: "#FF8C0020", text: "#FF8C00", emoji: "🩹" },
  "abscess":        { bg: "#FF8C0020", text: "#FF8C00", emoji: "🩹" },
  "burn":           { bg: "#FF8C0020", text: "#FF8C00", emoji: "🔥" },
  "skin disease":   { bg: "#FF8C0020", text: "#FF8C00", emoji: "🩹" },
  "mange":          { bg: "#FF8C0020", text: "#FF8C00", emoji: "🩹" },
  "infection":      { bg: "#FF8C0020", text: "#FF8C00", emoji: "🦠" },

  // Nutritional / systemic
  "malnourished":   { bg: "#FFE00F20", text: "#D4A800", emoji: "⚖️" },
  "dehydration":    { bg: "#FFE00F20", text: "#D4A800", emoji: "💧" },
  "emaciated":      { bg: "#FFE00F20", text: "#D4A800", emoji: "⚖️" },
  "weakness":       { bg: "#FFE00F20", text: "#D4A800", emoji: "😓" },
  "lethargic":      { bg: "#FFE00F20", text: "#D4A800", emoji: "😴" },

  // Eye / ear / other
  "eye injury":     { bg: "#3B9EFF20", text: "#3B9EFF", emoji: "👁️" },
  "eye infection":  { bg: "#3B9EFF20", text: "#3B9EFF", emoji: "👁️" },
  "ear infection":  { bg: "#3B9EFF20", text: "#3B9EFF", emoji: "👂" },
  "tick infestation":{ bg: "#9B59B620", text: "#9B59B6", emoji: "🪲" },
  "flea infestation":{ bg: "#9B59B620", text: "#9B59B6", emoji: "🪲" },
  "paralysis":      { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🚫" },
  "seizure":        { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "⚡" },

  // Mild / general
  "healthy":        { bg: "#4FC97E20", text: "#4FC97E", emoji: "✅" },
  "minor injury":   { bg: "#4FC97E20", text: "#4FC97E", emoji: "🩹" },
  "scared":         { bg: "#3B9EFF20", text: "#3B9EFF", emoji: "😰" },
  "stray":          { bg: "#BBBBCC20", text: "#BBBBCC", emoji: "🐾" },
};

/** Get tag styling — falls back to a neutral style for unknown tags */
export function getTagStyle(tag: string): { bg: string; text: string; emoji: string } {
  const normalized = tag.toLowerCase().trim();
  return TAG_COLORS[normalized] || { bg: "#BBBBCC20", text: "#BBBBCC", emoji: "🏷️" };
}

const TRIAGE_PROMPT = `You are a veterinary AI assistant for PawAlert, an animal rescue platform.

Analyze the provided image of a stray or injured animal. Return a JSON object with these exact fields:

{
  "severity": <number 1-10>,
  "severityLabel": "<CRITICAL | HIGH | MODERATE | LOW>",
  "description": "<2-3 sentence description of visible injuries or condition>",
  "tags": ["<injury tag 1>", "<injury tag 2>", ...],
  "note": "<1 sentence triage recommendation for rescue team>"
}

Severity scale:
- 9-10 = CRITICAL: Life-threatening, needs immediate rescue (heavy bleeding, unconscious, paralyzed, hit by vehicle)
- 7-8 = HIGH: Severe injury needing urgent care (broken bone, deep wound, severe malnourishment)
- 4-6 = MODERATE: Visible injury or distress (limping, minor wounds, skin disease, dehydration)
- 1-3 = LOW: Mild condition (minor scrapes, appears scared but healthy, stray needing shelter)

For tags, use simple lowercase keywords from this list when applicable:
bleeding, fracture, broken bone, wound, laceration, bite wound, burn, malnourished, dehydration, emaciated, 
limping, skin disease, mange, infection, eye injury, eye infection, ear infection, tick infestation, 
paralysis, unconscious, poisoning, internal injury, abscess, lethargic, weakness, minor injury, healthy, scared, stray

If the image does not appear to be an animal or is unclear, still provide your best assessment with a low severity score and note the uncertainty.

IMPORTANT: Return ONLY valid JSON, no markdown code fences, no explanation text.`;

/**
 * Analyze an animal photo for injuries using Gemini Vision.
 * @param imageUrl — Public URL of the uploaded animal photo
 */
export async function analyzeAnimalInjury(imageUrl: string): Promise<TriageResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set — falling back to mock triage");
    return mockTriage();
  }

  try {
    // 1. Download image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Detect MIME type from content-type header or default to jpeg
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // 2. Call Gemini Vision API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      TRIAGE_PROMPT,
      {
        inlineData: {
          data: base64Image,
          mimeType: contentType,
        },
      },
    ]);

    const responseText = result.response.text();

    // 3. Parse AI response (strip any markdown fences if present)
    const cleaned = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // 4. Validate and normalize
    const severity = Math.min(10, Math.max(1, Math.round(Number(parsed.severity) || 5)));
    const severityLabel = parsed.severityLabel || getSeverityLabel(severity);
    const description = String(parsed.description || "Visible injuries detected. Rescue recommended.");
    const tags: string[] = Array.isArray(parsed.tags)
      ? parsed.tags.map((t: unknown) => String(t).toLowerCase().trim()).filter(Boolean)
      : [];
    const note = String(parsed.note || "Rescue team should assess the animal on-site.");

    return { severity, severityLabel, description, tags, note };
  } catch (error) {
    console.error("Gemini triage error:", error);
    return mockTriage();
  }
}

/** Fallback triage when Gemini is unavailable */
function mockTriage(): TriageResult {
  const severity = Math.floor(Math.random() * 8) + 2; // 2–9
  return {
    severity,
    severityLabel: getSeverityLabel(severity),
    description: "AI analysis unavailable. Manual assessment recommended upon arrival.",
    tags: ["needs assessment"],
    note: "Gemini Vision unavailable — please assess on-site.",
  };
}

function getSeverityLabel(severity: number): string {
  if (severity >= 9) return "CRITICAL";
  if (severity >= 7) return "HIGH";
  if (severity >= 4) return "MODERATE";
  return "LOW";
}
