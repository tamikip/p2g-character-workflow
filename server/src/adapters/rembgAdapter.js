const path = require("path");
const { execFile } = require("child_process");

function execFileAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function isRembgConfigured(config) {
  return Boolean(config.rembgPythonPath && config.rembgScriptPath);
}

async function rembgRemoveBackground({ config, sourcePath, destinationPath }) {
  if (!isRembgConfigured(config)) {
    throw new Error("rembg is not configured.");
  }

  try {
    await execFileAsync(
      config.rembgPythonPath,
      [config.rembgScriptPath, sourcePath, destinationPath],
      {
        cwd: path.resolve(config.projectRoot),
        timeout: config.rembgTimeoutMs,
        maxBuffer: 10 * 1024 * 1024
      }
    );
  } catch (error) {
    const stderr = (error.stderr || "").trim();
    throw new Error(stderr || error.message || "rembg background removal failed.");
  }

  return {
    provider: "rembg",
    mime_type: "image/png",
    output_path: destinationPath
  };
}

module.exports = {
  isRembgConfigured,
  rembgRemoveBackground
};
