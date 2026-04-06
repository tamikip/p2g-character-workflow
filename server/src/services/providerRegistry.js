const path = require("path");
const {
  mockGenerateCg,
  mockGenerateExpression,
  mockRemoveBackground
} = require("../adapters/mockImageAdapter");
const {
  banana2GenerateCg,
  banana2GenerateExpression,
  banana2RemoveBackground,
  isBanana2Configured
} = require("../adapters/banana2ImageAdapter");

function getMimeTypeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  return "image/png";
}

function getProviderLabel(provider, config) {
  if (provider === "banana2" && !isBanana2Configured(config)) {
    return "mock";
  }

  return provider;
}

function getBackgroundRemovalRunner(config) {
  if (config.bgRemovalProvider === "banana2" && isBanana2Configured(config)) {
    return {
      provider: "banana2",
      run: banana2RemoveBackground
    };
  }

  return {
    provider: "mock",
    run: mockRemoveBackground
  };
}

function getExpressionRunner(config) {
  if (config.expressionProvider === "banana2" && isBanana2Configured(config)) {
    return {
      provider: "banana2",
      run: banana2GenerateExpression
    };
  }

  return {
    provider: "mock",
    run: mockGenerateExpression
  };
}

function getCgRunner(config) {
  if (config.cgProvider === "banana2" && isBanana2Configured(config)) {
    return {
      provider: "banana2",
      run: banana2GenerateCg
    };
  }

  return {
    provider: "mock",
    run: mockGenerateCg
  };
}

module.exports = {
  getBackgroundRemovalRunner,
  getCgRunner,
  getExpressionRunner,
  getMimeTypeFromPath,
  getProviderLabel
};
