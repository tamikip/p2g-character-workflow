import { useEffect, useMemo, useState } from "react";

const STEP_ORDER = [
  "validate_input",
  "remove_background",
  "expression_thinking",
  "expression_surprise",
  "expression_angry",
  "cg_01",
  "cg_02"
];

const POLL_INTERVAL_MS = 1000;
const PERSONAL_GITHUB_URL = "https://github.com/hzagaming";
const PROJECT_GITHUB_URL = "https://github.com/hzagaming/p2g-character-workflow";
const APP_VERSION = "1.0.1";

const COLOR_STYLES = [
  { id: "cyan", label: { zh: "海蓝", en: "Cyan", ja: "シアン", ru: "Циан" } },
  { id: "emerald", label: { zh: "翡翠", en: "Emerald", ja: "エメラルド", ru: "Изумруд" } },
  { id: "amber", label: { zh: "琥珀", en: "Amber", ja: "アンバー", ru: "Янтарь" } },
  { id: "rose", label: { zh: "玫瑰", en: "Rose", ja: "ローズ", ru: "Роза" } },
  { id: "violet", label: { zh: "紫藤", en: "Violet", ja: "バイオレット", ru: "Фиолет" } },
  { id: "ocean", label: { zh: "深海", en: "Ocean", ja: "オーシャン", ru: "Океан" } },
  { id: "slate", label: { zh: "石墨", en: "Slate", ja: "スレート", ru: "Сланец" } }
];

