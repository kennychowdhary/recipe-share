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

Apply a dietary tag only when the ingredient list clearly supports it — no meat, fish, or dairy for Vegan; no wheat, barley, or rye for Gluten-free.

When the input is a recipe web page (structured data plus page text), take names, amounts, and steps from the structured data — every ingredient must keep its amount. Use the page text for what the structured data misses: headnote tips, substitutions, variations, and author edits or reader-tested tweaks belong in notes. Ignore navigation, ads, comments, and unrelated links.

When the input includes images (cookbook pages, screenshots, handwritten cards), transcribe them faithfully — every ingredient keeps its amount exactly as written. Multiple images are parts of one recipe (e.g. an ingredients page and a steps page) unless they clearly are not; handwriting you can't read becomes a note like "one ingredient was illegible", never a guess.`;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageInput = { media_type: (typeof IMAGE_TYPES)[number]; data: string };

function validImages(images: unknown): images is ImageInput[] {
  return (
    Array.isArray(images) &&
    images.length <= 4 &&
    images.every(
      (img) =>
        img &&
        IMAGE_TYPES.includes(img.media_type) &&
        typeof img.data === "string" &&
        img.data.length > 0 &&
        img.data.length < 5_000_000, // ~3.7MB decoded, under the API's 5MB/image cap
    )
  );
}

/** Pull <script type="application/ld+json"> Recipe objects — the structured
 * data most recipe sites embed for search engines. Far more reliable than
 * scraping the visible page. */
function extractRecipeJsonLd(html: string): string | null {
  const scripts = html.matchAll(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const [, body] of scripts) {
    try {
      const parsed = JSON.parse(body);
      const nodes = [parsed, ...(Array.isArray(parsed) ? parsed : []), ...(parsed["@graph"] ?? [])];
      for (const node of nodes) {
        const type = node?.["@type"];
        if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
          // Keep only the fields that matter; some sites embed huge review lists.
          const keep = [
            "name", "recipeYield", "prepTime", "cookTime", "totalTime",
            "recipeIngredient", "recipeInstructions", "recipeCuisine",
            "recipeCategory", "description", "keywords",
          ];
          return JSON.stringify(
            Object.fromEntries(keep.filter((k) => k in node).map((k) => [k, node[k]])),
          );
        }
      }
    } catch {
      // Malformed JSON-LD is common; keep looking.
    }
  }
  return null;
}

/** Crude but dependency-free: drop scripts/styles/tags, keep the words. */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|header|footer|nav)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#?\w+;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

async function fetchRecipeFromUrl(rawUrl: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("That doesn't look like a valid link.");
  }
  // Server-side fetch of a user-supplied URL: refuse anything that isn't
  // plain public http(s) so the route can't be pointed at internal services.
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http(s) links are supported.");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(host) ||
    host.includes(":")
  ) {
    throw new Error("That link points somewhere this site can't fetch from.");
  }

  let response: Response | null = null;
  try {
    response = await fetch(url, {
      headers: {
        // Recipe sites often refuse requests with no browser-like UA.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
  } catch {
    // Network-level failure: fall through to the reader proxy below.
  }

  if (response?.ok) {
    const html = (await response.text()).slice(0, 3_000_000);
    const jsonLd = extractRecipeJsonLd(html);
    const pageText = htmlToText(html).slice(0, 15000);
    return [
      `Recipe page: ${url.href}`,
      jsonLd ? `Structured recipe data from the page:\n${jsonLd}` : "",
      `Visible page text (may include headnotes, tips, and variations worth capturing in the notes):\n${pageText}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // Big recipe publishers bot-block datacenter IPs (Serious Eats answers 402).
  // Jina's public reader fetches the page from friendlier infrastructure and
  // returns clean markdown. Only the recipe URL is shared with it.
  const proxied = await fetch(`https://r.jina.ai/${url.href}`, {
    headers: { Accept: "text/plain" },
    signal: AbortSignal.timeout(30000),
  });
  if (!proxied.ok) {
    throw new Error(
      `That site wouldn't let us read the page (HTTP ${response?.status ?? "blocked"}) — copy the recipe text and paste it instead.`,
    );
  }
  const markdown = (await proxied.text()).slice(0, 20000);
  return `Recipe page: ${url.href}\n\nPage content (markdown; may include headnotes, tips, and variations worth capturing in the notes):\n${markdown}`;
}

function looksLikeUrl(s: string): boolean {
  return /^https?:\/\/\S+$/i.test(s.trim()) && !s.trim().includes("\n");
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let text: string;
  let images: unknown;
  try {
    ({ text, images } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const hasImages = Array.isArray(images) && images.length > 0;
  if (hasImages && !validImages(images)) {
    return Response.json(
      { error: "Photos must be JPEG, PNG, WebP, or GIF — up to 4, a few MB each." },
      { status: 400 },
    );
  }
  if (!text?.trim() && !hasImages) {
    return Response.json({ error: "Paste a recipe or add a photo first." }, { status: 400 });
  }
  if (text && text.length > 20000) {
    return Response.json(
      { error: "That recipe is too long — trim it to under 20,000 characters." },
      { status: 400 },
    );
  }

  // A bare link means "go get it" — fetch the page and parse that instead.
  if (!hasImages && text && looksLikeUrl(text)) {
    try {
      text = await fetchRecipeFromUrl(text.trim());
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Couldn't fetch that link." },
        { status: 422 },
      );
    }
  }

  const userContent: Anthropic.ContentBlockParam[] = [
    ...(hasImages
      ? (images as ImageInput[]).map(
          (img): Anthropic.ImageBlockParam => ({
            type: "image",
            source: { type: "base64", media_type: img.media_type, data: img.data },
          }),
        )
      : []),
    {
      type: "text",
      text: text?.trim() || "Extract the recipe from the image(s).",
    },
  ];

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
      messages: [{ role: "user", content: userContent }],
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
