const fs = require("fs/promises");
const path = require("path");
const config = require("../config");

const promptCache = new Map();

const CHARACTER_CONSISTENCY_REQUIREMENTS = [
  "请保持同一角色的人设、发型、五官、服装、配饰、配色与画风一致。",
  "必须是单人角色，不要新增人物。",
  "不要改变角色年龄感、体型、服装款式、发型结构和标志性配饰。"
].join(" ");

const NEGATIVE_PROMPT = [
  "多人",
  "文字",
  "水印",
  "裁切",
  "畸形手",
  "多肢",
  "模糊",
  "低清晰度",
  "换装",
  "变发型",
  "变配饰",
  "人物不一致"
].join("、");

const CG_SCENE_POOL = [
  "清晨轻轨车厢里靠窗看资料，冷色城市晨光掠过脸和手中的纸页",
  "雨后便利店门口短暂停留，霓虹和街灯在地面反光，角色抱着学习资料",
  "展会后台整理笔记和设备，局部射灯照亮桌面、徽章和随身物件",
  "安静咖啡馆角落快速复盘，桌上散着便签、平板和半杯饮品",
  "天台傍晚迎风翻看资料，远处城市灯光渐亮，风吹动发梢和衣角",
  "创作工作室里检查草稿和参考图，台灯与屏幕光混合照亮桌面",
  "夜间自习室短暂发呆后继续记录重点，冷暖混合灯光打在脸和本子上",
  "美术教室里整理作品夹和颜料，窗边自然光照亮手部和纸面",
  "旅行途中在候车区复盘资料，行李箱、耳机和票据构成生活化场景",
  "校园长廊边走边看资料，透过玻璃的侧光照亮轮廓和服装细节",
  "图书市集摊位前挑选资料，角色停下翻阅，周围书脊和海报形成层次",
  "午后树荫下在长椅上复盘内容，斑驳光影落在头发、衣服和书页上"
];

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
    "Remove the background from the provided character image.",
    "Keep only the main character.",
    "Preserve face, hair, outfit, silhouette, and all important design details.",
    "Return a clean PNG cutout with a transparent background.",
    "Do not redesign the character.",
    "Do not add extra props, scenery, text, or watermark."
  ].join(" ");
}

async function getExpressionPrompt(expressionName) {
  const expressionDetails = {
    thinking: "基于原始角色图，生成思考表情版本。表情重点：眼神集中、眉眼微收、嘴部自然克制。",
    surprise: "基于原始角色图，生成惊讶表情版本。表情重点：眼睛睁大、眉毛上扬、嘴巴自然张开。",
    angry: "基于原始角色图，生成生气表情版本。表情重点：眉头压低、嘴角绷紧、面部紧张感更明显。"
  };

  if (!expressionDetails[expressionName]) {
    throw new Error(`Unsupported expression prompt: ${expressionName}`);
  }

  return [
    CHARACTER_CONSISTENCY_REQUIREMENTS,
    expressionDetails[expressionName],
    "只允许修改表情，不要修改姿态、发型、服装、配饰和角色设定。",
    "允许保留原图背景或生成自然背景，不需要透明背景。",
    `负面：${NEGATIVE_PROMPT}。`
  ].join(" ");
}

function pickRandomScenes(count) {
  const pool = [...CG_SCENE_POOL];
  const selected = [];

  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected;
}

async function getCgPrompts() {
  await loadPromptFile("cg-generation.md");

  return pickRandomScenes(2).map((sceneDescription, index) => ({
    scene: sceneDescription,
    prompt: [
      CHARACTER_CONSISTENCY_REQUIREMENTS,
      "你需要先根据参考角色图自行判断角色的气质、题材、作品类型、服装用途和世界观氛围，再在不违和的前提下设计场景。",
      "场景必须贴合该角色，而不是套用固定模板或通用图书馆场景。",
      `请生成高完成度 CG 场景图 ${index + 1}：${sceneDescription}。`,
      "允许构图、镜头、光线、道具和环境细节自然变化，但角色身份必须保持一致。",
      "输出完整单张成图，不需要透明背景。",
      `负面：${NEGATIVE_PROMPT}。`
    ].join(" ")
  }));
}

module.exports = {
  createBackgroundRemovalPrompt,
  getCgPrompts,
  getExpressionPrompt
};
