// =============================================================
// PawAlert — Gemini Vision AI Triage Service (v2)
// Enhanced species verification, urgency, fracture detection
// Chain-of-Thought prompting for higher accuracy
// Server-side only — GEMINI_API_KEY stays secret
// =============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface TriageResult {
  severity: number;               // 1–10
  severityLabel: string;          // CRITICAL, HIGH, MODERATE, LOW
  description: string;            // AI summary of visible injuries
  tags: string[];                 // e.g. ["fracture", "bleeding", "malnourished"]
  note: string;                   // Triage recommendation for NGO

  // v2 — Enhanced fields
  detectedAnimal: string;         // What the AI actually sees in the photo
  speciesMatch: boolean;          // Does detected animal match user-selected species?
  speciesMismatchNote: string;    // Warning if mismatch (empty if match)
  urgencyLevel: string;           // "IMMEDIATE" | "URGENT" | "STANDARD" | "NON-URGENT"
  hasFracture: boolean;           // Suspected fracture detected?
  isConscious: boolean;           // Is the animal conscious?
  canMove: boolean;               // Can the animal move on its own?
  estimatedAge: string;           // Rough age estimate
  bleedingLevel: string;          // "NONE" | "MINOR" | "MODERATE" | "SEVERE"
  mobilityStatus: string;         // "NORMAL" | "LIMPING" | "IMMOBILE" | "CANNOT DETERMINE"
  bodyCondition: string;          // "HEALTHY" | "THIN" | "EMACIATED" | "OBESE" | "CANNOT DETERMINE"
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
  "hit by vehicle": { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🚗" },

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
  "open wound":     { bg: "#FF8C0020", text: "#FF8C00", emoji: "🩹" },
  "maggot wound":   { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🐛" },

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

  // Urgent labels
  "immediate rescue":{ bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🚨" },
  "urgent care":     { bg: "#E47F4220", text: "#E47F42", emoji: "⚡" },

  // Mild / general
  "healthy":        { bg: "#4FC97E20", text: "#4FC97E", emoji: "✅" },
  "minor injury":   { bg: "#4FC97E20", text: "#4FC97E", emoji: "🩹" },
  "scared":         { bg: "#3B9EFF20", text: "#3B9EFF", emoji: "😰" },
  "stray":          { bg: "#BBBBCC20", text: "#BBBBCC", emoji: "🐾" },
  "not an animal":  { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "❌" },
  "species mismatch":{ bg: "#FFE00F20", text: "#D4A800", emoji: "⚠️" },
  "needs assessment":{ bg: "#BBBBCC20", text: "#BBBBCC", emoji: "🔍" },
};

/** Get tag styling — falls back to a neutral style for unknown tags */
export function getTagStyle(tag: string): { bg: string; text: string; emoji: string } {
  const normalized = tag.toLowerCase().trim();
  return TAG_COLORS[normalized] || { bg: "#BBBBCC20", text: "#BBBBCC", emoji: "🏷️" };
}

/**
 * Build the Gemini prompt v2 — species-aware, Chain-of-Thought, with richer medical output.
 */
function buildTriagePrompt(userSelectedSpecies: string, userDescription: string): string {
  return `You are a Senior Veterinary Triage Specialist for PawAlert, India's leading stray animal rescue platform.

The reporter selected: "${userSelectedSpecies}" as the species.
The reporter described: "${userDescription || "No description provided"}"

### Thinking Phase (Chain of Thought):
Before generating the final JSON, reason through what you see:
1. **Species Verification**: Is the animal in the photo actually a "${userSelectedSpecies}"? If not, what is it?
2. **Clinical Observations**: Note hair loss, blood, bone alignment, skin texture, body weight, posture.
3. **Mobility**: Is the animal standing, sitting, lying prone, or immobile?
4. **Environment**: Is it near a road (trauma risk)? Indoors/outdoors?

### Few-Shot Examples for Accuracy:

#### Example 1 (Severe Mange):
- **Input**: Image showing a dog with 80% hair loss, thickened grey skin, and crusty scabs.
- **Output**: {"severity": 8, "severityLabel": "HIGH", "detectedAnimal": "Dog", "speciesMatch": true, "speciesMismatchNote": "", "description": "Generalized alopecia with significant skin thickening and crusting. Likely severe chronic mange.", "tags": ["mange", "skin disease", "infection"], "note": "Urgent rescue needed for medicated baths and isolation.", "urgencyLevel": "URGENT", "hasFracture": false, "isConscious": true, "canMove": true, "estimatedAge": "~2 years adult", "bleedingLevel": "NONE", "mobilityStatus": "NORMAL", "bodyCondition": "THIN"}

#### Example 2 (Hit and Run / Trauma):
- **Input**: Image of a dog lying on a road, hind legs at unnatural angles.
- **Output**: {"severity": 10, "severityLabel": "CRITICAL", "detectedAnimal": "Dog", "speciesMatch": true, "speciesMismatchNote": "", "description": "Prone animal on road with hind limb deformity. High suspicion of spinal/pelvic fracture from hit-and-run.", "tags": ["fracture", "internal injury", "hit by vehicle"], "note": "CRITICAL: Immediate rescue with spinal board support required.", "urgencyLevel": "IMMEDIATE", "hasFracture": true, "isConscious": false, "canMove": false, "estimatedAge": "unknown", "bleedingLevel": "MODERATE", "mobilityStatus": "IMMOBILE", "bodyCondition": "CANNOT DETERMINE"}

#### Example 3 (Maggot Wound):
- **Input**: Image of a deep cavity in a dog's ear with small white larvae visible.
- **Output**: {"severity": 9, "severityLabel": "CRITICAL", "detectedAnimal": "Dog", "speciesMatch": true, "speciesMismatchNote": "", "description": "Deep focal lesion with active myiasis in the ear canal region.", "tags": ["maggot wound", "infection", "wound"], "note": "Immediate surgical cleaning and maggot removal needed.", "urgencyLevel": "IMMEDIATE", "hasFracture": false, "isConscious": true, "canMove": true, "estimatedAge": "~3 years adult", "bleedingLevel": "MINOR", "mobilityStatus": "NORMAL", "bodyCondition": "THIN"}

### Return Format:
Return ONLY a valid JSON object with ALL these fields:
{
  "detectedAnimal": "<What animal you ACTUALLY see: Dog, Cat, Cow, Bird, Monkey, Not an animal, etc.>",
  "speciesMatch": <true/false — does detectedAnimal match "${userSelectedSpecies}"?>,
  "speciesMismatchNote": "<If mismatch explain, else empty string>",
  "severity": <integer 1-10>,
  "severityLabel": "<CRITICAL | HIGH | MODERATE | LOW>",
  "description": "<3-4 sentence clinical description>",
  "tags": ["<tag1>", "<tag2>", ...],
  "note": "<1-2 sentence actionable triage recommendation>",
  "urgencyLevel": "<IMMEDIATE | URGENT | STANDARD | NON-URGENT>",
  "hasFracture": <true/false>,
  "isConscious": <true/false>,
  "canMove": <true/false>,
  "estimatedAge": "<e.g. 'puppy ~3 months', '~2 years adult', 'unknown'>",
  "bleedingLevel": "<NONE | MINOR | MODERATE | SEVERE>",
  "mobilityStatus": "<NORMAL | LIMPING | IMMOBILE | CANNOT DETERMINE>",
  "bodyCondition": "<HEALTHY | THIN | EMACIATED | OBESE | CANNOT DETERMINE>"
}

### Triage Protocol:
- **10 (CRITICAL)**: Immobile, heavy active bleeding, hit-and-run, unconscious, or head/eye maggot wounds.
- **8-9 (HIGH)**: Deep tissue loss, severe mange (70%+), open fractures, or extreme emaciation.
- **5-7 (MODERATE)**: Limping, skin disease, minor wounds, or eye infections.
- **1-4 (LOW)**: Scared but healthy, minor scrapes, or stray needing shelter.

### Tag Dictionary:
bleeding, fracture, broken bone, wound, laceration, bite wound, burn, malnourished, dehydration, emaciated, limping, skin disease, mange, infection, eye injury, eye infection, ear infection, tick infestation, paralysis, unconscious, poisoning, internal injury, abscess, maggot wound, lethargic, weakness, minor injury, healthy, scared, stray, open wound, hit by vehicle, immediate rescue, urgent care, not an animal, species mismatch

### Constraints:
- If unsure between two severity levels, prioritize HIGHER severity.
- If the image is not an animal, set detectedAnimal="Not an animal", severity=1, speciesMatch=false.
- Do NOT include the Thinking block in the output — return ONLY the JSON object.
- Return ONLY valid JSON, no markdown code fences.`;
}

/**
 * Analyze an animal photo for injuries using Gemini Vision.
 * v2: Now accepts species and description for cross-validation.
 */
export async function analyzeAnimalInjury(
  imageUrl: string,
  userSpecies: string = "Unknown",
  userDescription: string = "",
): Promise<TriageResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set — falling back to mock triage");
    return mockTriage(userSpecies);
  }

  try {
    // 1. Download image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // 2. Call Gemini Vision API with enhanced prompt
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = buildTriagePrompt(userSpecies, userDescription);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: contentType,
        },
      },
    ]);

    const responseText = result.response.text();

    // 3. Parse AI response — extract JSON between first { and last }
    const startIndex = responseText.indexOf("{");
    const endIndex = responseText.lastIndexOf("}");

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No JSON object found in AI response");
    }

    const jsonString = responseText.substring(startIndex, endIndex + 1);
    const parsed = JSON.parse(jsonString);

    // 4. Validate and normalize all fields
    const severity = Math.min(10, Math.max(1, Math.round(Number(parsed.severity) || 5)));
    const severityLabel = parsed.severityLabel || getSeverityLabel(severity);
    const description = String(parsed.description || "Visible injuries detected. Rescue recommended.");
    const tags: string[] = Array.isArray(parsed.tags)
      ? parsed.tags.map((t: unknown) => String(t).toLowerCase().trim()).filter(Boolean)
      : [];
    const note = String(parsed.note || "Rescue team should assess the animal on-site.");

    // v2 fields
    const detectedAnimal = String(parsed.detectedAnimal || "Unknown");
    const speciesMatch = Boolean(parsed.speciesMatch ?? true);
    const speciesMismatchNote = String(parsed.speciesMismatchNote || "");
    const urgencyLevel = validateEnum(parsed.urgencyLevel, ["IMMEDIATE", "URGENT", "STANDARD", "NON-URGENT"], getUrgencyFromSeverity(severity));
    const hasFracture = Boolean(parsed.hasFracture);
    const isConscious = Boolean(parsed.isConscious ?? true);
    const canMove = Boolean(parsed.canMove ?? true);
    const estimatedAge = String(parsed.estimatedAge || "unknown");
    const bleedingLevel = validateEnum(parsed.bleedingLevel, ["NONE", "MINOR", "MODERATE", "SEVERE"], "NONE");
    const mobilityStatus = validateEnum(parsed.mobilityStatus, ["NORMAL", "LIMPING", "IMMOBILE", "CANNOT DETERMINE"], "CANNOT DETERMINE");
    const bodyCondition = validateEnum(parsed.bodyCondition, ["HEALTHY", "THIN", "EMACIATED", "OBESE", "CANNOT DETERMINE"], "CANNOT DETERMINE");

    // Add species mismatch tag if needed
    if (!speciesMatch && !tags.includes("species mismatch")) {
      tags.unshift("species mismatch");
    }
    if (hasFracture && !tags.includes("fracture")) {
      tags.push("fracture");
    }

    return {
      severity, severityLabel, description, tags, note,
      detectedAnimal, speciesMatch, speciesMismatchNote,
      urgencyLevel, hasFracture, isConscious, canMove,
      estimatedAge, bleedingLevel, mobilityStatus, bodyCondition,
    };
  } catch (error) {
    console.error("Gemini triage error:", error);
    return mockTriage(userSpecies);
  }
}

