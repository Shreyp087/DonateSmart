import { GoogleGenAI } from "@google/genai";
import { estimateSuggestedResaleRange } from "@/lib/pricing";
import {
  AppraisalSource,
  BuyerStory,
  BuyerStoryStep,
  DonationInput,
  DonationItem,
  ItemAppraisal,
  SuggestedRange
} from "@/lib/types";
import { toTitleCase } from "@/lib/utils";

const defaultGeminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export class DonationReviewError extends Error {
  fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = "DonationReviewError";
    this.fieldErrors = fieldErrors;
  }
}

function extractJsonText(rawText: string) {
  const trimmed = rawText.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  return trimmed;
}

function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?)(;base64)?,(.*)$/);

  if (!match) {
    throw new Error("Unsupported image data format.");
  }

  const [, mimeType, base64Marker, rawData] = match;
  const data = base64Marker ? rawData : Buffer.from(decodeURIComponent(rawData)).toString("base64");

  return {
    mimeType,
    data
  };
}

function dedupeSources(sources: AppraisalSource[]) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    if (!source.uri || seen.has(source.uri)) {
      return false;
    }

    seen.add(source.uri);
    return true;
  });
}

function buildFallbackAppraisal(
  input: DonationInput,
  summary: string
): { suggestedResaleRange: SuggestedRange; appraisal: ItemAppraisal } {
  const suggestedResaleRange = estimateSuggestedResaleRange(input);

  return {
    suggestedResaleRange,
    appraisal: {
      pricingMethod: "rules",
      pricingModel: "local-rules-v1",
      summary,
      conditionAssessment: `Using the donor-selected ${toTitleCase(input.condition)} condition and ${toTitleCase(input.category)} category.`,
      detectedCategory: toTitleCase(input.category),
      categoryMatch: true,
      validationNote: "The local fallback accepted this item without AI image validation.",
      searchQueries: [],
      sources: [],
      analyzedAt: new Date().toISOString()
    }
  };
}

function getFriendlyGeminiFailureSummary() {
  return "Live Gemini pricing was unavailable for this item, so DonateSmart used the local pricing fallback to prepare a suggested resale range.";
}

