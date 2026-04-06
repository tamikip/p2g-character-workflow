const fs = require("fs/promises");
const path = require("path");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function copyAsMock(sourcePath, destinationPath) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
  await sleep(350);

  return {
    provider: "mock",
    output_path: destinationPath
  };
}

async function mockRemoveBackground({ sourcePath, destinationPath }) {
  return copyAsMock(sourcePath, destinationPath);
}

async function mockGenerateExpression({ sourcePath, destinationPath }) {
  return copyAsMock(sourcePath, destinationPath);
}

async function mockGenerateCg({ sourcePath, destinationPath }) {
  return copyAsMock(sourcePath, destinationPath);
}

module.exports = {
  mockGenerateCg,
  mockGenerateExpression,
  mockRemoveBackground
};
