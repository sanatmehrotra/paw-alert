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
  "maggot wound":   { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🐛" },
};

/** Get tag styling — falls back to a neutral style for unknown tags */
export function getTagStyle(tag: string): { bg: string; text: string; emoji: string } {
  const normalized = tag.toLowerCase().trim();
  return TAG_COLORS[normalized] || { bg: "#BBBBCC20", text: "#BBBBCC", emoji: "🏷️" };
}

const TRIAGE_PROMPT = `You are a Senior Veterinary Triage Specialist for PawAlert, India's leading stray animal rescue platform.
Your goal is to provide a high-accuracy medical assessment based on the provided image.

### Thinking Phase (Chain of Thought):
Before generating the final JSON, describe what you see in the image:
1. **Clinical Observations**: Note hair loss, blood, bone alignment, skin texture (crusty, red), and body weight.
2. **Species & Position**: Confirm the animal and if it is standing, sitting, or prone (unable to move).
3. **Environment**: Is it near a road? This indicators high risk of trauma.

### Few-Shot Examples for Accuracy:

#### Example 1 (Severe Mange):
- **Input**: Image showing a dog with 80% hair loss, thickened grey skin, and crusty scabs.
- **Thinking**: The dog shows generalized alopecia. Skin is thickened (lichenification) and crusty, suggesting chronic Sarcoptic or Demodectic mange. No active bleeding, but severe skin barrier compromise.
- **Output**: {"severity": 8, "severityLabel": "HIGH", "description": "Generalized alopecia with significant skin thickening and crusting. Likely severe chronic mange.", "tags": ["mange", "skin disease", "infection"], "note": "Urgent rescue needed for medicated baths and isolation." }

#### Example 2 (Hit and Run / Trauma):
- **Input**: Image of a dog lying on a busy road, hind legs pointing in unnatural directions.
- **Thinking**: Animal is prone on a high-traffic road. Hind limb deformity suggests pelvic or spinal fracture. High risk of internal hemorrhage.
- **Output**: {"severity": 10, "severityLabel": "CRITICAL", "description": "Prone animal on road with limb deformities. High suspicion of spinal/pelvic trauma from hit-and-run.", "tags": ["fracture", "internal injury", "paralysis"], "note": "CRITICAL: Immediate rescue with spinal board support required." }

#### Example 3 (Maggot Wound):
- **Input**: Image of a deep cavity in a dog's ear with small white larvae visible.
- **Thinking**: Focal deep tissue loss. Visible white larvae (maggots) indicating myiasis. Infection risk is high.
- **Output**: {"severity": 9, "severityLabel": "CRITICAL", "description": "Deep focal lesion with active myiasis (maggot infestation) in the ear canal region.", "tags": ["maggot wound", "infection", "wound"], "note": "Immediate surgical cleaning and maggot removal needed." }

### Return Format:
Return ONLY a valid JSON object. Do not include the "Thinking" block in the JSON, just the final fields:
{
  "severity": <integer 1-10>,
  "severityLabel": "<CRITICAL | HIGH | MODERATE | LOW>",
  "description": "<Detailed clinical observation>",
  "tags": ["<tag1>", "<tag2>", ...],
  "note": "<Actionable instruction>"
}

### Triage Protocol:
- **10 (CRITICAL)**: Immobile, heavy active bleeding, hit-and-run, unconscious, or head/eye maggot wounds.
- **8-9 (HIGH)**: Deep tissue loss, severe mange (70%+), open fractures, or extreme emaciation.
- **5-7 (MODERATE)**: Limping, skin disease, minor wounds, or eye infections.
- **1-4 (LOW)**: Scared but healthy, minor scrapes, or stray needing shelter.

### Dictionary:
bleeding, fracture, wound, laceration, bite wound, burn, malnourished, emaciated, dehydration, limping, skin disease, mange, infection, eye injury, paralysis, unconscious, internal injury, abscess, maggot wound.

### Constraint:
- If unsure, prioritize a HIGHER severity score.
- Return ONLY the JSON object.`;

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

    // 3. Parse AI response
    // Extract everything between first { and last } to skip any "Thinking" preamble
    const startIndex = responseText.indexOf("{");
    const endIndex = responseText.lastIndexOf("}");
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No JSON object found in AI response");
    }

    const jsonString = responseText.substring(startIndex, endIndex + 1);
    const parsed = JSON.parse(jsonString);

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
