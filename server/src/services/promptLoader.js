const fs = require("fs/promises");
const path = require("path");
const config = require("../config");

const promptCache = new Map();

async function loadPromptFile(fileName) {
  const cacheKey = fileName;

  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey);
  }

  const filePath = path.join(config.promptsDir, fileName);
  const content = await fs.readFile(filePath, "utf8");
  promptCache.set(cacheKey, content.trim());
  return content.trim();
}

function createBackgroundRemovalPrompt() {
  return [
    "Remove the background from the uploaded character image.",
    "Keep only the main character.",
    "Preserve face, hair, outfit, silhouette, and all important design details.",
    "Return a clean PNG cutout with a transparent background.",
    "Do not redesign the character.",
    "Do not add extra props, scenery, text, or watermark."
  ].join(" ");
}

async function getExpressionPrompt(expressionName) {
  const fileMap = {
    thinking: "expression-thinking.md",
    surprise: "expression-surprise.md",
    angry: "expression-angry.md"
  };

  const fileName = fileMap[expressionName];
  if (!fileName) {
    throw new Error(`Unsupported expression prompt: ${expressionName}`);
  }

  return loadPromptFile(fileName);
}

async function getCgPrompt() {
  return loadPromptFile("cg-generation.md");
}

module.exports = {
  createBackgroundRemovalPrompt,
  getCgPrompt,
  getExpressionPrompt
};
