const fs = require("fs/promises");
const path = require("path");
const { AppError } = require("../utils/errors");

function isPlatoConfigured(config) {
  return Boolean(config.platoApiKey);
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function resolvePlatoEndpoint(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);

  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function findRemoteImageUrl(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const markdownMatch = value.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
  if (markdownMatch) {
    return markdownMatch[1];
  }

  const directMatch = value.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|webp)(?:\?\S*)?/i);
  if (directMatch) {
    return directMatch[0];
  }

  return null;
}

function extractImagePayload(responseJson) {
  const message = responseJson?.choices?.[0]?.message;
  const messageContent =
    typeof message?.content === "string"
      ? message.content
      : Array.isArray(message?.content)
        ? message.content
            .map((item) => item?.text || item?.content || "")
            .filter(Boolean)
            .join("\n")
        : "";

  const directImage = message?.images?.find((item) => item?.image_url?.url);
  if (directImage?.image_url?.url) {
    const parsed = findImageDataUrl(directImage.image_url.url);
    if (parsed) {
      return parsed;
    }

    const remoteUrl = findRemoteImageUrl(directImage.image_url.url);
    if (remoteUrl) {
      return {
        remoteUrl
      };
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

      const remoteUrl = findRemoteImageUrl(candidateUrl);
      if (remoteUrl) {
        return {
          remoteUrl
        };
      }
    }
  }

  if (typeof message?.content === "string") {
    const parsed = findImageDataUrl(message.content);
    if (parsed) {
      return parsed;
    }

    const remoteUrl = findRemoteImageUrl(message.content);
    if (remoteUrl) {
      return {
        remoteUrl
      };
    }
  }

  throw new Error(
    responseJson?.error?.message ||
      (messageContent
        ? `Plato did not return an image. Model response: ${messageContent}`
        : "Plato returned no image payload. Check whether the token has quota and image output is enabled.")
  );
}

async function writeImagePayload(destinationPath, imagePayload) {
  let mimeType = imagePayload.mimeType;
  let imageBuffer;

  if (imagePayload.remoteUrl) {
    const remoteResponse = await fetch(imagePayload.remoteUrl);
    if (!remoteResponse.ok) {
      throw new AppError(
        `Plato image download failed with status ${remoteResponse.status}`,
        502,
        {
          provider: "plato",
          image_url: imagePayload.remoteUrl,
          http_status: remoteResponse.status
        },
        "PLATO_IMAGE_DOWNLOAD_FAILED"
      );
    }

    const contentType = remoteResponse.headers.get("content-type") || "";
    mimeType = contentType.startsWith("image/") ? contentType.split(";")[0] : "image/png";
    imageBuffer = Buffer.from(await remoteResponse.arrayBuffer());
  } else {
    mimeType = imagePayload.mimeType;
    imageBuffer = Buffer.from(imagePayload.data, "base64");
  }

  const ext = getExtensionFromMimeType(mimeType);
  const parsed = path.parse(destinationPath);
  const finalPath = path.join(parsed.dir, `${parsed.name}${ext}`);

  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.writeFile(finalPath, imageBuffer);

  return {
    provider: "plato",
    mime_type: mimeType,
    output_path: finalPath,
    debug: imagePayload.remoteUrl
      ? {
          image_url: imagePayload.remoteUrl
        }
      : null
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
  const endpoint = resolvePlatoEndpoint(config.platoBaseUrl);
  const dataUrl = `data:${getMimeTypeFromInput(sourceMimeType)};base64,${imageBytes.toString("base64")}`;

  let response;
  let responseJson;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
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
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await wait(600 * attempt);
      }
    }
  }

  if (lastError) {
    throw new AppError("Plato request could not be completed.", 502, {
      provider: "plato",
      endpoint,
      model: config.platoModel,
      source_path: sourcePath,
      source_mime_type: sourceMimeType,
      timeout_ms: config.platoTimeoutMs,
      retry_attempts: 3,
      original_error: lastError.message,
      original_cause: lastError.cause?.message || null
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
