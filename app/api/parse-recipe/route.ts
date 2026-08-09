import Anthropic from "@anthropic-ai/sdk";
import { COURSES, DIETARY_TAGS } from "@/lib/types";

// Server-side only. ANTHROPIC_API_KEY has no NEXT_PUBLIC_ prefix, so Next.js
// never bundles it into client JavaScript — the key stays on the server.
const RECIPE_SCHEMA: Anthropic.Tool["input_schema"] = {
  type: "object",
  properties: {
    name: { type: "string", description: "The dish name" },
    cuisine: {
      type: "string",
      description: "Cuisine of origin, e.g. Indian. Empty string if unclear.",
    },
    course: { type: "string", enum: [...COURSES] },
    servings: { type: "integer", description: "How many people it serves" },
    prep_minutes: { type: "integer", description: "Hands-on prep time, 0 if unknown" },
    cook_minutes: { type: "integer", description: "Cooking time, 0 if unknown" },
    ingredients: {
      type: "array",
      description: "One entry per ingredient, in the order listed",
      items: {
        type: "object",
        properties: {
          quantity: { type: "string", description: "Numeric amount, e.g. 1 or 1/2. Empty if none." },
          unit: { type: "string", description: "Unit, e.g. cup, tbsp, g. Empty if none." },
          name: { type: "string", description: "The ingredient and any prep note" },
        },
        required: ["quantity", "unit", "name"],
        additionalProperties: false,
      },
    },
    steps: {
      type: "array",
      description: "Cooking steps in order, one action per step, no step numbers",
      items: { type: "string" },
    },
    tags: {
      type: "array",
      description: "Dietary tags that clearly apply based on the ingredients",
      items: { type: "string", enum: [...DIETARY_TAGS] },
    },
    notes: {
      type: "string",
      description: "Substitutions, storage, or tips mentioned. Empty string if none.",
    },
  },
  required: [
    "name",
    "cuisine",
    "course",
    "servings",
    "prep_minutes",
    "cook_minutes",
    "ingredients",
    "steps",
    "tags",
    "notes",
  ],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You convert free-form recipe text into structured data.

Extract only what the text actually says. Do not invent ingredients, steps, times, or tags that aren't supported by the text — an empty string or 0 is the correct answer when something isn't stated. Infer servings only when the text implies it; otherwise use 4.

Split ingredient lines into quantity, unit, and name: "2 tbsp olive oil" becomes quantity "2", unit "tbsp", name "olive oil". Keep prep notes with the name ("1 onion, finely diced" → name "onion, finely diced"). For ingredients with no measurement, leave quantity and unit empty.

Write steps as one action each, in order, without step numbers or bullet markers.

Apply a dietary tag only when the ingredient list clearly supports it — no meat, fish, or dairy for Vegan; no wheat, barley, or rye for Gluten-free.`;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let text: string;
  try {
    ({ text } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!text?.trim()) {
    return Response.json({ error: "Paste a recipe first." }, { status: 400 });
  }
  if (text.length > 20000) {
    return Response.json(
      { error: "That recipe is too long — trim it to under 20,000 characters." },
      { status: 400 },
    );
  }

  const client = new Anthropic();

  try {
    const message = await client.messages.create({
      // Gateways namespace model IDs (NVIDIA uses azure/anthropic/claude-opus-5);
      // the plain ID is correct against api.anthropic.com.
      model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
      max_tokens: 16000,
      // A forced tool call is how we get structured JSON back. The
      // output_config.format route needs structured outputs enabled on the
      // workspace, which the NVIDIA gateway doesn't allow.
      tools: [
        {
          name: "save_recipe",
          description: "Record the recipe described in the text.",
          input_schema: RECIPE_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "save_recipe" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    if (message.stop_reason === "refusal") {
      return Response.json(
        { error: "Claude declined to parse that text. Try pasting just the recipe." },
        { status: 422 },
      );
    }
    if (message.stop_reason === "max_tokens") {
      return Response.json(
        { error: "That recipe was too long to finish parsing. Try a shorter one." },
        { status: 422 },
      );
    }

    const block = message.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      return Response.json({ error: "Claude returned no recipe data." }, { status: 502 });
    }

    return Response.json(block.input);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "Rate limited — wait a moment and try again." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", error.status, error.message);
      return Response.json(
        { error: `Couldn't parse that recipe (${error.status}).` },
        { status: 502 },
      );
    }
    console.error("parse-recipe failed:", error);
    return Response.json({ error: "Couldn't parse that recipe." }, { status: 500 });
  }
}