const ANNOUNCEMENTS = [
  {
    version: "1.0.1",
    date: "2026-04-07",
    type: "patch",
    title: {
      zh: "1.0.1 可用性修复",
      en: "1.0.1 Usability Fixes",
      ja: "1.0.1 使いやすさ修正",
      ru: "1.0.1 Исправления удобства"
    },
    summary: {
      zh: "调整 rembg 模型、修复 Plato 图像返回解析、优化报错可读性并精简主界面装饰。",
      en: "Adjusts the rembg model, fixes Plato image response parsing, improves error readability, and simplifies UI decoration.",
      ja: "rembg モデルを調整し、Plato の画像応答解析を修正、エラー可読性を改善し、UI 装飾を整理しました。",
      ru: "Настроена модель rembg, исправлен разбор графического ответа Plato, улучшена читаемость ошибок и упрощены декоративные элементы UI."
    },
    bullets: {
      zh: [
        "rembg 默认改为 isnet-anime，并支持通过配置切换模型。",
        "Plato 兼容完整 /chat/completions 地址，并可解析 markdown 图片链接返回。",
        "浅色模式下的错误区域颜色重做，并新增一键复制错误信息按钮。",
        "移除多余圆角浅蓝装饰和中部大圆图形，主界面更干净。"
      ],
      en: [
        "rembg now defaults to isnet-anime and stays configurable through the environment.",
        "Plato now supports a full /chat/completions endpoint and parses markdown image links.",
        "Error blocks were redesigned for light mode and now include a one-click copy button.",
        "Extra rounded cyan decorations and the central circle graphic were removed for a cleaner layout."
      ],
      ja: [
        "rembg のデフォルトを isnet-anime に変更し、設定で切り替え可能にしました。",
        "Plato は完全な /chat/completions エンドポイントに対応し、markdown 画像リンクを解析できます。",
        "ライトモードのエラー表示を見やすくし、ワンクリックコピーも追加しました。",
        "余計な丸いシアン装飾と中央の円形グラフィックを削除し、画面を整理しました。"
      ],
      ru: [
        "rembg теперь по умолчанию использует isnet-anime и остается настраиваемым через окружение.",
        "Plato поддерживает полный endpoint /chat/completions и умеет разбирать markdown-ссылки на изображения.",
        "Блоки ошибок переработаны для светлой темы и получили кнопку копирования в один клик.",
        "Убраны лишние голубые скругленные украшения и центральный круг, интерфейс стал чище."
      ]
    }
  },
  {
    version: "1.0.0",
    date: "2026-04-07",
    type: "major",
    title: {
      zh: "1.0.0 正式版",
      en: "1.0.0 Official Release",
      ja: "1.0.0 正式リリース",
      ru: "1.0.0 Официальный релиз"
    },
    summary: {
      zh: "加入持久化工作流、即时输出预览、详细错误排查、多语言设置与新版界面。",
      en: "Adds persisted workflows, progressive outputs, detailed debugging, multilingual settings, and the refreshed UI.",
      ja: "ワークフロー永続化、段階的な出力表示、詳細なデバッグ、多言語設定、新しいUIを追加しました。",
      ru: "Добавлены сохранение workflow, поэтапный вывод, подробная отладка, многоязычные настройки и обновленный интерфейс."
    },
    bullets: {
      zh: [
        "每个步骤完成后立即写入工作流快照并显示结果，不再等整条流程结束。",
        "错误信息现在包含 step、provider、接口状态和调试字段，便于定位问题。",
        "新增设置面板，支持深色/浅色模式、7 套样式主题与中日英俄四种语言。",
        "加入公告与关于页面，并补充 GitHub 快速跳转。"
      ],
      en: [
        "Each finished step now writes a workflow snapshot and surfaces its output immediately.",
        "Errors now include the step, provider, HTTP state, and debug fields for faster diagnosis.",
        "A new settings panel adds light and dark modes, 7 accent themes, and Chinese/Japanese/English/Russian UI.",
        "Announcement and about sections are now built in with direct GitHub links."
      ],
      ja: [
        "各ステップ完了時にワークフロースナップショットを保存し、結果を即時表示するようになりました。",
        "エラーには step、provider、HTTP 状態、debug 情報が含まれ、原因を追いやすくなりました。",
        "設定パネルでライト/ダーク、7 色テーマ、中国語/日本語/英語/ロシア語を切り替えできます。",
        "お知らせと About セクションを追加し、GitHub への導線も用意しました。"
      ],
      ru: [
        "После завершения каждого шага сохраняется снимок workflow и результат сразу появляется в интерфейсе.",
        "Ошибки теперь содержат шаг, провайдера, HTTP-статус и debug-поля для быстрой диагностики.",
        "Добавлена панель настроек: светлая/темная тема, 7 цветовых стилей и UI на китайском, японском, английском и русском.",
        "Появились разделы с объявлениями и информацией о проекте, а также быстрые ссылки на GitHub."
      ]
    }
  },
  {
    version: "0.1.2",
    date: "2026-04-07",
    type: "minor",
    title: {
      zh: "0.1.2 抠图与提示词增强",
      en: "0.1.2 Cutout and Prompt Upgrade",
      ja: "0.1.2 切り抜きとプロンプト強化",
      ru: "0.1.2 Улучшение вырезания и промптов"
    },
    summary: {
      zh: "引入 rembg 做本地抠图，并将 CG 场景改为随机且贴合角色。",
      en: "Introduces local rembg cutout and makes CG scenes randomized and character-aware.",
      ja: "ローカル rembg 切り抜きと、キャラクターに合うランダム CG シーンを導入しました。",
      ru: "Добавлены локальный rembg для вырезания и случайные CG-сцены, подходящие персонажу."
    },
    bullets: {
      zh: [
        "remove_background 改为 rembg，本地输出透明背景 PNG。",
        "表情提示词统一强调角色一致性与透明背景边缘干净。",
        "CG 提示词从固定书房改为随机场景池，并要求结合角色气质设计场景。"
      ],
      en: [
        "remove_background now uses rembg and returns a transparent PNG locally.",
        "Expression prompts now enforce identity consistency and clean transparent edges.",
        "CG prompts moved from fixed library scenes to a randomized scene pool aligned with the character."
      ],
      ja: [
        "remove_background が rembg ベースになり、透過 PNG をローカル生成します。",
        "表情プロンプトはキャラクター一貫性と綺麗な透過エッジをより強く指定します。",
        "CG プロンプトは固定の書斎から、キャラ性に合うランダムシーンへ変更しました。"
      ],
      ru: [
        "Шаг remove_background теперь использует rembg и локально возвращает PNG с прозрачным фоном.",
        "Промпты выражений усилены требованиями к сохранению идентичности и чистым прозрачным краям.",
        "CG-промпты больше не используют фиксированную библиотеку сцен, а выбирают случайную сцену под образ персонажа."
      ]
    }
  },
  {
    version: "0.1.1",
    date: "2026-04-06",
    type: "minor",
    title: {
      zh: "0.1.1 动态前端原型",
      en: "0.1.1 Dynamic Frontend Prototype",
      ja: "0.1.1 動的フロントエンド試作",
      ru: "0.1.1 Динамический фронтенд-прототип"
    },
    summary: {
      zh: "静态页面被替换为 React 前端，可轮询工作流状态并展示输出。",
      en: "The static page was replaced with a React frontend that polls workflow status and renders outputs.",
      ja: "静的ページを React フロントエンドに置き換え、ワークフロー状態のポーリングと出力表示に対応しました。",
      ru: "Статичная страница заменена React-фронтендом с опросом статуса workflow и показом результатов."
    },
    bullets: {
      zh: [
        "接入 Vite + React，支持上传、轮询、结果卡片预览。",
        "前后端分离开发，根目录可统一启动。",
        "输出 manifest 和 provider 信息，方便调试。"
      ],
      en: [
        "Introduced Vite + React for upload, polling, and output card previews.",
        "Frontend and backend can now run separately while still being launched from the repo root.",
        "Manifest and provider metadata were added for easier debugging."
      ],
      ja: [
        "Vite + React を導入し、アップロード、ポーリング、結果カード表示に対応しました。",
        "フロントエンドとバックエンドを分離しつつ、リポジトリルートから起動できます。",
        "manifest と provider 情報を追加し、デバッグしやすくしました。"
      ],
      ru: [
        "Добавлены Vite + React для загрузки, опроса и предпросмотра результатов в карточках.",
        "Фронтенд и бэкенд можно запускать раздельно, но также удобно стартовать из корня репозитория.",
        "Для отладки добавлены manifest и метаданные провайдера."
      ]
    }
  },
  {
    version: "0.1.0",
    date: "2026-04-06",
    type: "init",
    title: {
      zh: "0.1.0 初始原型",
      en: "0.1.0 Initial Prototype",
      ja: "0.1.0 初期プロトタイプ",
      ru: "0.1.0 Начальный прототип"
    },
    summary: {
      zh: "建立首个公开仓库结构，并打通基础工作流原型。",
      en: "Set up the first public repository structure and the baseline workflow prototype.",
      ja: "最初の公開リポジトリ構成とベースラインのワークフロープロトタイプを作成しました。",
      ru: "Создана первая публичная структура репозитория и базовый прототип workflow."
    },
    bullets: {
      zh: [
        "完成 README、路线图、Phase 1 规格与 prompts 文档。",
        "搭建上传、扣图、3 个表情和 2 个 CG 的服务端骨架。",
        "提供 mock provider，保证本地无真实 API 时也能演示。"
      ],
      en: [
        "Added the README, roadmap, phase-1 spec, and prompt documentation.",
        "Scaffolded the server pipeline for upload, cutout, 3 expressions, and 2 CG outputs.",
        "Included a mock provider so the prototype could still be demonstrated without live APIs."
      ],
      ja: [
        "README、ロードマップ、Phase 1 仕様、プロンプト文書を追加しました。",
        "アップロード、切り抜き、3 表情、2 CG のサーバーパイプライン骨格を構築しました。",
        "実 API がなくてもデモできるように mock provider を用意しました。"
      ],
      ru: [
        "Добавлены README, roadmap, спецификация phase-1 и документация по промптам.",
        "Подготовлен серверный конвейер для загрузки, вырезания, 3 выражений и 2 CG-результатов.",
        "Добавлен mock-провайдер, чтобы прототип можно было демонстрировать без реальных API."
      ]
    }
  }
];

