// =============================================================
// PawAlert — Gemini Vision AI Triage Service (v2)
// Enhanced species verification, urgency, fracture detection
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
  detectedAnimal: string;         // What the AI actually sees in the photo (e.g. "Dog", "Cat", "Not an animal")
  speciesMatch: boolean;          // Does detected animal match user-selected species?
  speciesMismatchNote: string;    // Warning if mismatch (empty if match)
  urgencyLevel: string;           // "IMMEDIATE" | "URGENT" | "STANDARD" | "NON-URGENT"
  hasFracture: boolean;           // Suspected fracture detected?
  isConscious: boolean;           // Is the animal conscious?
  canMove: boolean;               // Can the animal move on its own?
  estimatedAge: string;           // Rough age estimate (e.g. "~2 years", "puppy", "unknown")
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
<<<<<<< HEAD
  "not an animal":  { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "❌" },
  "species mismatch":{ bg: "#FFE00F20", text: "#D4A800", emoji: "⚠️" },
  "needs assessment":{ bg: "#BBBBCC20", text: "#BBBBCC", emoji: "🔍" },
=======
  "maggot wound":   { bg: "#FF4F4F20", text: "#FF4F4F", emoji: "🐛" },
>>>>>>> 077f01d3551f5823cd42476e2efab7f09c84ceea
};

/** Get tag styling — falls back to a neutral style for unknown tags */
export function getTagStyle(tag: string): { bg: string; text: string; emoji: string } {
  const normalized = tag.toLowerCase().trim();
  return TAG_COLORS[normalized] || { bg: "#BBBBCC20", text: "#BBBBCC", emoji: "🏷️" };
}

<<<<<<< HEAD
/**
 * Build the Gemini prompt v2 — species-aware, with richer medical output.
 */
function buildTriagePrompt(userSelectedSpecies: string, userDescription: string): string {
  return `You are a veterinary AI assistant for PawAlert, an animal rescue platform in India.

The reporter selected: "${userSelectedSpecies}" as the species.
The reporter described: "${userDescription || "No description provided"}"

Analyze the provided image carefully. Return a JSON object with ALL these fields:
=======
const TRIAGE_PROMPT = `You are a Senior Veterinary Triage Specialist for PawAlert, India's leading stray animal rescue platform.
Your goal is to provide a high-accuracy medical assessment based on the provided image.

### Thinking Phase (Chain of Thought):
Before generating the final JSON, describe what you see in the image:
1. **Clinical Observations**: Note hair loss, blood, bone alignment, skin texture (crusty, red), and body weight.
2. **Species & Position**: Confirm the animal and if it is standing, sitting, or prone (unable to move).
3. **Environment**: Is it near a road? This indicators high risk of trauma.
>>>>>>> 077f01d3551f5823cd42476e2efab7f09c84ceea

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
<<<<<<< HEAD
  "detectedAnimal": "<What animal do you ACTUALLY see in the image? e.g. Dog, Cat, Cow, Bird, Monkey, Not an animal, Unclear>",
  "speciesMatch": <true/false — does detectedAnimal match "${userSelectedSpecies}"?>,
  "speciesMismatchNote": "<If mismatch, explain. e.g. 'The photo shows a cat, but user selected Dog'. Empty string if match>",
  
  "severity": <number 1-10>,
  "severityLabel": "<CRITICAL | HIGH | MODERATE | LOW>",
  "description": "<3-4 sentence detailed medical description of visible injuries, body condition, and overall state>",
  
  "tags": ["<injury tag 1>", "<injury tag 2>", ...],
  "note": "<1-2 sentence triage recommendation for rescue team>",
  
  "urgencyLevel": "<IMMEDIATE | URGENT | STANDARD | NON-URGENT>",
  "hasFracture": <true/false — is there a suspected bone fracture visible or implied?>,
  "isConscious": <true/false — does the animal appear conscious and alert?>,
  "canMove": <true/false — does the animal appear able to move on its own?>,
  "estimatedAge": "<rough estimate, e.g. 'puppy ~3 months', '~2 years adult', 'senior ~8+ years', 'unknown'>",
  "bleedingLevel": "<NONE | MINOR | MODERATE | SEVERE>",
  "mobilityStatus": "<NORMAL | LIMPING | IMMOBILE | CANNOT DETERMINE>",
  "bodyCondition": "<HEALTHY | THIN | EMACIATED | OBESE | CANNOT DETERMINE>"
}

SEVERITY SCALE:
- 9-10 = CRITICAL: Life-threatening (heavy bleeding, unconscious, paralyzed, hit by vehicle, severe trauma)
- 7-8 = HIGH: Severe injury needing urgent care (suspected fracture, deep wound, severe malnourishment, difficulty breathing)
- 4-6 = MODERATE: Visible injury or distress (limping, minor wounds, skin disease, dehydration, mild infection)
- 1-3 = LOW: Mild condition (minor scrapes, appears scared or lost, stray needing shelter, healthy)

URGENCY LEVELS:
- IMMEDIATE: Life-threatening — dispatch rescue NOW (severe bleeding, unconscious, can't breathe, severe trauma)
- URGENT: Serious but stable — rescue within 1 hour (fractures, deep wounds, can't walk, severe pain)
- STANDARD: Needs attention within 24 hours (infections, mild limping, skin diseases, dehydration)
- NON-URGENT: Safe for now — can wait for routine pickup (healthy stray, minor scrape, scared but uninjured)

FRACTURE DETECTION:
- Look for: abnormal limb angles, swelling at joints, inability to bear weight, visible bone displacement
- If limb hangs at an unnatural angle, set hasFracture=true
- If the animal is limping but limbs look normal, set hasFracture=false

SPECIES VERIFICATION:
- Carefully examine the photo. Dogs, cats, cows, birds, monkeys, etc. have distinct features.
- If the image shows a different animal than what the user selected, set speciesMatch=false and explain.
- If the image is not an animal at all (landscape, person, object), set detectedAnimal="Not an animal", severity=1, and note the issue.

For tags, use simple lowercase keywords from this list:
bleeding, fracture, broken bone, wound, laceration, bite wound, burn, malnourished, dehydration, emaciated,
limping, skin disease, mange, infection, eye injury, eye infection, ear infection, tick infestation,
paralysis, unconscious, poisoning, internal injury, abscess, lethargic, weakness, minor injury,
healthy, scared, stray, open wound, hit by vehicle, immediate rescue, urgent care, not an animal, species mismatch

IMPORTANT: Return ONLY valid JSON, no markdown code fences, no explanation text.`;
}
=======
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
>>>>>>> 077f01d3551f5823cd42476e2efab7f09c84ceea

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

    // 3. Parse AI response
<<<<<<< HEAD
    const cleaned = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
=======
    // Extract everything between first { and last } to skip any "Thinking" preamble
    const startIndex = responseText.indexOf("{");
    const endIndex = responseText.lastIndexOf("}");
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No JSON object found in AI response");
    }
>>>>>>> 077f01d3551f5823cd42476e2efab7f09c84ceea

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
