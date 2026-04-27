import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.AI_KEY;
if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY (or AI_KEY) is not set");
}

export const anthropic = new Anthropic({ apiKey });

export const MODEL = "claude-haiku-4-5-20251001";