function getAiValidationUnavailableError() {
  return new DonationReviewError(
    "AI image validation is unavailable right now. Please check the Gemini API configuration and try again.",
    {
      imageDataUrl:
        "We could not validate this image right now. Verify the Gemini API key in .env.local and resubmit.",
      itemName: "Automatic item verification is temporarily unavailable."
    }
  );
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getStoryDraft(item: DonationItem): Omit<BuyerStory, "generatedAt" | "model"> {
  const itemLabel = item.brand ? `${item.brand} ${item.itemName}` : item.itemName;
  const rangeLabel = `$${item.suggestedResaleRange.low}-$${item.suggestedResaleRange.high}`;

  return {
    title:
      item.status === "sold"
        ? `${toTitleCase(item.itemName)} already found a new home`
        : `${toTitleCase(item.itemName)} is ready for its next chapter`,
    preview: `${itemLabel} is part of a reuse story that keeps something useful in motion instead of letting it go to waste.`,
    detail: `${itemLabel} has already done its job once and now gets a fresh chance to be noticed again. ${item.donorImpactMessage}`,
    buyMessage: `Choose this piece now and keep its reuse story moving for around ${rangeLabel}.`,
    pickupMessage: "Pick a simple pickup time and this item can be held for its next handoff.",
    steps: [
      {
        label: "Passed forward",
        detail: `Someone chose to donate this ${item.itemName.toLowerCase()} instead of letting it sit unused.`
      },
      {
        label: "Checked in",
        detail: `DonateSmart logged it, photographed it, and placed it into the ${item.category} flow.`
      },
      {
        label: "Prepared for reuse",
        detail: `Its ${item.condition} condition supports a gentle resale range around ${rangeLabel}.`
      },
      {
        label: item.status === "sold" ? "Taken home" : "Waiting for a match",
        detail:
          item.status === "sold"
            ? "Its next chapter has already started with a buyer."
            : "The next person who chooses it becomes part of the story too."
      }
    ]
  };
}

function toStoryStep(step: unknown, fallback: BuyerStoryStep) {
  if (!step || typeof step !== "object") {
    return fallback;
  }

  const candidate = step as Partial<BuyerStoryStep>;
  const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
  const detail = typeof candidate.detail === "string" ? candidate.detail.trim() : "";

  return {
    label: label || fallback.label,
    detail: detail || fallback.detail
  };
}

function toBuyerStory(item: DonationItem, rawStory: unknown): BuyerStory {
  const draft = getStoryDraft(item);
  const candidate = rawStory && typeof rawStory === "object" ? (rawStory as Partial<BuyerStory>) : {};
  const rawSteps = Array.isArray(candidate.steps) ? candidate.steps : [];
  const steps = draft.steps.map((fallbackStep, index) => toStoryStep(rawSteps[index], fallbackStep));

  return {
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title.trim() : draft.title,
    preview:
      typeof candidate.preview === "string" && candidate.preview.trim() ? candidate.preview.trim() : draft.preview,
    detail: typeof candidate.detail === "string" && candidate.detail.trim() ? candidate.detail.trim() : draft.detail,
    buyMessage:
      typeof candidate.buyMessage === "string" && candidate.buyMessage.trim()
        ? candidate.buyMessage.trim()
        : draft.buyMessage,
    pickupMessage:
      typeof candidate.pickupMessage === "string" && candidate.pickupMessage.trim()
        ? candidate.pickupMessage.trim()
        : draft.pickupMessage,
    steps,
    generatedAt: new Date().toISOString(),
    model: defaultGeminiModel
  };
}

export async function generateBuyerStories(items: DonationItem[]) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || items.length === 0) {
    return {} as Record<string, BuyerStory>;
  }

  const ai = new GoogleGenAI({ apiKey });
  const stories: Record<string, BuyerStory> = {};

  for (const chunk of chunkItems(items, 6)) {
    const storyInputs = chunk.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      brand: item.brand || "",
      condition: item.condition,
      description: item.description || "",
      status: item.status,
      priceRange: `$${item.suggestedResaleRange.low}-$${item.suggestedResaleRange.high}`,
      donorImpactMessage: item.donorImpactMessage,
      appraisalSummary: item.appraisal.summary
    }));

    const prompt = `
      You are writing short, charming, buyer-facing thrift stories for DonateSmart.

      Each item should feel specific to the product, category, condition, and current status.
      Avoid repeating the same structure or generic wording across items.
      Keep the tone warm, cute, and grounded.
      Do not invent dramatic personal history or unverifiable details.
      Write concise copy for a product card and a product detail page.

      Return exactly one JSON object with this shape and nothing else:
      {
        "stories": [
          {
            "id": "item-id",
            "title": "string",
            "preview": "string",
            "detail": "string",
            "buyMessage": "string",
            "pickupMessage": "string",
            "steps": [
              { "label": "string", "detail": "string" },
              { "label": "string", "detail": "string" },
              { "label": "string", "detail": "string" },
              { "label": "string", "detail": "string" }
            ]
          }
        ]
      }

      Writing rules:
      - Make each title and preview clearly different from the others.
      - preview should work on a card and stay under 180 characters.
      - detail should be 2 or 3 short sentences.
      - buyMessage and pickupMessage should each be one short sentence.
      - The 4 steps should feel item-specific, not generic boilerplate.
      - If an item is sold, reflect that it already found a home.
      - If an item is not yet floor-ready, reflect that it is still being prepared.

      Items:
      ${JSON.stringify(storyInputs, null, 2)}
    `.trim();

    const response = await ai.models.generateContent({
      model: defaultGeminiModel,
      contents: prompt
    });

    const rawText = typeof response.text === "string" ? response.text : "";

    if (!rawText) {
      throw new Error("Gemini returned an empty buyer story response.");
    }

    const parsed = JSON.parse(extractJsonText(rawText)) as {
      stories?: Array<{ id?: string } & Partial<BuyerStory>>;
    };

    for (const item of chunk) {
      const matchingStory = parsed.stories?.find((story) => story.id === item.id);
      stories[item.id] = toBuyerStory(item, matchingStory);
    }
  }

  return stories;
}

