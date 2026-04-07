const fs = require("fs/promises");
const path = require("path");
const { AppError } = require("../utils/errors");

function isPlatoConfigured(config) {
  return Boolean(config.platoApiKey);
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function getMimeTypeFromInput(sourceMimeType) {
  if (sourceMimeType === "image/jpg") {
    return "image/jpeg";
  }

  return sourceMimeType || "image/png";
}

function getExtensionFromMimeType(mimeType) {
  if (mimeType === "image/jpeg") {
    return ".jpg";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  return ".png";
}

function findImageDataUrl(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const match = value.match(/data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\n\r]+)/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2].replace(/\s+/g, "")
  };
}

function extractImagePayload(responseJson) {
  const message = responseJson?.choices?.[0]?.message;

  const directImage = message?.images?.find((item) => item?.image_url?.url);
  if (directImage?.image_url?.url) {
    const parsed = findImageDataUrl(directImage.image_url.url);
    if (parsed) {
      return parsed;
    }
  }

  if (Array.isArray(message?.content)) {
    for (const item of message.content) {
      const candidateUrl =
        item?.image_url?.url ||
        item?.url ||
        item?.data ||
        (typeof item?.text === "string" ? item.text : null);

      const parsed = findImageDataUrl(candidateUrl);
      if (parsed) {
        return parsed;
      }
    }
  }

  if (typeof message?.content === "string") {
    const parsed = findImageDataUrl(message.content);
    if (parsed) {
      return parsed;
    }
  }

  throw new Error(
    responseJson?.error?.message ||
      "Plato returned no image payload. Check whether the token has quota and image output is enabled."
  );
}

async function writeImagePayload(destinationPath, imagePayload) {
  const ext = getExtensionFromMimeType(imagePayload.mimeType);
  const parsed = path.parse(destinationPath);
  const finalPath = path.join(parsed.dir, `${parsed.name}${ext}`);

  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.writeFile(finalPath, Buffer.from(imagePayload.data, "base64"));

  return {
    provider: "plato",
    mime_type: imagePayload.mimeType,
    output_path: finalPath
  };
}

async function callPlatoImageEdit({
  config,
  sourcePath,
  sourceMimeType,
  destinationPath,
  prompt
}) {
  if (!isPlatoConfigured(config)) {
    throw new AppError("PLATO_API_KEY is missing.", 500, {
      provider: "plato",
      base_url: config.platoBaseUrl,
      model: config.platoModel
    }, "PLATO_API_KEY_MISSING");
  }

  if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(sourceMimeType)) {
    throw new AppError(
      "Plato live mode currently supports PNG, JPG, JPEG, and WEBP inputs only.",
      400,
      {
        provider: "plato",
        received_mime_type: sourceMimeType
      },
      "PLATO_UNSUPPORTED_MIME_TYPE"
    );
  }

  const imageBytes = await fs.readFile(sourcePath);
  const endpoint = `${normalizeBaseUrl(config.platoBaseUrl)}/chat/completions`;
  const dataUrl = `data:${getMimeTypeFromInput(sourceMimeType)};base64,${imageBytes.toString("base64")}`;

  let response;
  let responseJson;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.platoApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.platoModel,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        modalities: ["text", "image"]
      }),
      signal: AbortSignal.timeout(config.platoTimeoutMs)
    });

    responseJson = await response.json();
  } catch (error) {
    throw new AppError("Plato request could not be completed.", 502, {
      provider: "plato",
      endpoint,
      model: config.platoModel,
      source_path: sourcePath,
      source_mime_type: sourceMimeType,
      timeout_ms: config.platoTimeoutMs,
      original_error: error.message
    }, "PLATO_NETWORK_ERROR");
  }

  if (!response.ok) {
    throw new AppError(
      responseJson?.error?.message || `Plato request failed with status ${response.status}`,
      502,
      {
        provider: "plato",
        endpoint,
        model: config.platoModel,
        http_status: response.status,
        response_body: JSON.stringify(responseJson)
      },
      "PLATO_REQUEST_FAILED"
    );
  }

  let imagePayload;

  try {
    imagePayload = extractImagePayload(responseJson);
  } catch (error) {
    throw new AppError(error.message, 502, {
      provider: "plato",
      endpoint,
      model: config.platoModel,
      response_body: JSON.stringify(responseJson)
    }, "PLATO_IMAGE_PAYLOAD_MISSING");
  }

  return writeImagePayload(destinationPath, imagePayload);
}

async function platoRemoveBackground(args) {
  return callPlatoImageEdit(args);
}

async function platoGenerateExpression(args) {
  return callPlatoImageEdit(args);
}

async function platoGenerateCg(args) {
  return callPlatoImageEdit(args);
}

module.exports = {
  isPlatoConfigured,
  platoGenerateCg,
  platoGenerateExpression,
  platoRemoveBackground
};