/** Validate a string is one of allowed values */
function validateEnum(value: unknown, allowed: string[], fallback: string): string {
  const str = String(value || "").toUpperCase().trim();
  return allowed.includes(str) ? str : fallback;
}

function getUrgencyFromSeverity(severity: number): string {
  if (severity >= 9) return "IMMEDIATE";
  if (severity >= 7) return "URGENT";
  if (severity >= 4) return "STANDARD";
  return "NON-URGENT";
}

/** Fallback triage when Gemini is unavailable */
function mockTriage(species: string): TriageResult {
  const severity = Math.floor(Math.random() * 8) + 2;
  return {
    severity,
    severityLabel: getSeverityLabel(severity),
    description: "AI analysis unavailable. Manual assessment recommended upon arrival.",
    tags: ["needs assessment"],
    note: "Gemini Vision unavailable — please assess on-site.",
    detectedAnimal: species || "Unknown",
    speciesMatch: true,
    speciesMismatchNote: "",
    urgencyLevel: getUrgencyFromSeverity(severity),
    hasFracture: false,
    isConscious: true,
    canMove: true,
    estimatedAge: "unknown",
    bleedingLevel: "NONE",
    mobilityStatus: "CANNOT DETERMINE",
    bodyCondition: "CANNOT DETERMINE",
  };
}

function getSeverityLabel(severity: number): string {
  if (severity >= 9) return "CRITICAL";
  if (severity >= 7) return "HIGH";
  if (severity >= 4) return "MODERATE";
  return "LOW";
}