const UI = {
  zh: {
    appName: "Character Workflow Agent",
    heroTitle: "单图进，多资产出",
    heroText: "上传一张带背景的角色图，系统会依次完成校验、抠图、3 个表情差分和 2 张贴合角色的 CG 场景图。",
    workflowBadge: "Workflow Agent",
    settings: "设置",
    settingsTitle: "项目设置",
    appearance: "样式",
    language: "语言",
    announcements: "公告",
    about: "关于",
    mode: "模式",
    light: "浅色",
    dark: "深色",
    colorStyle: "配色样式",
    currentVersion: "当前版本",
    uploadTitle: "开始新的工作流",
    uploadText: "建议上传单人、主体完整、五官与服装清晰可见的 PNG、JPG 或 WEBP 图片。",
    chooseImage: "角色图片",
    chooseHint: "支持 PNG / JPG / WEBP，建议单人立绘或清晰半身图。",
    startWorkflow: "开始工作流",
    starting: "正在启动...",
    idleMessage: "上传一张角色图开始。",
    workflowTitle: "工作流进度",
    outputsTitle: "阶段输出",
    outputsHint: "每一步成功后会立刻出现在这里，不用等整条流程结束。",
    noWorkflow: "还没有开始任何工作流。",
    noOutputs: "暂无输出，步骤一旦成功就会立即显示。",
    manifest: "结果清单",
    openManifest: "打开 manifest.json",
    openFile: "打开文件",
    latestError: "最近错误",
    debugDetails: "调试详情",
    sourceInfo: "输入信息",
    providerInfo: "执行通道",
    providerCutout: "抠图",
    providerExpressions: "表情",
    providerCg: "CG",
    footer: "Copyright © 2026 Mirako Company. Developed by Hanazar Ochikawa.",
    authorLabel: "作者",
    authorName: "Hanazar Ochikawa",
    aboutText: "这是一个把单张角色图转换成可复用角色资产的工作流原型。当前重点是先把 cutout、表情差分、CG 场景图与调试体验打磨稳定。",
    personalGithub: "个人 GitHub",
    projectGithub: "项目仓库",
    annLatest: "最新公告",
    annHistory: "历史版本",
    chooseFile: "选择文件",
    copyError: "复制报错",
    copied: "已复制",
    stepLabels: {
      validate_input: "输入校验",
      remove_background: "背景去除",
      expression_thinking: "思考表情",
      expression_surprise: "惊讶表情",
      expression_angry: "生气表情",
      cg_01: "CG 场景 01",
      cg_02: "CG 场景 02"
    },
    statuses: {
      queued: "排队中",
      running: "执行中",
      success: "成功",
      failed: "失败"
    },
    networkStartError: "无法启动工作流：前端没有拿到后端响应。请确认服务端已运行在 http://localhost:3001，且 Vite 代理没有被改动。",
    networkFetchError: "无法获取最新工作流状态：请求没有到达后端。请检查本地服务、代理配置或浏览器控制台。",
    sectionSummary: "完成步骤",
    livePreview: "即时预览"
  },
  en: {
    appName: "Character Workflow Agent",
    heroTitle: "One image in, reusable assets out",
    heroText: "Upload a single character image with background and the workflow will validate it, cut it out, generate 3 expression variants, and produce 2 character-fitting CG scenes.",
    workflowBadge: "Workflow Agent",
    settings: "Settings",
    settingsTitle: "Project Settings",
    appearance: "Appearance",
    language: "Language",
    announcements: "Announcements",
    about: "About",
    mode: "Mode",
    light: "Light",
    dark: "Dark",
    colorStyle: "Color Style",
    currentVersion: "Current Version",
    uploadTitle: "Start a New Workflow",
    uploadText: "For the best result, upload a single-character image with clear facial features and visible outfit details in PNG, JPG, or WEBP.",
    chooseImage: "Character Image",
    chooseHint: "PNG / JPG / WEBP supported. Clear full-body or half-body character art works best.",
    startWorkflow: "Start Workflow",
    starting: "Starting...",
    idleMessage: "Upload one character image to begin.",
    workflowTitle: "Workflow Progress",
    outputsTitle: "Step Outputs",
    outputsHint: "Outputs appear here as soon as each step succeeds. You do not need to wait for the whole pipeline to finish.",
    noWorkflow: "No workflow has started yet.",
    noOutputs: "No outputs yet. The first finished step will appear immediately.",
    manifest: "Result Manifest",
    openManifest: "Open manifest.json",
    openFile: "Open file",
    latestError: "Latest Error",
    debugDetails: "Debug Details",
    sourceInfo: "Source",
    providerInfo: "Execution Providers",
    providerCutout: "Cutout",
    providerExpressions: "Expressions",
    providerCg: "CG",
    footer: "Copyright © 2026 Mirako Company. Developed by Hanazar Ochikawa.",
    authorLabel: "Author",
    authorName: "Hanazar Ochikawa",
    aboutText: "This is a workflow prototype focused on turning one character image into reusable character assets. The current goal is to make cutout, expression variants, CG scenes, and debugging stable and practical.",
    personalGithub: "Personal GitHub",
    projectGithub: "Project Repository",
    annLatest: "Latest Announcement",
    annHistory: "Version History",
    chooseFile: "Choose File",
    copyError: "Copy Error",
    copied: "Copied",
    stepLabels: {
      validate_input: "Validate Input",
      remove_background: "Remove Background",
      expression_thinking: "Thinking Expression",
      expression_surprise: "Surprise Expression",
      expression_angry: "Angry Expression",
      cg_01: "CG Scene 01",
      cg_02: "CG Scene 02"
    },
    statuses: {
      queued: "Queued",
      running: "Running",
      success: "Success",
      failed: "Failed"
    },
    networkStartError: "Could not start the workflow because the frontend did not receive a response from the backend. Make sure the server is running on http://localhost:3001 and the Vite proxy is intact.",
    networkFetchError: "Could not fetch the latest workflow state because the request did not reach the backend. Check the local server, proxy settings, or browser console.",
    sectionSummary: "Completed Steps",
    livePreview: "Live Preview"
  },
  ja: {
    appName: "Character Workflow Agent",
    heroTitle: "1 枚の画像から再利用可能な資産へ",
    heroText: "背景付きのキャラクター画像を 1 枚アップロードすると、検証、切り抜き、3 つの表情差分、2 枚のキャラ適合 CG シーンを順番に生成します。",
    workflowBadge: "Workflow Agent",
    settings: "設定",
    settingsTitle: "プロジェクト設定",
    appearance: "スタイル",
    language: "言語",
    announcements: "お知らせ",
    about: "About",
    mode: "モード",
    light: "ライト",
    dark: "ダーク",
    colorStyle: "カラースタイル",
    currentVersion: "現在のバージョン",
    uploadTitle: "新しいワークフローを開始",
    uploadText: "最良の結果のため、顔と衣装がはっきり見える単一キャラクターの PNG、JPG、WEBP をアップロードしてください。",
    chooseImage: "キャラクター画像",
    chooseHint: "PNG / JPG / WEBP 対応。全身または上半身がはっきりした画像がおすすめです。",
    startWorkflow: "ワークフロー開始",
    starting: "開始中...",
    idleMessage: "キャラクター画像を 1 枚アップロードしてください。",
    workflowTitle: "ワークフロー進行",
    outputsTitle: "ステップ出力",
    outputsHint: "各ステップが成功するとすぐにここへ表示されます。全体完了を待つ必要はありません。",
    noWorkflow: "まだワークフローは開始されていません。",
    noOutputs: "まだ出力はありません。最初に成功したステップからすぐ表示されます。",
    manifest: "結果マニフェスト",
    openManifest: "manifest.json を開く",
    openFile: "ファイルを開く",
    latestError: "最新エラー",
    debugDetails: "デバッグ詳細",
    sourceInfo: "入力情報",
    providerInfo: "実行プロバイダ",
    providerCutout: "切り抜き",
    providerExpressions: "表情",
    providerCg: "CG",
    footer: "Copyright © 2026 Mirako Company. Developed by Hanazar Ochikawa.",
    authorLabel: "作者",
    authorName: "Hanazar Ochikawa",
    aboutText: "このプロトタイプは、1 枚のキャラクター画像を再利用可能な資産へ変換するワークフローを目指しています。現在は cutout、表情差分、CG シーン、デバッグ体験の安定化を重視しています。",
    personalGithub: "個人 GitHub",
    projectGithub: "プロジェクト GitHub",
    annLatest: "最新のお知らせ",
    annHistory: "履歴バージョン",
    chooseFile: "ファイルを選択",
    copyError: "エラーをコピー",
    copied: "コピー済み",
    stepLabels: {
      validate_input: "入力検証",
      remove_background: "背景除去",
      expression_thinking: "思考表情",
      expression_surprise: "驚き表情",
      expression_angry: "怒り表情",
      cg_01: "CG シーン 01",
      cg_02: "CG シーン 02"
    },
    statuses: {
      queued: "待機中",
      running: "実行中",
      success: "成功",
      failed: "失敗"
    },
    networkStartError: "フロントエンドがバックエンド応答を受け取れず、ワークフローを開始できませんでした。http://localhost:3001 でサーバーが動作し、Vite プロキシ設定が変わっていないか確認してください。",
    networkFetchError: "最新のワークフロー状態を取得できませんでした。リクエストがバックエンドに届いていません。ローカルサーバー、プロキシ設定、ブラウザコンソールを確認してください。",
    sectionSummary: "完了ステップ",
    livePreview: "ライブプレビュー"
  },
  ru: {
    appName: "Character Workflow Agent",
    heroTitle: "Одно изображение на входе, готовые ассеты на выходе",
    heroText: "Загрузите одно изображение персонажа с фоном, и workflow по шагам выполнит проверку, вырезание, 3 варианта выражений и 2 CG-сцены, подходящие герою.",
    workflowBadge: "Workflow Agent",
    settings: "Настройки",
    settingsTitle: "Настройки проекта",
    appearance: "Стиль",
    language: "Язык",
    announcements: "Объявления",
    about: "О проекте",
    mode: "Режим",
    light: "Светлый",
    dark: "Темный",
    colorStyle: "Цветовой стиль",
    currentVersion: "Текущая версия",
    uploadTitle: "Запустить новый workflow",
    uploadText: "Для лучшего результата загрузите изображение с одним персонажем, где хорошо видны лицо и одежда, в формате PNG, JPG или WEBP.",
    chooseImage: "Изображение персонажа",
    chooseHint: "Поддерживаются PNG / JPG / WEBP. Лучше всего подходит четкий арт по пояс или в полный рост.",
    startWorkflow: "Запустить workflow",
    starting: "Запуск...",
    idleMessage: "Загрузите одно изображение персонажа, чтобы начать.",
    workflowTitle: "Ход workflow",
    outputsTitle: "Результаты шагов",
    outputsHint: "Результаты появляются здесь сразу после успешного шага. Ждать конца всего пайплайна не нужно.",
    noWorkflow: "Workflow еще не запускался.",
    noOutputs: "Пока результатов нет. Первый успешный шаг появится сразу.",
    manifest: "Манифест результата",
    openManifest: "Открыть manifest.json",
    openFile: "Открыть файл",
    latestError: "Последняя ошибка",
    debugDetails: "Подробности отладки",
    sourceInfo: "Источник",
    providerInfo: "Провайдеры выполнения",
    providerCutout: "Вырезание",
    providerExpressions: "Выражения",
    providerCg: "CG",
    footer: "Copyright © 2026 Mirako Company. Developed by Hanazar Ochikawa.",
    authorLabel: "Автор",
    authorName: "Hanazar Ochikawa",
    aboutText: "Это прототип workflow, который превращает одно изображение персонажа в набор переиспользуемых ассетов. Сейчас основной акцент на стабильности cutout, вариаций выражений, CG-сцен и удобной отладки.",
    personalGithub: "Личный GitHub",
    projectGithub: "Репозиторий проекта",
    annLatest: "Последнее объявление",
    annHistory: "История версий",
    chooseFile: "Выбрать файл",
    copyError: "Скопировать ошибку",
    copied: "Скопировано",
    stepLabels: {
      validate_input: "Проверка входа",
      remove_background: "Удаление фона",
      expression_thinking: "Выражение: раздумье",
      expression_surprise: "Выражение: удивление",
      expression_angry: "Выражение: злость",
      cg_01: "CG-сцена 01",
      cg_02: "CG-сцена 02"
    },
    statuses: {
      queued: "В очереди",
      running: "Выполняется",
      success: "Успешно",
      failed: "Ошибка"
    },
    networkStartError: "Не удалось запустить workflow: фронтенд не получил ответ от бэкенда. Убедитесь, что сервер работает на http://localhost:3001 и прокси Vite не изменен.",
    networkFetchError: "Не удалось получить актуальное состояние workflow: запрос не дошел до бэкенда. Проверьте локальный сервер, прокси или консоль браузера.",
    sectionSummary: "Завершенные шаги",
    livePreview: "Мгновенный предпросмотр"
  }
};