export async function appraiseDonationItem(
  input: DonationInput
): Promise<{ suggestedResaleRange: SuggestedRange; appraisal: ItemAppraisal }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw getAiValidationUnavailableError();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = parseImageDataUrl(input.imageDataUrl);
    const prompt = `
      You are helping a thrift store estimate a suggested resale range for a donated item in the United States.

      Use the uploaded item image and the donor-provided details below. When helpful, use Google Search grounding to look for current resale comps or category-level pricing signals.

      Donor-provided details:
      - Item name: ${input.itemName}
      - Category: ${input.category}
      - Bulk clothing donation: ${input.category === "clothing" ? (input.isBulkClothing ? "Yes" : "No") : "Not applicable"}
      - Bulk clothing quantity range: ${input.bulkClothingRange || "Not provided"}
      - Condition: ${input.condition}
      - Brand: ${input.brand || "Not provided"}
      - Size: ${input.size || "Not provided"}
      - Description: ${input.description || "Not provided"}

      Rules:
      - First decide whether the uploaded image is usable for intake.
      - Reject if the image is blurry, blank, unrelated, contains multiple unclear items, or does not reasonably match the submitted category.
      - Reject if the typed item name does not reasonably match the item shown in the image.
      - Compare all three signals together: item name, selected category, and the visual content of the image.
      - If the image appears to show clothing, do not accept item names like lamp, table, home decor, or other unrelated product types.
      - If the image appears to show clothing/apparel but the submitted category is home, reject it.
      - If the category is clothing and the donor says it is a bulk donation, bagged or wrapped clothing photos are acceptable.
      - For bulk clothing, estimate the suggested resale range for the whole donated bag or bundle, not for a single clothing item.
      - Use the selected clothing quantity range as a strong signal when pricing bulk donations.
      - If you reject the item, explain what is wrong in plain language for a donor.
      - Return a broad suggested resale range, not an exact price.
      - Base the range on the item image, the stated condition, the category, and brand if relevant.
      - Keep the range realistic for a thrift / resale context.
      - Return exactly one JSON object and nothing else.
      - Do not use markdown fences.
      - Use this exact shape:
        {
          "accepted": boolean,
          "rejectionReason": string,
          "low": number,
          "high": number,
          "summary": string,
          "conditionAssessment": string,
          "detectedCategory": string,
          "categoryMatch": boolean,
          "validationNote": string
        }
    `.trim();

    const response = await ai.models.generateContent({
      model: defaultGeminiModel,
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: imagePart.mimeType,
            data: imagePart.data
          }
        }
      ],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const rawText = typeof response.text === "string" ? response.text : "";

    if (!rawText) {
      throw new Error("Gemini returned an empty appraisal.");
    }

    const parsed = JSON.parse(extractJsonText(rawText)) as {
      accepted: boolean;
      rejectionReason: string;
      low: number;
      high: number;
      summary: string;
      conditionAssessment: string;
      detectedCategory: string;
      categoryMatch: boolean;
      validationNote: string;
    };

    if (!parsed.accepted || !parsed.categoryMatch) {
      const detectedCategory = parsed.detectedCategory?.trim();
      const categoryError =
        detectedCategory && detectedCategory.toLowerCase() !== input.category.toLowerCase()
          ? `The uploaded image looks more like ${detectedCategory} than ${toTitleCase(input.category)}.`
          : "The uploaded image does not appear to match the selected category.";

      throw new DonationReviewError(parsed.rejectionReason || "Please upload a clearer image or choose the correct category.", {
        category: categoryError,
        imageDataUrl: parsed.validationNote || "Please upload a clearer photo of the item.",
        itemName: parsed.rejectionReason || "The item name does not appear to match the uploaded image."
      });
    }

    const low = Math.max(4, Math.round(Number(parsed.low)));
    const high = Math.max(low + 4, Math.round(Number(parsed.high)));
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = dedupeSources(
      (groundingMetadata?.groundingChunks || [])
        .map((chunk) => chunk.web || chunk.retrievedContext)
        .filter((chunk): chunk is { title?: string; uri?: string } => Boolean(chunk?.uri))
        .map((chunk) => ({
          title: chunk.title || "Web source",
          uri: chunk.uri || ""
        }))
    );

    return {
      suggestedResaleRange: {
        low,
        high,
        label: `${low}-${high}`
      },
      appraisal: {
        pricingMethod: sources.length > 0 ? "gemini-grounded" : "gemini",
        pricingModel: defaultGeminiModel,
        summary: parsed.summary,
        conditionAssessment: parsed.conditionAssessment,
        detectedCategory: parsed.detectedCategory,
        categoryMatch: parsed.categoryMatch,
        validationNote: parsed.validationNote,
        searchQueries: groundingMetadata?.webSearchQueries || [],
        sources,
        analyzedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    if (error instanceof DonationReviewError) {
      throw error;
    }

    if (error instanceof Error) {
      console.error("Gemini appraisal failed:", error.message);
    } else {
      console.error("Gemini appraisal failed with an unknown error.");
    }

    throw getAiValidationUnavailableError();
  }
}