function toAssetUrl(url) {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${window.location.origin}${url}`;
}

function normalizeErrorMessage(error, fallback) {
  if (error instanceof TypeError && String(error.message).includes("Failed to fetch")) {
    return fallback;
  }

  return error.message || fallback;
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { error: text || `Unexpected response with status ${response.status}.` };
}

async function startWorkflow(file, t) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/workflows", {
    method: "POST",
    body: formData
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error || t.networkStartError);
  }

  return payload.workflow;
}

async function fetchWorkflow(workflowId, t) {
  const response = await fetch(`/api/workflows/${workflowId}`);
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error || t.networkFetchError);
  }

  return payload;
}

function readStoredValue(key, fallback) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch (_error) {
    return fallback;
  }
}

function writeStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (_error) {
    return null;
  }

  return null;
}

function renderDebugEntries(debug) {
  if (!debug || typeof debug !== "object") {
    return [];
  }

  return Object.entries(debug).filter(([, value]) => value !== null && value !== undefined && value !== "");
}

async function copyText(value) {
  if (!value) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (_error) {
    return false;
  }
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [message, setMessage] = useState({ type: "info", text: UI.zh.idleMessage });
  const [submitting, setSubmitting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("appearance");
  const [language, setLanguage] = useState(() => readStoredValue("cwa-language", "zh"));
  const [mode, setMode] = useState(() => readStoredValue("cwa-mode", "dark"));
  const [accent, setAccent] = useState(() => readStoredValue("cwa-accent", "cyan"));
  const [selectedAnnouncement, setSelectedAnnouncement] = useState("1.0.1");
  const [copiedErrorKey, setCopiedErrorKey] = useState("");

  const t = UI[language] || UI.zh;

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    writeStoredValue("cwa-mode", mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    writeStoredValue("cwa-accent", accent);
  }, [accent]);

  useEffect(() => {
    writeStoredValue("cwa-language", language);
    setMessage((current) => {
      if (!current?.text || current.text === UI.zh.idleMessage || current.text === UI.en.idleMessage) {
        return { type: "info", text: (UI[language] || UI.zh).idleMessage };
      }
      return current;
    });
  }, [language]);

  useEffect(() => {
    if (!workflow?.id) {
      return undefined;
    }

    if (workflow.status === "completed" || workflow.status === "failed") {
      return undefined;
    }

    const timer = setInterval(async () => {
      try {
        const latest = await fetchWorkflow(workflow.id, t);
        setWorkflow(latest);

        if (latest.status === "completed") {
          setMessage({ type: "success", text: language === "zh" ? "工作流已完成。" : t.statuses.success });
        }

        if (latest.status === "failed") {
          setMessage({ type: "error", text: latest.error || t.networkFetchError });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: normalizeErrorMessage(error, t.networkFetchError)
        });
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [workflow?.id, workflow?.status, t, language]);

  const outputs = workflow?.outputs;

  const outputCards = useMemo(() => {
    if (!outputs) {
      return [];
    }

    return [
      { title: language === "zh" ? "抠图结果" : language === "ja" ? "切り抜き結果" : language === "ru" ? "Вырезание" : "Cutout", url: outputs.cutout },
      { title: t.stepLabels.expression_thinking, url: outputs.expressions?.thinking },
      { title: t.stepLabels.expression_surprise, url: outputs.expressions?.surprise },
      { title: t.stepLabels.expression_angry, url: outputs.expressions?.angry },
      { title: t.stepLabels.cg_01, url: outputs.cg_outputs?.[0] },
      { title: t.stepLabels.cg_02, url: outputs.cg_outputs?.[1] }
    ].filter((item) => Boolean(item.url));
  }, [outputs, language, t.stepLabels]);

  const selectedAnnouncementData = ANNOUNCEMENTS.find((entry) => entry.version === selectedAnnouncement) || ANNOUNCEMENTS[0];

  async function handleCopyError(copyKey, text) {
    const ok = await copyText(text);
    if (!ok) {
      return;
    }

    setCopiedErrorKey(copyKey);
    window.setTimeout(() => {
      setCopiedErrorKey((current) => (current === copyKey ? "" : current));
    }, 1600);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage({
        type: "error",
        text: language === "zh" ? "请先选择一张图片。" : language === "ja" ? "先に画像を選択してください。" : language === "ru" ? "Сначала выберите изображение." : "Please choose an image first."
      });
      return;
    }

    try {
      setSubmitting(true);
      setWorkflow(null);
      setMessage({
        type: "info",
        text: language === "zh" ? "正在启动工作流..." : language === "ja" ? "ワークフローを開始しています..." : language === "ru" ? "Workflow запускается..." : "Starting workflow..."
      });
      const created = await startWorkflow(selectedFile, t);
      setWorkflow(created);
      setMessage({
        type: "info",
        text: language === "zh" ? "工作流已启动，结果会随步骤即时刷新。" : language === "ja" ? "ワークフローを開始しました。各ステップ結果は即時更新されます。" : language === "ru" ? "Workflow запущен. Результаты будут появляться по мере завершения шагов." : "Workflow started. Results will appear as soon as each step finishes."
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: normalizeErrorMessage(error, t.networkStartError)
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <main className="page">
        <header className="topbar panel glass">
          <div className="brand-block">
            <div>
              <h1>{t.appName}</h1>
              <p>{t.heroText}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="version-pill">v{APP_VERSION}</span>
            <button type="button" className="secondary-button" onClick={() => setSettingsOpen(true)}>
              {t.settings}
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <article className="panel hero-card">
            <div className="hero-copy">
              <h2>{t.heroTitle}</h2>
              <p>{t.heroText}</p>
              <div className="hero-metrics">
                <div>
                  <strong>6</strong>
                  <span>{language === "zh" ? "目标输出" : language === "ja" ? "出力数" : language === "ru" ? "выходов" : "outputs"}</span>
                </div>
                <div>
                  <strong>rembg</strong>
                  <span>{language === "zh" ? "本地抠图" : language === "ja" ? "ローカル切り抜き" : language === "ru" ? "локальный cutout" : "local cutout"}</span>
                </div>
                <div>
                  <strong>AI</strong>
                  <span>{language === "zh" ? "表情与 CG" : language === "ja" ? "表情と CG" : language === "ru" ? "выражения и CG" : "expressions + CG"}</span>
                </div>
              </div>
            </div>
          </article>

          <article className="panel upload-card">
            <h2>{t.uploadTitle}</h2>
            <p>{t.uploadText}</p>
            <form className="upload-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="image">{t.chooseImage}</label>
                <div className="file-picker">
                  <label className="file-trigger" htmlFor="image">
                    {t.chooseFile}
                  </label>
                  <span className="file-name">{selectedFile ? selectedFile.name : t.chooseHint}</span>
                  <input
                    id="image"
                    className="file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    disabled={submitting}
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting}>
                {submitting ? t.starting : t.startWorkflow}
              </button>
            </form>
            <p className={`message ${message.type}`}>{message.text}</p>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel workflow-panel">
            <div className="panel-heading">
              <div>
                <h2>{t.workflowTitle}</h2>
              </div>
              {workflow ? <span className={`status-chip ${workflow.status}`}>{t.statuses[workflow.status] || workflow.status}</span> : null}
            </div>

            {!workflow ? <p className="muted">{t.noWorkflow}</p> : null}
            {workflow ? (
              <>
                <div className="meta-grid">
                  <div className="meta-card">
                    <span>Workflow ID</span>
                    <strong>{workflow.id}</strong>
                  </div>
                  <div className="meta-card">
                    <span>{t.sourceInfo}</span>
                    <strong>{workflow.source_image?.original_name || "-"}</strong>
                  </div>
                  <div className="meta-card">
                    <span>{t.providerInfo}</span>
                    <strong>{workflow.current_step || "-"}</strong>
                  </div>
                </div>

                <ul className="steps">
                  {STEP_ORDER.map((stepName) => {
                    const step = workflow.steps?.[stepName] || { status: "queued" };
                    const debugEntries = renderDebugEntries(step.debug);

                    return (
                      <li className={`step ${step.status}`} key={stepName}>
                        <div className="step-main">
                          <div>
                            <strong>{t.stepLabels[stepName] || stepName}</strong>
                            <p>{step.provider || "-"}</p>
                          </div>
                          <span>{t.statuses[step.status] || step.status}</span>
                        </div>
                        {step.output_url ? (
                          <a className="step-link" href={toAssetUrl(step.output_url)} target="_blank" rel="noreferrer">
                            {t.openFile}
                          </a>
                        ) : null}
                        {step.error ? (
                          <div className="error-stack">
                            <div className="error-toolbar">
                              <button
                                type="button"
                                className="copy-button"
                                onClick={() => handleCopyError(`step-${stepName}`, step.error)}
                              >
                                {copiedErrorKey === `step-${stepName}` ? t.copied : t.copyError}
                              </button>
                            </div>
                            <pre className="step-error">{step.error}</pre>
                          </div>
                        ) : null}
                        {debugEntries.length ? (
                          <details className="debug-panel">
                            <summary>{t.debugDetails}</summary>
                            <div className="debug-grid">
                              {debugEntries.map(([key, value]) => (
                                <div key={`${stepName}-${key}`} className="debug-row">
                                  <span>{key}</span>
                                  <code>{String(value)}</code>
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}
          </article>

          <article className="panel outputs-panel">
            <div className="panel-heading">
              <div>
                <h2>{t.outputsTitle}</h2>
              </div>
            </div>

            <p className="muted strong-muted">{t.outputsHint}</p>

            {outputs?.providers ? (
              <div className="provider-row">
                <span className="provider-pill">{t.providerCutout}: {outputs.providers.remove_background || "-"}</span>
                <span className="provider-pill">{t.providerExpressions}: {outputs.providers.expressions || "-"}</span>
                <span className="provider-pill">{t.providerCg}: {outputs.providers.cg || "-"}</span>
              </div>
            ) : null}

            {outputs?.manifest ? (
              <p className="manifest-link">
                {t.manifest}: {" "}
                <a href={toAssetUrl(outputs.manifest)} target="_blank" rel="noreferrer">
                  {t.openManifest}
                </a>
              </p>
            ) : null}

            {workflow?.error ? (
              <section className="error-box">
                <h3>{t.latestError}</h3>
                <div className="error-toolbar">
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => handleCopyError("workflow", workflow.error)}
                  >
                    {copiedErrorKey === "workflow" ? t.copied : t.copyError}
                  </button>
                </div>
                <pre>{workflow.error}</pre>
                {renderDebugEntries(workflow.error_details).length ? (
                  <details className="debug-panel" open>
                    <summary>{t.debugDetails}</summary>
                    <div className="debug-grid">
                      {renderDebugEntries(workflow.error_details).map(([key, value]) => (
                        <div key={key} className="debug-row">
                          <span>{key}</span>
                          <code>{String(value)}</code>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </section>
            ) : null}

            {outputCards.length === 0 ? <p className="muted">{t.noOutputs}</p> : null}
            <div className="grid">
              {outputCards.map((card) => (
                <article className="output-card" key={card.title}>
                  <div className="output-card-header">
                    <h3>{card.title}</h3>
                    <a href={toAssetUrl(card.url)} target="_blank" rel="noreferrer">
                      {t.openFile}
                    </a>
                  </div>
                  <img src={toAssetUrl(card.url)} alt={card.title} />
                </article>
              ))}
            </div>
          </article>
        </section>

        <footer className="footer">{t.footer}</footer>
      </main>

      {settingsOpen ? (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <section className="settings-modal panel glass" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <div>
                <h2>{t.settingsTitle}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setSettingsOpen(false)}>
                ×
              </button>
            </div>

            <div className="settings-layout">
              <nav className="settings-nav">
                {[
                  ["appearance", t.appearance],
                  ["language", t.language],
                  ["announcements", t.announcements],
                  ["about", t.about]
                ].map(([tabId, label]) => (
                  <button
                    key={tabId}
                    type="button"
                    className={tabId === settingsTab ? "nav-item active" : "nav-item"}
                    onClick={() => setSettingsTab(tabId)}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              <div className="settings-content">
                {settingsTab === "appearance" ? (
                  <div className="settings-section">
                    <div className="settings-block">
                      <h3>{t.mode}</h3>
                      <div className="choice-row">
                        <button type="button" className={mode === "light" ? "choice active" : "choice"} onClick={() => setMode("light")}>{t.light}</button>
                        <button type="button" className={mode === "dark" ? "choice active" : "choice"} onClick={() => setMode("dark")}>{t.dark}</button>
                      </div>
                    </div>
                    <div className="settings-block">
                      <h3>{t.colorStyle}</h3>
                      <div className="palette-grid">
                        {COLOR_STYLES.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={item.id === accent ? `palette-chip ${item.id} active` : `palette-chip ${item.id}`}
                            onClick={() => setAccent(item.id)}
                          >
                            <span className="palette-dot" />
                            <span>{item.label[language] || item.label.zh}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="settings-block version-card">
                      <h3>{t.currentVersion}</h3>
                      <p>v{APP_VERSION}</p>
                    </div>
                  </div>
                ) : null}

                {settingsTab === "language" ? (
                  <div className="settings-section">
                    <div className="palette-grid language-grid">
                      {[
                        ["zh", "中文"],
                        ["ja", "日本語"],
                        ["en", "English"],
                        ["ru", "Русский"]
                      ].map(([langId, label]) => (
                        <button
                          key={langId}
                          type="button"
                          className={langId === language ? "choice active" : "choice"}
                          onClick={() => setLanguage(langId)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {settingsTab === "announcements" ? (
                  <div className="settings-section announcements-layout">
                    <div className="announcement-list">
                      {ANNOUNCEMENTS.map((entry) => (
                        <button
                          key={entry.version}
                          type="button"
                          className={entry.version === selectedAnnouncement ? "announcement-item active" : "announcement-item"}
                          onClick={() => setSelectedAnnouncement(entry.version)}
                        >
                          <span>{entry.date}</span>
                          <strong>{entry.version}</strong>
                          <small>{entry.summary[language] || entry.summary.zh}</small>
                        </button>
                      ))}
                    </div>
                    <article className="announcement-detail">
                      <h3>{selectedAnnouncementData.title[language] || selectedAnnouncementData.title.zh}</h3>
                      <p>{selectedAnnouncementData.summary[language] || selectedAnnouncementData.summary.zh}</p>
                      <ul>
                        {(selectedAnnouncementData.bullets[language] || selectedAnnouncementData.bullets.zh).map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </article>
                  </div>
                ) : null}

                {settingsTab === "about" ? (
                  <div className="settings-section">
                    <div className="about-card">
                      <h3>{t.authorLabel}: {t.authorName}</h3>
                      <p>{t.aboutText}</p>
                      <div className="choice-row about-links">
                        <a className="choice link-button" href={PERSONAL_GITHUB_URL} target="_blank" rel="noreferrer">{t.personalGithub}</a>
                        <a className="choice link-button" href={PROJECT_GITHUB_URL} target="_blank" rel="noreferrer">{t.projectGithub}</a>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
