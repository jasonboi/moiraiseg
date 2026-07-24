const LABELS = ["vessel", "lesion"];
const BATCH_PREVIEW_LIMIT = 8;
const BATCH_EDIT_DEFAULT_LIMIT = 3;
const DEFAULT_SAM2_BEFORE_FRAMES = 4;
const DEFAULT_SAM2_AFTER_FRAMES = 16;
const LANGUAGE_STORAGE_KEY = "dataseg-language";
const ENGLISH_TEXT = {
  "English": "中文",
  "切换为英文": "Switch to Chinese",
  "Mask 编辑画布": "Mask editing canvas",
  "等待图像": "Waiting for image",
  "血管 Mask": "Vessel Mask",
  "肿瘤 Mask": "Lesion Mask",
  "添加 Mask 方式": "Mask drawing mode",
  "套索": "Lasso",
  "画笔": "Brush",
  "橡皮 ·": "Eraser ·",
  "血管": "Vessel",
  "肿瘤": "Lesion",
  "按住并沿边界圈画，松开后自动闭合并填充。": "Hold and trace the boundary. Release to close and fill.",
  "沿目标边界圈画，松开后自动闭合并填充。": "Trace the target boundary. Release to close and fill.",
  "按住鼠标直接填涂，适合横断面和局部补画。": "Hold the pointer to paint cross-sections or make local corrections.",
  "显示血管": "Show vessel",
  "显示肿瘤": "Show lesion",
  "画笔 / 橡皮大小": "Brush / eraser size",
  "画笔或橡皮大小": "Brush or eraser size",
  "缩放": "Zoom",
  "适应": "Fit",
  "片段": "Clip",
  "帧": "Frame",
  "选择片段": "Select clip",
  "选择帧": "Select frame",
  "选择片段后跳到首张待审核帧，也可直接选择帧。": "Choose a clip to open its first pending frame, or select a frame directly.",
  "已跳转到所选片段": "Opened the selected clip",
  "已跳转到所选帧": "Opened the selected frame",
  "帧 —": "Frame —",
  "帧已选": "frames selected",
  "文件": "File",
  "序号": "Position",
  "← 上一张": "← Previous",
  "下一张 →": "Next →",
  "批量审核 8 帧": "Review 8 frames",
  "SAM2 传播血管": "Propagate vessel with SAM2",
  "仅保存当前帧": "Save current frame",
  "保存并下一张": "Save and continue",
  "撤销": "Undo",
  "恢复预识别 Mask": "Restore candidate Mask",
  "隐藏/显示": "Hide/show",
  "清空全部": "Clear all",
  "当前路径": "Current path",
  "本地数据集": "Local dataset",
  "已处理 / 总数": "Processed / total",
  "待审核": "Pending",
  "已审核": "Reviewed",
  "关闭批量审核": "Close batch review",
  "连续帧候选 Mask": "Candidate Masks for consecutive frames",
  "批量审核": "Batch review",
  "关闭": "Close",
  "逐张查看叠加效果。只勾选无需修改的帧，有误的帧取消勾选并留到单帧微调。": "Check each overlay. Select only frames that need no correction. Leave inaccurate frames unselected for single-frame editing.",
  "全选": "Select all",
  "全不选": "Select none",
  "通过选中帧": "Accept selected frames",
  "预览内微调 · 只在确认后写入": "Preview editing · saved only after confirmation",
  "← 上一帧": "← Previous frame",
  "下一帧 →": "Next frame →",
  "返回批量预览": "Return to batch preview",
  "微调添加 Mask 方式": "Mask editing mode",
  "橡皮擦": "Eraser",
  "拖动画面": "Pan",
  "预览画笔或橡皮大小": "Preview brush or eraser size",
  "预览缩放": "Preview zoom",
  "恢复本次预览": "Restore this preview",
  "隐藏 Mask": "Hide Mask",
  "显示 Mask": "Show Mask",
  "微调结果尚未写入": "Edits have not been saved",
  "完成微调并返回预览": "Finish editing and return",
  "编辑工具": "Editing tools",
  "笔刷大小": "Brush size",
  "Mask 显示": "Mask visibility",
  "当前图像": "Current image",
  "视图": "View",
  "正在载入": "Loading",
  "未保存修改": "Unsaved changes",
  "已同步": "Synced",
  "正在保存…": "Saving…",
  "本批次只标注血管，lesion 已由后端固定为全黑": "This project labels vessels only. The backend keeps lesion Masks empty.",
  "当前修改还没有保存，确定离开这张图吗？": "The current changes are unsaved. Leave this image?",
  "正在载入图像和 Mask…": "Loading image and Masks…",
  "已载入保存后的审核 Mask": "Loaded the saved reviewed Mask",
  "已载入预识别 Mask": "Loaded the candidate Mask",
  "当前已审核帧有新修改，请先按 Enter 保存，再从待审核帧开始批量操作": "This reviewed frame has unsaved changes. Press Enter to save before starting a batch from a pending frame.",
  "当前片段后面没有待审核帧": "There are no pending frames later in this clip.",
  "正在加载连续帧预览…": "Loading consecutive-frame previews…",
  "SAM2 返回了未知的 Mask 类别": "SAM2 returned an unknown Mask label.",
  "本项目只标注血管，不能传播肿瘤 Mask": "This project labels vessels only, so lesion Masks cannot be propagated.",
  "当前已审核帧有新修改，请先按 S 保存，再按 P 传播": "This reviewed frame has unsaved changes. Press S to save, then P to propagate.",
  "SAM2 关键帧传播失败": "SAM2 keyframe propagation failed.",
  "没有可以批量审核的候选帧。": "No candidate frames are available for batch review.",
  "关键帧": "Keyframe",
  "已审核参考": "Reviewed reference",
  "已微调": "Edited",
  "选择": "Select",
  "放大微调": "Open editor",
  "放大查看": "Open viewer",
  "只读参考": "Read-only reference",
  "Mask 微调": "Mask editing",
  "这张帧已经审核，只供放大对照，不能修改或再次保存。": "This frame is already reviewed. It is read-only and shown for comparison.",
  "拖动画面不会修改 Mask。": "Panning does not change the Mask.",
  "已微调并勾选，返回后会显示标记": "Edited and selected. A marker will appear in the preview.",
  "人工关键帧": "Manual keyframe",
  "双向传播": "bidirectional propagation",
  "正在写入…": "Saving…",
  "预览里还有未保存的微调，确定关闭并丢弃吗？": "The preview contains unsaved edits. Close and discard them?",
  "SAM2 传播": "SAM2 propagation",
  "批量": "batch",
  "批量审核失败": "Batch review failed.",
  "套索区域太小，请按住并沿目标边界圈画": "The lasso area is too small. Hold and trace the target boundary.",
  "已套索填充": "Lasso filled ",
  "已画笔填涂": "Brush painted ",
  "已擦除": "Erased ",
  "没有可以撤销的笔画": "There are no strokes to undo.",
  "已撤销上一笔": "Undid the previous stroke.",
  "已恢复当前帧的预识别 Mask": "Restored the candidate Mask for this frame.",
  "已清空当前帧的全部 Mask，按 S 保存当前帧，Enter 保存并下一张": "Cleared all Masks on this frame. Press S to save here or Enter to save and continue.",
  "正在写入标定图片和 Mask…": "Saving the annotated image and Masks…",
  "保存失败": "Save failed.",
  "上一张已保存并标记为已审核": "The previous frame was saved and marked as reviewed.",
  "当前帧已保存，可按 B 继续批量预览": "The current frame was saved. Press B to continue batch preview.",
  "正在准备审核数据": "Preparing review data",
  "读取原图、预识别 Mask 和审核进度…": "Loading source images, candidate Masks, and review progress…",
  "无法读取审核清单": "Could not load the review manifest.",
  "浏览器页面属于另一个标定项目，请从 DataSeg 启动器重新打开。": "This page belongs to a different annotation project. Reopen it from the DataSeg launcher.",
  "审核工具启动失败": "Review tool failed to start",
};
const originalText = new WeakMap();
const originalAttributes = new WeakMap();

function languageLabel(label) {
  return label === "肿瘤" ? "lesion" : "vessel";
}

function englishDynamicText(value) {
  const exact = ENGLISH_TEXT[value];
  if (exact) return exact;
  const rules = [
    [/^按住鼠标擦除(血管|肿瘤) Mask。$/, (match, label) => `Hold the pointer to erase the ${languageLabel(label)} Mask.`],
    [/^SAM2 传播(血管|肿瘤)$/, (match, label) => `Propagate ${languageLabel(label)} with SAM2`],
    [/^(\d+) 帧已选$/, "$1 frames selected"],
    [/^帧 (\d+)$/, "Frame $1"],
    [/^(选择|已审核参考)帧 (\d+)$/, (match, action, frame) => `${action === "选择" ? "Select" : "Reviewed reference"} frame ${frame}`],
    [/^帧 (\d+) · (只读参考|Mask 微调)$/, (match, frame, mode) => `Frame ${frame} · ${ENGLISH_TEXT[mode]}`],
    [/^放大(微调|查看)帧 (\d+)$/, (match, action, frame) => `${action === "微调" ? "Edit" : "View"} frame ${frame}`],
    [/^(.*) 第 (\d+) 帧候选 Mask$/, (match, clip, frame) => `${clip}, candidate Mask for frame ${frame}`],
    [/^正在用套索添加(血管|肿瘤) Mask。所有修改先保存在本次预览中。$/, (match, label) => `Adding the ${languageLabel(label)} Mask with the lasso. Changes stay in this preview until confirmed.`],
    [/^正在用画笔填涂(血管|肿瘤) Mask。所有修改先保存在本次预览中。$/, (match, label) => `Painting the ${languageLabel(label)} Mask. Changes stay in this preview until confirmed.`],
    [/^正在擦除(血管|肿瘤) Mask。所有修改先保存在本次预览中。$/, (match, label) => `Erasing the ${languageLabel(label)} Mask. Changes stay in this preview until confirmed.`],
    [/^当前(血管|肿瘤) Mask 为空。请先用套索或画笔标出目标，再按 P 传播$/, (match, label) => `The current ${languageLabel(label)} Mask is empty. Mark the target with the lasso or brush, then press P.`],
    [/^正在传播当前帧(血管|肿瘤) Mask…$/, (match, label) => `Propagating the current ${languageLabel(label)} Mask…`],
    [/^SAM2 (血管|肿瘤)传播预览$/, (match, label) => `SAM2 ${languageLabel(label)} propagation preview`],
    [/^人工关键帧 · (血管|肿瘤)双向传播$/, (match, label) => `Manual keyframe · bidirectional ${languageLabel(label)} propagation`],
    [/^SAM2 已从当前关键帧向前 (\d+) 帧、向后 (\d+) 帧传播(血管|肿瘤) Mask。另一类 Mask 保留每帧原有内容。已审核帧只供对照且不会被覆盖，请取消勾选边界不准的帧。$/, (match, before, after, label) => `SAM2 propagated the ${languageLabel(label)} Mask ${before} previous frames and ${after} following frames from the current keyframe. The other Mask label keeps each frame's existing content. Reviewed frames are read-only and will not be overwritten. Unselect frames with inaccurate boundaries.`],
    [/^已按相同像素位置静态套用 (\d+) 次操作，默认只选择前 (\d+) 帧。它不会跟踪目标边界，请取消勾选错位帧。$/, "Applied $1 operations at the same pixel positions. Only the first $2 frames are selected by default. This mode does not track target boundaries, so unselect misaligned frames."],
    [/^通过选中 (\d+) 帧$/, "Accept $1 selected frames"],
    [/^确认保存这 (\d+) 帧(SAM2 传播|批量)预览中的 Mask 吗？(.*)$/s, (match, count, mode, warning) => `Save the Masks from these ${count} ${mode === "SAM2 传播" ? "SAM2 propagation" : "batch"} preview frames?${englishText(warning)}`],
    [/^\n另有 (\d+) 张已微调帧未勾选，这些修改会被丢弃。$/, "\n$1 edited frames are not selected. Their changes will be discarded."],
    [/^已保存 (\d+) 帧 SAM2 (血管|肿瘤)传播 Mask，取消勾选的帧仍保留待审核$/, (match, count, label) => `Saved SAM2 ${languageLabel(label)} Masks for ${count} frames. Unselected frames remain pending.`],
    [/^已批量保存 (\d+) 帧，取消勾选的帧仍保留待审核$/, "Saved $1 frames in the batch. Unselected frames remain pending."],
    [/^(已套索填充|已画笔填涂|已擦除)(血管|肿瘤) Mask，按 Enter 保存$/, (match, action, label) => `${ENGLISH_TEXT[action]}${languageLabel(label)} Mask. Press Enter to save.`],
  ];
  for (const [pattern, replacement] of rules) {
    if (pattern.test(value)) return value.replace(pattern, replacement);
  }
  return value;
}

function englishText(value) {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return value;
  return `${match[1]}${englishDynamicText(match[2])}${match[3]}`;
}

function translateElementAttributes(element) {
  const attributes = ["aria-label", "title", "placeholder"];
  let originals = originalAttributes.get(element);
  for (const name of attributes) {
    if (!element.hasAttribute(name)) continue;
    const value = element.getAttribute(name);
    const translated = englishText(value);
    if (translated === value) continue;
    if (!originals) {
      originals = {};
      originalAttributes.set(element, originals);
    }
    originals[name] = value;
    element.setAttribute(name, translated);
  }
}

function translateTree(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    const translated = englishText(root.nodeValue);
    if (translated !== root.nodeValue) {
      originalText.set(root, root.nodeValue);
      root.nodeValue = translated;
    }
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateElementAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
  while (walker.nextNode()) {
    if (walker.currentNode.nodeType === Node.TEXT_NODE) {
      const translated = englishText(walker.currentNode.nodeValue);
      if (translated !== walker.currentNode.nodeValue) {
        originalText.set(walker.currentNode, walker.currentNode.nodeValue);
        walker.currentNode.nodeValue = translated;
      }
    } else {
      translateElementAttributes(walker.currentNode);
    }
  }
}

function restoreChineseTree(root) {
  if (!root) return;
  const restore = (node) => {
    if (node.nodeType === Node.TEXT_NODE && originalText.has(node)) {
      node.nodeValue = originalText.get(node);
      originalText.delete(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const originals = originalAttributes.get(node);
      if (originals) {
        for (const [name, value] of Object.entries(originals)) {
          node.setAttribute(name, value);
        }
        originalAttributes.delete(node);
      }
    }
  };
  restore(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
  while (walker.nextNode()) restore(walker.currentNode);
}

const state = {
  language: localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "zh-CN",
  manifest: null,
  index: 0,
  currentItem: null,
  sourceImage: null,
  masks: { vessel: null, lesion: null },
  history: [],
  dirty: false,
  loading: false,
  saving: false,
  activeLabel: "vessel",
  tool: "lasso",
  addTool: "lasso",
  brushSize: 24,
  zoom: 1,
  overlayVisible: { vessel: true, lesion: true },
  displayCanvas: null,
  stage: null,
  viewport: null,
  drawing: false,
  lastPoint: null,
  gestureLabel: null,
  lassoPoints: [],
  strokePoints: [],
  pendingOperations: [],
  batch: {
    mode: "static",
    propagatedLabel: "vessel",
    requestId: 0,
    open: false,
    loading: false,
    saving: false,
    items: [],
    selected: new Set(),
    error: "",
    editor: {
      open: false,
      position: 0,
      activeLabel: "vessel",
      tool: "lasso",
      addTool: "lasso",
      brushSize: 24,
      zoom: 1,
      maskVisible: true,
      history: [],
      drawing: false,
      panning: false,
      lastPoint: null,
      gestureLabel: null,
      lassoPoints: [],
      strokePoints: [],
      panStart: null,
      scrollStart: null,
    },
  },
  status: { text: "", tone: "" },
};

const app = document.querySelector("#app");
const languageObserver = new MutationObserver((records) => {
  if (state.language !== "en") return;
  for (const record of records) {
    if (record.type === "characterData") {
      translateTree(record.target);
    } else {
      record.addedNodes.forEach(translateTree);
    }
  }
});
languageObserver.observe(app, {
  childList: true,
  characterData: true,
  subtree: true,
});

function applyLanguage() {
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  document.title = state.language === "en"
    ? "DataSeg Vessel and Lesion Annotation"
    : "DataSeg 血管与肿瘤标定";
  if (state.language === "en") {
    translateTree(app);
  } else {
    restoreChineseTree(app);
  }
}

function toggleLanguage() {
  state.language = state.language === "en" ? "zh-CN" : "en";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  applyLanguage();
}

function projectHeaders() {
  return {
    "Content-Type": "application/json",
    "X-DataSeg-Project": state.manifest?.project_id || "",
  };
}

function sam2BeforeFrames() {
  return Number.isInteger(state.manifest?.sam2_before_frames)
    ? state.manifest.sam2_before_frames
    : DEFAULT_SAM2_BEFORE_FRAMES;
}

function sam2AfterFrames() {
  return Number.isInteger(state.manifest?.sam2_after_frames)
    ? state.manifest.sam2_after_frames
    : DEFAULT_SAM2_AFTER_FRAMES;
}

function labelDisplayName(label) {
  return label === "lesion" ? "肿瘤" : "血管";
}

function canvasMarkup() {
  return `
    <section class="canvas-panel" aria-label="Mask 编辑画布">
      <div class="canvas-hud">
        <span class="dirty-dot" data-bind="dirty-dot"></span>
        <span data-bind="canvas-status">等待图像</span>
      </div>
      <div class="viewport" data-role="viewport">
        <div class="stage-wrap">
          <div class="stage" data-role="stage">
            <canvas id="review-canvas"></canvas>
          </div>
        </div>
      </div>
    </section>`;
}

function toolsMarkup() {
  return `
    <div class="tool-stack">
      <button class="tool-button vessel" data-action="label" data-label="vessel">
        <span class="tool-dot"></span><span>血管 Mask <kbd>1</kbd></span>
      </button>
      <button class="tool-button lesion" data-action="label" data-label="lesion">
        <span class="tool-dot"></span><span>肿瘤 Mask <kbd>2</kbd></span>
      </button>
      <div class="mode-selector" aria-label="添加 Mask 方式">
        <button class="plain-button" data-action="tool" data-tool="lasso">套索 <kbd>Q</kbd></button>
        <button class="plain-button" data-action="tool" data-tool="paint">画笔 <kbd>W</kbd></button>
      </div>
      <button class="tool-button eraser" data-action="tool" data-tool="erase">
        <span class="tool-dot"></span><span>橡皮 · <b data-bind="eraser-label">血管</b> <kbd>E</kbd></span>
      </button>
      <p class="tool-help" data-bind="tool-help">按住并沿边界圈画，松开后自动闭合并填充。</p>
    </div>`;
}

function togglesMarkup() {
  return `
    <div class="toggle-list">
      <label class="toggle-row">
        <span class="toggle-name"><span class="toggle-swatch vessel"></span>显示血管</span>
        <input type="checkbox" data-toggle-label="vessel" checked />
      </label>
      <label class="toggle-row">
        <span class="toggle-name"><span class="toggle-swatch lesion"></span>显示肿瘤</span>
        <input type="checkbox" data-toggle-label="lesion" checked />
      </label>
    </div>`;
}

function brushMarkup() {
  return `
    <div class="range-group">
      <div class="range-head"><span>画笔 / 橡皮大小</span><span class="range-value" data-bind="brush-value">24 px</span></div>
      <input type="range" min="1" max="100" value="24" data-control="brush" aria-label="画笔或橡皮大小" />
    </div>`;
}

function zoomMarkup() {
  return `
    <div class="range-group">
      <div class="range-head"><span>缩放</span><span class="range-value" data-bind="zoom-value">100%</span></div>
      <input type="range" min="25" max="400" step="5" value="100" data-control="zoom" aria-label="缩放" />
    </div>
    <div class="zoom-controls">
      <button class="plain-button" data-action="zoom-out">−</button>
      <button class="plain-button" data-action="zoom-fit">适应</button>
      <button class="plain-button" data-action="zoom-in">＋</button>
    </div>`;
}

function metadataMarkup() {
  return `
    <dl class="meta-list">
      <div class="meta-row meta-picker-row">
        <dt><label for="image-clip-picker">片段</label></dt>
        <dd class="meta-picker-value">
          <select id="image-clip-picker" class="meta-select" data-control="image-clip" aria-label="选择片段"></select>
        </dd>
      </div>
      <div class="meta-row meta-picker-row">
        <dt><label for="image-frame-picker">帧</label></dt>
        <dd class="meta-picker-value">
          <select id="image-frame-picker" class="meta-select" data-control="image-frame" aria-label="选择帧"></select>
        </dd>
      </div>
      <div class="meta-row"><dt>文件</dt><dd data-bind="filename">—</dd></div>
      <div class="meta-row"><dt>序号</dt><dd data-bind="position">—</dd></div>
    </dl>
    <p class="meta-picker-help">选择片段后跳到首张待审核帧，也可直接选择帧。</p>`;
}

function navigationMarkup() {
  return `
    <div class="navigation-controls">
      <button class="plain-button" data-action="previous">← 上一张</button>
      <button class="plain-button" data-action="next">下一张 →</button>
    </div>
    <button class="plain-button batch-open-button" data-action="batch-open">
      批量审核 8 帧 <kbd>B</kbd>
    </button>
    <button class="plain-button propagation-open-button" data-action="sam2-propagate">
      SAM2 传播血管 <kbd>P</kbd>
    </button>`;
}

function saveMarkup() {
  return `
    <button class="plain-button save-stay-button" data-action="save-stay">仅保存当前帧 <kbd>S</kbd></button>
    <button class="save-button" data-action="save">保存并下一张 <kbd>Enter</kbd></button>
    <div class="status-line" data-bind="status"></div>`;
}

function quickActionsMarkup() {
  return `
    <div class="quick-actions">
      <button class="plain-button" data-action="undo">撤销</button>
      <button class="plain-button" data-action="reset">恢复预识别 Mask</button>
      <button class="plain-button" data-action="toggle-all">隐藏/显示 <kbd>M</kbd></button>
      <button class="plain-button danger" data-action="clear-all">清空全部 <kbd>X</kbd></button>
    </div>`;
}

function headerMarkup(compact = false) {
  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-label">当前路径</span>
        <p class="dataset-path" data-bind="dataset-root" title="本地数据集">本地数据集</p>
      </div>
      <div class="header-metrics">
        <button class="language-button" data-action="language" aria-label="切换为英文">English</button>
        <div class="metric">
          <span class="metric-label">已处理 / 总数</span>
          <span class="metric-value"><span data-bind="processed">0</span> / <span data-bind="total">0</span></span>
          ${compact ? "" : '<div class="progress-track"><div class="progress-fill" data-bind="progress-fill"></div></div>'}
        </div>
        <span class="badge pending" data-bind="review-badge">待审核</span>
      </div>
    </header>`;
}

function batchReviewMarkup() {
  return `
    <div class="batch-modal" data-role="batch-modal" hidden>
      <button class="batch-backdrop" data-action="batch-close" aria-label="关闭批量审核"></button>
      <section class="batch-dialog" role="dialog" aria-modal="true" aria-labelledby="batch-title">
        <div class="batch-overview" data-role="batch-overview">
          <header class="batch-header">
            <div>
              <p class="batch-eyebrow" data-bind="batch-eyebrow">连续帧候选 Mask</p>
              <h2 id="batch-title" data-bind="batch-title">批量审核</h2>
            </div>
            <button class="batch-close-button" data-action="batch-close" aria-label="关闭">×</button>
          </header>
          <p class="batch-guidance" data-bind="batch-guidance">逐张查看叠加效果。只勾选无需修改的帧，有误的帧取消勾选并留到单帧微调。</p>
          <div class="batch-grid" data-role="batch-grid"></div>
          <p class="batch-error" data-bind="batch-error"></p>
          <footer class="batch-footer">
            <div class="batch-selection"><strong data-bind="batch-count">0</strong> 帧已选</div>
            <div class="batch-footer-actions">
              <button class="plain-button" data-action="batch-select-all">全选</button>
              <button class="plain-button" data-action="batch-clear">全不选</button>
              <button class="save-button batch-accept-button" data-action="batch-accept">通过选中帧</button>
            </div>
          </footer>
        </div>
        <section class="batch-editor" data-role="batch-editor" hidden>
          <header class="batch-editor-header">
            <div>
              <p class="batch-eyebrow">预览内微调 · 只在确认后写入</p>
              <h2 data-bind="batch-editor-title">帧 —</h2>
            </div>
            <div class="batch-editor-navigation">
              <button class="plain-button" data-action="batch-editor-previous">← 上一帧</button>
              <span data-bind="batch-editor-position">0 / 0</span>
              <button class="plain-button" data-action="batch-editor-next">下一帧 →</button>
              <button class="batch-close-button" data-action="batch-editor-done" aria-label="返回批量预览">×</button>
            </div>
          </header>
          <div class="batch-editor-body">
            <aside class="batch-editor-tools">
              <button class="tool-button vessel" data-action="batch-editor-label" data-label="vessel">
                <span class="tool-dot"></span><span>血管 Mask <kbd>1</kbd></span>
              </button>
              <button class="tool-button lesion" data-action="batch-editor-label" data-label="lesion">
                <span class="tool-dot"></span><span>肿瘤 Mask <kbd>2</kbd></span>
              </button>
              <div class="mode-selector" aria-label="微调添加 Mask 方式">
                <button class="plain-button" data-action="batch-editor-tool" data-tool="lasso">套索 <kbd>Q</kbd></button>
                <button class="plain-button" data-action="batch-editor-tool" data-tool="paint">画笔 <kbd>W</kbd></button>
              </div>
              <button class="tool-button eraser" data-action="batch-editor-tool" data-tool="erase">
                <span class="tool-dot"></span><span>橡皮擦 <kbd>E</kbd></span>
              </button>
              <button class="tool-button pan" data-action="batch-editor-tool" data-tool="pan">
                <span class="tool-dot"></span><span>拖动画面 <kbd>Space</kbd></span>
              </button>
              <div class="range-group">
                <div class="range-head"><span>画笔 / 橡皮大小</span><span class="range-value" data-bind="batch-editor-brush">24 px</span></div>
                <input type="range" min="1" max="100" value="24" data-control="batch-editor-brush" aria-label="预览画笔或橡皮大小" />
              </div>
              <div class="range-group">
                <div class="range-head"><span>缩放</span><span class="range-value" data-bind="batch-editor-zoom">100%</span></div>
                <input type="range" min="25" max="400" step="5" value="100" data-control="batch-editor-zoom" aria-label="预览缩放" />
              </div>
              <div class="zoom-controls">
                <button class="plain-button" data-action="batch-editor-zoom-out">−</button>
                <button class="plain-button" data-action="batch-editor-zoom-fit">适应</button>
                <button class="plain-button" data-action="batch-editor-zoom-in">＋</button>
              </div>
              <div class="batch-editor-quick-actions">
                <button class="plain-button" data-action="batch-editor-undo">撤销 <kbd>Ctrl+Z</kbd></button>
                <button class="plain-button" data-action="batch-editor-reset">恢复本次预览</button>
                <button class="plain-button" data-action="batch-editor-toggle-mask">
                  <span data-bind="batch-editor-mask-toggle">隐藏 Mask</span> <kbd>M</kbd>
                </button>
              </div>
              <p class="batch-editor-notice" data-bind="batch-editor-notice"></p>
            </aside>
            <div class="batch-editor-viewport" data-role="batch-editor-viewport">
              <canvas id="batch-editor-canvas"></canvas>
            </div>
          </div>
          <footer class="batch-editor-footer">
            <span data-bind="batch-editor-status">微调结果尚未写入</span>
            <button class="save-button" data-action="batch-editor-done">完成微调并返回预览</button>
          </footer>
        </section>
      </section>
    </div>`;
}

function renderReviewer() {
  return `
    <div class="app-shell reviewer-layout">
      ${headerMarkup()}
      <main class="workspace">
        <aside class="panel tool-rail">
          <section class="rail-section"><h2 class="panel-title">编辑工具</h2>${toolsMarkup()}</section>
          <section class="rail-section"><h2 class="panel-title">笔刷大小</h2>${brushMarkup()}</section>
          <section class="rail-section"><h2 class="panel-title">Mask 显示</h2>${togglesMarkup()}</section>
          <section class="rail-section">${quickActionsMarkup()}</section>
        </aside>
        ${canvasMarkup()}
        <aside class="panel info-rail">
          <section class="rail-section"><h2 class="panel-title">当前图像</h2>${metadataMarkup()}</section>
          <section class="rail-section"><h2 class="panel-title">视图</h2>${zoomMarkup()}</section>
          <section class="rail-section">${navigationMarkup()}${saveMarkup()}</section>
        </aside>
      </main>
    </div>
    ${batchReviewMarkup()}`;
}

function buildReviewer() {
  app.innerHTML = renderReviewer();
  state.displayCanvas = document.querySelector("#review-canvas");
  state.stage = document.querySelector('[data-role="stage"]');
  state.viewport = document.querySelector('[data-role="viewport"]');
  wireControls();
  wireCanvas();
  wireBatchEditorCanvas();
  syncUi();
  applyZoom();
  renderCanvas();
  applyLanguage();
}

function all(selector) {
  return [...document.querySelectorAll(selector)];
}

function setBoundText(name, value) {
  all(`[data-bind="${name}"]`).forEach((element) => {
    element.textContent = value;
  });
}

function itemsInClip(clip) {
  return state.manifest?.items.filter((item) => item.clip === clip) || [];
}

function replaceSelectOptions(select, entries) {
  select.replaceChildren(
    ...entries.map(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      return option;
    }),
  );
}

function syncImagePickers() {
  const clipPicker = document.querySelector('[data-control="image-clip"]');
  const framePicker = document.querySelector('[data-control="image-frame"]');
  if (!clipPicker || !framePicker || !state.manifest) return;

  const clips = [...new Set(state.manifest.items.map((item) => item.clip))];
  if (clipPicker.options.length !== clips.length) {
    replaceSelectOptions(
      clipPicker,
      clips.map((clip) => ({ value: clip, label: clip })),
    );
  }

  const item = state.currentItem;
  const disabled = !item || state.loading || state.saving;
  clipPicker.disabled = disabled;
  framePicker.disabled = disabled;
  if (!item) return;

  clipPicker.value = item.clip;
  if (framePicker.dataset.clip !== item.clip) {
    replaceSelectOptions(
      framePicker,
      itemsInClip(item.clip).map((clipItem) => ({
        value: String(clipItem.index),
        label: String(clipItem.frame_index).padStart(5, "0"),
      })),
    );
    framePicker.dataset.clip = item.clip;
  }
  framePicker.value = String(item.index);
}

async function jumpToImage(index, message) {
  if (!Number.isInteger(index) || index === state.index) {
    syncImagePickers();
    return;
  }
  const loaded = await loadItem(index, false, message);
  if (!loaded) syncImagePickers();
}

function wireControls() {
  all('[data-action="language"]').forEach((button) => {
    button.addEventListener("click", toggleLanguage);
  });
  all('[data-action="label"]').forEach((button) => {
    button.addEventListener("click", () => selectLabel(button.dataset.label));
  });
  all('[data-action="tool"]').forEach((button) => {
    button.addEventListener("click", () => setDrawTool(button.dataset.tool));
  });
  all("[data-toggle-label]").forEach((input) => {
    input.addEventListener("change", () => {
      state.overlayVisible[input.dataset.toggleLabel] = input.checked;
      renderCanvas();
      syncUi();
    });
  });
  all('[data-control="brush"]').forEach((input) => {
    input.addEventListener("input", () => setBrushSize(Number(input.value)));
  });
  all('[data-control="zoom"]').forEach((input) => {
    input.addEventListener("input", () => setZoom(Number(input.value) / 100));
  });
  all('[data-control="image-clip"]').forEach((select) => {
    select.addEventListener("change", () => {
      const clipItems = itemsInClip(select.value);
      const target = clipItems.find((item) => !item.reviewed) || clipItems[0];
      if (target) jumpToImage(target.index, "已跳转到所选片段");
    });
  });
  all('[data-control="image-frame"]').forEach((select) => {
    select.addEventListener("change", () => {
      jumpToImage(Number(select.value), "已跳转到所选帧");
    });
  });
  all('[data-action="zoom-in"]').forEach((button) => button.addEventListener("click", () => setZoom(state.zoom * 1.15)));
  all('[data-action="zoom-out"]').forEach((button) => button.addEventListener("click", () => setZoom(state.zoom / 1.15)));
  all('[data-action="zoom-fit"]').forEach((button) => button.addEventListener("click", fitZoom));
  all('[data-action="previous"]').forEach((button) => button.addEventListener("click", () => navigate(-1)));
  all('[data-action="next"]').forEach((button) => button.addEventListener("click", () => navigate(1)));
  all('[data-action="save-stay"]').forEach((button) =>
    button.addEventListener("click", () => saveCurrent(false)),
  );
  all('[data-action="save"]').forEach((button) =>
    button.addEventListener("click", () => saveCurrent(true)),
  );
  all('[data-action="undo"]').forEach((button) => button.addEventListener("click", undo));
  all('[data-action="reset"]').forEach((button) => button.addEventListener("click", resetToCandidate));
  all('[data-action="toggle-all"]').forEach((button) => button.addEventListener("click", toggleAllMasks));
  all('[data-action="clear-all"]').forEach((button) => button.addEventListener("click", clearAllMasks));
  all('[data-action="batch-open"]').forEach((button) => button.addEventListener("click", openBatchReview));
  all('[data-action="sam2-propagate"]').forEach((button) => button.addEventListener("click", openSam2Propagation));
  all('[data-action="batch-close"]').forEach((button) =>
    button.addEventListener("click", () => closeBatchReview(false)),
  );
  all('[data-action="batch-select-all"]').forEach((button) => button.addEventListener("click", selectAllBatchItems));
  all('[data-action="batch-clear"]').forEach((button) => button.addEventListener("click", clearBatchSelection));
  all('[data-action="batch-accept"]').forEach((button) => button.addEventListener("click", acceptBatchCandidates));
  all('[data-action="batch-editor-done"]').forEach((button) => button.addEventListener("click", closeBatchEditor));
  all('[data-action="batch-editor-previous"]').forEach((button) =>
    button.addEventListener("click", () => moveBatchEditor(-1)),
  );
  all('[data-action="batch-editor-next"]').forEach((button) =>
    button.addEventListener("click", () => moveBatchEditor(1)),
  );
  all('[data-action="batch-editor-label"]').forEach((button) =>
    button.addEventListener("click", () =>
      selectBatchEditorLabel(button.dataset.label),
    ),
  );
  all('[data-action="batch-editor-tool"]').forEach((button) =>
    button.addEventListener("click", () => setBatchEditorTool(button.dataset.tool)),
  );
  all('[data-action="batch-editor-undo"]').forEach((button) =>
    button.addEventListener("click", undoBatchEditor),
  );
  all('[data-action="batch-editor-reset"]').forEach((button) =>
    button.addEventListener("click", resetBatchEditorMask),
  );
  all('[data-action="batch-editor-toggle-mask"]').forEach((button) =>
    button.addEventListener("click", toggleBatchEditorMask),
  );
  all('[data-action="batch-editor-zoom-in"]').forEach((button) =>
    button.addEventListener("click", () => setBatchEditorZoom(state.batch.editor.zoom * 1.15)),
  );
  all('[data-action="batch-editor-zoom-out"]').forEach((button) =>
    button.addEventListener("click", () => setBatchEditorZoom(state.batch.editor.zoom / 1.15)),
  );
  all('[data-action="batch-editor-zoom-fit"]').forEach((button) =>
    button.addEventListener("click", fitBatchEditorZoom),
  );
  all('[data-control="batch-editor-brush"]').forEach((input) =>
    input.addEventListener("input", () => {
      state.batch.editor.brushSize = Math.max(1, Math.min(100, Number(input.value)));
      syncBatchEditorUi();
    }),
  );
  all('[data-control="batch-editor-zoom"]').forEach((input) =>
    input.addEventListener("input", () => setBatchEditorZoom(Number(input.value) / 100)),
  );
}

function wireCanvas() {
  if (!state.displayCanvas) return;
  state.displayCanvas.addEventListener("pointerdown", beginStroke);
  state.displayCanvas.addEventListener("pointermove", continueStroke);
  state.displayCanvas.addEventListener("pointerup", endStroke);
  state.displayCanvas.addEventListener("pointercancel", cancelGesture);
  state.viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      setZoom(state.zoom * (event.deltaY < 0 ? 1.1 : 0.9));
    },
    { passive: false },
  );
}

function wireBatchEditorCanvas() {
  const canvas = document.querySelector("#batch-editor-canvas");
  const viewport = document.querySelector('[data-role="batch-editor-viewport"]');
  if (!canvas || !viewport) return;
  canvas.addEventListener("pointerdown", beginBatchEditorGesture);
  canvas.addEventListener("pointermove", continueBatchEditorGesture);
  canvas.addEventListener("pointerup", endBatchEditorGesture);
  canvas.addEventListener("pointercancel", cancelBatchEditorGesture);
  viewport.addEventListener(
    "wheel",
    (event) => {
      if (!state.batch.editor.open) return;
      event.preventDefault();
      setBatchEditorZoom(
        state.batch.editor.zoom * (event.deltaY < 0 ? 1.1 : 0.9),
      );
    },
    { passive: false },
  );
}

function syncUi() {
  if (!state.manifest) return;
  const item = state.currentItem;
  setBoundText("processed", state.manifest.processed);
  setBoundText("total", state.manifest.total);
  setBoundText("dataset-root", state.manifest.dataset_root);
  all('[data-bind="dataset-root"]').forEach((element) => {
    element.title = state.manifest.dataset_root;
  });
  setBoundText("brush-value", `${state.brushSize} px`);
  setBoundText("zoom-value", `${Math.round(state.zoom * 100)}%`);
  setBoundText("eraser-label", state.activeLabel === "vessel" ? "血管" : "肿瘤");
  setBoundText(
    "tool-help",
    state.tool === "lasso"
      ? "沿目标边界圈画，松开后自动闭合并填充。"
      : state.tool === "paint"
      ? "按住鼠标直接填涂，适合横断面和局部补画。"
      : `按住鼠标擦除${state.activeLabel === "vessel" ? "血管" : "肿瘤"} Mask。`,
  );
  setBoundText("status", state.status.text);
  all('[data-bind="status"]').forEach((element) => {
    element.classList.toggle("error", state.status.tone === "error");
    element.classList.toggle("success", state.status.tone === "success");
  });
  all('[data-bind="progress-fill"]').forEach((element) => {
    const percent = state.manifest.total ? (state.manifest.processed / state.manifest.total) * 100 : 0;
    element.style.width = `${percent}%`;
  });
  if (item) {
    setBoundText("filename", item.source_name);
    setBoundText("position", `${item.index + 1} / ${state.manifest.total}`);
    setBoundText("canvas-status", state.loading ? "正在载入" : state.dirty ? "未保存修改" : "已同步");
    all('[data-bind="review-badge"]').forEach((element) => {
      element.textContent = item.reviewed ? "已审核" : "待审核";
      element.classList.toggle("reviewed", item.reviewed);
      element.classList.toggle("pending", !item.reviewed);
    });
  }
  syncImagePickers();
  all('[data-bind="dirty-dot"]').forEach((element) => element.classList.toggle("active", state.dirty));
  all('[data-action="label"]').forEach((button) => {
    button.classList.toggle("active", button.dataset.label === state.activeLabel);
    button.disabled =
      state.loading ||
      state.saving ||
      (state.manifest.vessel_only && button.dataset.label === "lesion");
  });
  all('[data-action="tool"]').forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === state.tool);
    button.disabled = state.loading || state.saving;
  });
  all("[data-toggle-label]").forEach((input) => {
    input.checked = state.overlayVisible[input.dataset.toggleLabel];
    input.disabled =
      state.manifest.vessel_only && input.dataset.toggleLabel === "lesion";
  });
  all('[data-control="brush"]').forEach((input) => {
    input.value = String(state.brushSize);
  });
  all('[data-control="zoom"]').forEach((input) => {
    input.value = String(Math.round(state.zoom * 100));
  });
  all('[data-action="save"]').forEach((button) => {
    button.disabled = state.loading || state.saving;
    button.innerHTML = state.saving ? "正在保存…" : "保存并下一张 <kbd>Enter</kbd>";
  });
  all('[data-action="save-stay"]').forEach((button) => {
    button.disabled = state.loading || state.saving;
    button.innerHTML = state.saving ? "正在保存…" : "仅保存当前帧 <kbd>S</kbd>";
  });
  all('[data-action="batch-open"]').forEach((button) => {
    button.disabled = state.loading || state.saving;
  });
  all('[data-action="sam2-propagate"]').forEach((button) => {
    button.disabled = state.loading || state.saving || state.batch.loading || state.batch.saving;
    button.innerHTML = `SAM2 传播${labelDisplayName(state.activeLabel)} <kbd>P</kbd>`;
  });
  syncBatchUi();
}

function setStatus(text, tone = "") {
  state.status = { text, tone };
  syncUi();
}

function setBrushSize(value) {
  state.brushSize = Math.max(1, Math.min(100, Math.round(value)));
  syncUi();
}

function selectLabel(label) {
  if (!LABELS.includes(label)) return;
  if (state.manifest?.vessel_only && label === "lesion") {
    setStatus("本批次只标注血管，lesion 已由后端固定为全黑");
    return;
  }
  cancelGesture();
  state.activeLabel = label;
  state.tool = state.addTool;
  syncUi();
  renderCanvas();
}

function setDrawTool(tool) {
  if (!["lasso", "paint", "erase"].includes(tool)) return;
  cancelGesture();
  state.tool = tool;
  if (tool === "lasso" || tool === "paint") state.addTool = tool;
  syncUi();
  renderCanvas();
}

function setZoom(value) {
  state.zoom = Math.max(0.25, Math.min(4, value));
  applyZoom();
  syncUi();
}

function applyZoom() {
  if (!state.stage || !state.sourceImage) return;
  state.stage.style.width = `${state.sourceImage.naturalWidth * state.zoom}px`;
  state.stage.style.height = `${state.sourceImage.naturalHeight * state.zoom}px`;
}

function fitZoom() {
  if (!state.viewport || !state.sourceImage) return;
  const widthRatio = (state.viewport.clientWidth - 72) / state.sourceImage.naturalWidth;
  const heightRatio = (state.viewport.clientHeight - 72) / state.sourceImage.naturalHeight;
  setZoom(Math.max(0.25, Math.min(4, Math.min(widthRatio, heightRatio))));
}

function makeMaskCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法载入 ${url}`));
    image.src = url.startsWith("data:") || url.startsWith("blob:")
      ? url
      : `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
  });
}

function maskCanvasFromImage(image, width, height) {
  const canvas = makeMaskCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    const alpha = pixels.data[offset];
    pixels.data[offset] = 255;
    pixels.data[offset + 1] = 255;
    pixels.data[offset + 2] = 255;
    pixels.data[offset + 3] = alpha >= 128 ? 255 : 0;
  }
  context.clearRect(0, 0, width, height);
  context.putImageData(pixels, 0, 0);
  return canvas;
}

async function fetchMasks(index, candidateOnly = false) {
  const suffix = candidateOnly ? "?source=candidate" : "";
  const [vesselImage, lesionImage] = await Promise.all([
    loadImage(`/api/item/${index}/mask/vessel${suffix}`),
    loadImage(`/api/item/${index}/mask/lesion${suffix}`),
  ]);
  const width = state.sourceImage.naturalWidth;
  const height = state.sourceImage.naturalHeight;
  return {
    vessel: maskCanvasFromImage(vesselImage, width, height),
    lesion: maskCanvasFromImage(lesionImage, width, height),
  };
}

async function loadItem(index, force = false, messageAfter = "") {
  if (!state.manifest || state.loading) return false;
  if (
    !force &&
    state.dirty &&
    !window.confirm("当前修改还没有保存，确定离开这张图吗？")
  ) {
    return false;
  }
  const total = state.manifest.total;
  state.index = ((index % total) + total) % total;
  state.currentItem = state.manifest.items[state.index];
  state.loading = true;
  state.dirty = false;
  state.history = [];
  state.drawing = false;
  state.lastPoint = null;
  state.gestureLabel = null;
  state.lassoPoints = [];
  state.strokePoints = [];
  state.pendingOperations = [];
  setStatus("正在载入图像和 Mask…");
  syncUi();
  try {
    state.sourceImage = await loadImage(`/api/item/${state.index}/image`);
    state.masks = await fetchMasks(state.index, false);
    if (state.displayCanvas) {
      state.displayCanvas.width = state.sourceImage.naturalWidth;
      state.displayCanvas.height = state.sourceImage.naturalHeight;
    }
    state.loading = false;
    fitZoom();
    renderCanvas();
    updateIndexInUrl();
    setStatus(messageAfter || (state.currentItem.reviewed ? "已载入保存后的审核 Mask" : "已载入预识别 Mask"), messageAfter ? "success" : "");
  } catch (error) {
    state.loading = false;
    setStatus(error.message, "error");
    syncUi();
    return false;
  }
  syncUi();
  return true;
}

function collectBatchIndices() {
  if (!state.currentItem) return [];
  const indices = [];
  const clip = state.currentItem.clip;
  for (
    let index = state.index;
    index < state.manifest.total && indices.length < BATCH_PREVIEW_LIMIT;
    index += 1
  ) {
    const item = state.manifest.items[index];
    if (item.clip !== clip) break;
    if (!item.reviewed) indices.push(index);
  }
  return indices;
}

async function loadBatchPreview(index) {
  const item = state.manifest.items[index];
  const sourceImage = await loadImage(`/api/item/${index}/image`);
  let masks;
  if (index === state.index && state.dirty) {
    masks = {
      vessel: cloneMaskCanvas(state.masks.vessel),
      lesion: cloneMaskCanvas(state.masks.lesion),
    };
  } else {
    const [vesselImage, lesionImage] = await Promise.all([
      loadImage(`/api/item/${index}/mask/vessel?source=candidate`),
      loadImage(`/api/item/${index}/mask/lesion?source=candidate`),
    ]);
    masks = {
      vessel: maskCanvasFromImage(
        vesselImage,
        sourceImage.naturalWidth,
        sourceImage.naturalHeight,
      ),
      lesion: maskCanvasFromImage(
        lesionImage,
        sourceImage.naturalWidth,
        sourceImage.naturalHeight,
      ),
    };
    state.pendingOperations.forEach((operation) => {
      applyOperationToMasks(masks, operation);
    });
  }
  return {
    index,
    item,
    masks,
    originalMasks: {
      vessel: cloneMaskCanvas(masks.vessel),
      lesion: cloneMaskCanvas(masks.lesion),
    },
    sourceImage,
    preview: renderBatchPreview(sourceImage, masks),
    selectable: true,
    edited: false,
  };
}

function cloneMaskCanvas(source) {
  const canvas = makeMaskCanvas(source.width, source.height);
  canvas.getContext("2d").drawImage(source, 0, 0);
  return canvas;
}

function scaledPoints(operation, canvas) {
  const scaleX = canvas.width / operation.sourceWidth;
  const scaleY = canvas.height / operation.sourceHeight;
  return operation.points.map((point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  }));
}

function applyOperationToMasks(masks, operation) {
  if (operation.type === "clear_all") {
    LABELS.forEach((label) => {
      const canvas = masks[label];
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    });
    return;
  }
  const canvas = masks[operation.label];
  if (!canvas || !operation.points?.length) return;
  const context = canvas.getContext("2d");
  const points = scaledPoints(operation, canvas);
  context.save();
  if (operation.type === "add") {
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "#ffffff";
    tracePolygon(context, points);
    context.fill();
  } else if (operation.type === "paint" || operation.type === "erase") {
    const scale =
      (canvas.width / operation.sourceWidth +
        canvas.height / operation.sourceHeight) /
      2;
    context.globalCompositeOperation =
      operation.type === "erase" ? "destination-out" : "source-over";
    context.strokeStyle = "#ffffff";
    context.fillStyle = "#ffffff";
    context.lineWidth = operation.brushSize * scale;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
    if (points.length === 1) {
      context.beginPath();
      context.arc(
        points[0].x,
        points[0].y,
        (operation.brushSize * scale) / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }
  context.restore();
}

function renderBatchPreview(sourceImage, masks) {
  const canvas = makeMaskCanvas(sourceImage.naturalWidth, sourceImage.naturalHeight);
  const context = canvas.getContext("2d");
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
  drawTint(context, masks.vessel, "#00dcff");
  drawTint(context, masks.lesion, "#ff40a0");
  context.globalAlpha = 1;
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function openBatchReview() {
  if (state.loading || state.saving || state.batch.saving) return;
  if (state.dirty && state.currentItem.reviewed) {
    setStatus("当前已审核帧有新修改，请先按 Enter 保存，再从待审核帧开始批量操作", "error");
    return;
  }
  const indices = collectBatchIndices();
  if (!indices.length) {
    setStatus("当前片段后面没有待审核帧");
    return;
  }

  const requestId = ++state.batch.requestId;
  state.batch.mode = "static";
  state.batch.editor.open = false;
  state.batch.open = true;
  state.batch.loading = true;
  state.batch.items = [];
  state.batch.selected = new Set();
  state.batch.error = "";
  const grid = document.querySelector('[data-role="batch-grid"]');
  if (grid) {
    grid.innerHTML = '<div class="batch-loading"><div class="spinner"></div><span>正在加载连续帧预览…</span></div>';
  }
  syncBatchUi();
  try {
    const items = await Promise.all(indices.map(loadBatchPreview));
    if (
      requestId !== state.batch.requestId ||
      !state.batch.open ||
      state.batch.mode !== "static"
    ) return;
    state.batch.items = items;
    state.batch.selected = new Set(
      state.pendingOperations.length
        ? indices.slice(0, BATCH_EDIT_DEFAULT_LIMIT)
        : indices,
    );
    state.batch.loading = false;
    renderBatchGrid();
    syncBatchUi();
  } catch (error) {
    if (requestId !== state.batch.requestId) return;
    state.batch.loading = false;
    state.batch.error = error.message;
    syncBatchUi();
  }
}

function maskCanvasHasPixels(canvas) {
  if (!canvas) return false;
  const pixels = canvas
    .getContext("2d", { willReadFrequently: true })
    .getImageData(0, 0, canvas.width, canvas.height);
  for (let offset = 3; offset < pixels.data.length; offset += 4) {
    if (pixels.data[offset] >= 128) return true;
  }
  return false;
}

async function loadSam2Preview(item) {
  const sourceImage = await loadImage(`/api/item/${item.index}/image`);
  if (!LABELS.includes(item.label)) {
    throw new Error("SAM2 返回了未知的 Mask 类别");
  }
  const propagatedImage = await loadImage(item.mask);
  const propagatedLabel = item.label;
  const preservedLabel = propagatedLabel === "vessel" ? "lesion" : "vessel";
  let preservedMask;
  if (state.manifest.vessel_only && preservedLabel === "lesion") {
    preservedMask = makeMaskCanvas(
      sourceImage.naturalWidth,
      sourceImage.naturalHeight,
    );
  } else if (item.index === state.index && state.dirty) {
    preservedMask = cloneMaskCanvas(state.masks[preservedLabel]);
  } else {
    const preservedImage = await loadImage(
      `/api/item/${item.index}/mask/${preservedLabel}`,
    );
    preservedMask = maskCanvasFromImage(
      preservedImage,
      sourceImage.naturalWidth,
      sourceImage.naturalHeight,
    );
  }
  const masks = {};
  masks[propagatedLabel] = maskCanvasFromImage(
    propagatedImage,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight,
  );
  masks[preservedLabel] = preservedMask;
  return {
    index: item.index,
    item,
    masks,
    originalMasks: {
      vessel: cloneMaskCanvas(masks.vessel),
      lesion: cloneMaskCanvas(masks.lesion),
    },
    sourceImage,
    preview: renderBatchPreview(sourceImage, masks),
    selectable: !item.reviewed,
    edited: false,
  };
}

async function openSam2Propagation() {
  const propagationLabel = state.activeLabel;
  if (
    state.loading ||
    state.saving ||
    state.batch.loading ||
    state.batch.saving ||
    !state.masks[propagationLabel]
  ) return;
  if (state.manifest.vessel_only && propagationLabel === "lesion") {
    setStatus("本项目只标注血管，不能传播肿瘤 Mask", "error");
    return;
  }
  if (state.dirty && state.currentItem.reviewed) {
    setStatus("当前已审核帧有新修改，请先按 S 保存，再按 P 传播", "error");
    return;
  }
  if (!maskCanvasHasPixels(state.masks[propagationLabel])) {
    setStatus(
      `当前${labelDisplayName(propagationLabel)} Mask 为空。请先用套索或画笔标出目标，再按 P 传播`,
      "error",
    );
    return;
  }

  const keyframeIndex = state.index;
  const requestId = ++state.batch.requestId;
  state.batch.mode = "sam2";
  state.batch.propagatedLabel = propagationLabel;
  state.batch.editor.open = false;
  state.batch.open = true;
  state.batch.loading = true;
  state.batch.items = [];
  state.batch.selected = new Set();
  state.batch.error = "";
  const grid = document.querySelector('[data-role="batch-grid"]');
  if (grid) {
    grid.innerHTML =
      `<div class="batch-loading"><div class="spinner"></div><span>正在传播当前帧${labelDisplayName(propagationLabel)} Mask…</span></div>`;
  }
  syncBatchUi();

  try {
    const response = await fetch("/api/sam2/propagate", {
      method: "POST",
      headers: projectHeaders(),
      body: JSON.stringify({
        index: keyframeIndex,
        before: sam2BeforeFrames(),
        after: sam2AfterFrames(),
        label: propagationLabel,
        mask: exportMaskDataUrl(state.masks[propagationLabel]),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "SAM2 关键帧传播失败");
    if (
      requestId !== state.batch.requestId ||
      !state.batch.open ||
      state.batch.mode !== "sam2" ||
      state.index !== keyframeIndex
    ) return;
    const items = await Promise.all(result.items.map(loadSam2Preview));
    if (
      requestId !== state.batch.requestId ||
      !state.batch.open ||
      state.batch.mode !== "sam2" ||
      state.index !== keyframeIndex
    ) return;
    state.batch.items = items;
    state.batch.selected = new Set(
      items.filter(({ selectable }) => selectable).map(({ index }) => index),
    );
    state.batch.loading = false;
    renderBatchGrid();
    syncBatchUi();
  } catch (error) {
    if (requestId !== state.batch.requestId) return;
    state.batch.loading = false;
    state.batch.error = error.message;
    syncBatchUi();
  }
}

function renderBatchGrid() {
  const grid = document.querySelector('[data-role="batch-grid"]');
  if (!grid) return;
  if (!state.batch.items.length) {
    grid.innerHTML = '<div class="batch-empty">没有可以批量审核的候选帧。</div>';
    return;
  }
  grid.innerHTML = state.batch.items
    .map(({ index, item, preview, selectable = true, edited = false }) => {
      const selected = state.batch.selected.has(index);
      const badges = [
        item.is_keyframe ? '<span class="batch-card-badge keyframe">关键帧</span>' : "",
        item.reviewed ? '<span class="batch-card-badge reference">已审核参考</span>' : "",
        edited ? '<span class="batch-card-badge edited">已微调</span>' : "",
      ].join("");
      return `
      <article class="batch-card${selected ? " selected" : ""}${selectable ? "" : " reference"}" data-batch-card="${index}">
        <label class="batch-select-toggle" aria-label="${selectable ? "选择" : "已审核参考"}帧 ${item.frame_index}">
          <input type="checkbox" data-batch-index="${index}"${selected ? " checked" : ""}${selectable ? "" : " disabled"} />
          <span class="batch-check">✓</span>
        </label>
        <span class="batch-card-badges">${badges}</span>
        <button class="batch-preview-button" data-batch-edit="${index}" aria-label="放大${selectable ? "微调" : "查看"}帧 ${item.frame_index}">
          <img src="${preview}" alt="${item.clip} 第 ${item.frame_index} 帧候选 Mask" />
        </button>
        <span class="batch-card-meta">
          <strong>帧 ${String(item.frame_index).padStart(5, "0")}</strong>
          <small>${item.source_name}</small>
        </span>
        <button class="batch-card-edit-button" data-batch-edit="${index}">
          ${selectable ? "放大微调" : "放大查看"}
        </button>
      </article>`;
    })
    .join("");
  all("[data-batch-index]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const index = Number(checkbox.dataset.batchIndex);
      if (checkbox.checked) {
        state.batch.selected.add(index);
      } else {
        state.batch.selected.delete(index);
      }
      syncBatchUi();
    });
  });
  all("[data-batch-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      openBatchEditor(Number(button.dataset.batchEdit));
    });
  });
}

function currentBatchEditorItem() {
  return state.batch.items[state.batch.editor.position] || null;
}

function openBatchEditor(index) {
  const position = state.batch.items.findIndex((entry) => entry.index === index);
  if (position < 0 || state.batch.loading || state.batch.saving) return;
  const editor = state.batch.editor;
  editor.open = true;
  editor.position = position;
  editor.history = [];
  editor.drawing = false;
  editor.panning = false;
  editor.lastPoint = null;
  editor.gestureLabel = null;
  editor.lassoPoints = [];
  editor.strokePoints = [];
  editor.activeLabel =
    state.batch.mode === "sam2"
      ? state.batch.propagatedLabel
      : state.activeLabel;
  if (state.manifest.vessel_only) editor.activeLabel = "vessel";
  editor.tool = state.batch.items[position].selectable ? editor.addTool : "pan";
  syncBatchUi();
  requestAnimationFrame(() => {
    fitBatchEditorZoom();
    renderBatchEditor();
  });
}

function updateBatchEditorPreview(item = currentBatchEditorItem()) {
  if (!item) return;
  item.preview = renderBatchPreview(item.sourceImage, item.masks);
}

function closeBatchEditor() {
  if (!state.batch.editor.open) return;
  cancelBatchEditorGesture(true);
  updateBatchEditorPreview();
  state.batch.editor.open = false;
  state.batch.editor.history = [];
  renderBatchGrid();
  syncBatchUi();
}

function moveBatchEditor(delta) {
  const editor = state.batch.editor;
  if (!editor.open) return;
  const nextPosition = editor.position + delta;
  if (nextPosition < 0 || nextPosition >= state.batch.items.length) return;
  cancelBatchEditorGesture(true);
  updateBatchEditorPreview();
  editor.position = nextPosition;
  editor.history = [];
  editor.tool = currentBatchEditorItem().selectable ? editor.addTool : "pan";
  editor.zoom = 1;
  syncBatchEditorUi();
  requestAnimationFrame(() => {
    fitBatchEditorZoom();
    renderBatchEditor();
  });
}

function setBatchEditorTool(tool) {
  const item = currentBatchEditorItem();
  if (!item || (!item.selectable && tool !== "pan")) return;
  if (!["lasso", "paint", "erase", "pan"].includes(tool)) return;
  cancelBatchEditorGesture(true);
  state.batch.editor.tool = tool;
  if (tool === "lasso" || tool === "paint") {
    state.batch.editor.addTool = tool;
  }
  syncBatchEditorUi();
  renderBatchEditor();
}

function selectBatchEditorLabel(label) {
  const item = currentBatchEditorItem();
  if (!item?.selectable || !LABELS.includes(label)) return;
  if (state.manifest.vessel_only && label === "lesion") return;
  cancelBatchEditorGesture(true);
  state.batch.editor.activeLabel = label;
  state.batch.editor.tool = state.batch.editor.addTool;
  syncBatchEditorUi();
  renderBatchEditor();
}

function setBatchEditorZoom(value) {
  state.batch.editor.zoom = Math.max(0.25, Math.min(4, value));
  applyBatchEditorZoom();
  syncBatchEditorUi();
}

function applyBatchEditorZoom() {
  const item = currentBatchEditorItem();
  const canvas = document.querySelector("#batch-editor-canvas");
  if (!item || !canvas) return;
  canvas.style.width = `${item.sourceImage.naturalWidth * state.batch.editor.zoom}px`;
  canvas.style.height = `${item.sourceImage.naturalHeight * state.batch.editor.zoom}px`;
}

function fitBatchEditorZoom() {
  const item = currentBatchEditorItem();
  const viewport = document.querySelector('[data-role="batch-editor-viewport"]');
  if (!item || !viewport) return;
  const widthRatio =
    (viewport.clientWidth - 36) / item.sourceImage.naturalWidth;
  const heightRatio =
    (viewport.clientHeight - 36) / item.sourceImage.naturalHeight;
  setBatchEditorZoom(
    Math.max(0.25, Math.min(4, Math.min(widthRatio, heightRatio))),
  );
}

function renderBatchEditor() {
  const item = currentBatchEditorItem();
  const canvas = document.querySelector("#batch-editor-canvas");
  if (!item || !canvas) return;
  const width = item.sourceImage.naturalWidth;
  const height = item.sourceImage.naturalHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, width, height);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.drawImage(item.sourceImage, 0, 0, width, height);
  if (state.batch.editor.maskVisible) {
    drawTint(context, item.masks.vessel, "#00dcff");
    if (!state.manifest.vessel_only) {
      drawTint(context, item.masks.lesion, "#ff40a0");
    }
  }
  const editor = state.batch.editor;
  if (
    editor.drawing &&
    editor.tool === "lasso" &&
    editor.lassoPoints.length >= 2
  ) {
    const isLesion = editor.gestureLabel === "lesion";
    context.save();
    tracePolygon(context, editor.lassoPoints);
    context.fillStyle = isLesion
      ? "rgba(255, 64, 160, 0.18)"
      : "rgba(0, 220, 255, 0.18)";
    context.fill();
    context.strokeStyle = isLesion ? "#ff40a0" : "#00dcff";
    context.lineWidth = 2 / editor.zoom;
    context.setLineDash([6 / editor.zoom, 4 / editor.zoom]);
    context.stroke();
    context.restore();
  }
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  canvas.classList.toggle("panning", editor.tool === "pan");
  canvas.classList.toggle("dragging", editor.panning);
  applyBatchEditorZoom();
}

function syncBatchEditorUi() {
  const editor = state.batch.editor;
  const item = currentBatchEditorItem();
  if (!editor.open || !item) return;
  const readOnly = !item.selectable;
  setBoundText(
    "batch-editor-title",
    `帧 ${String(item.item.frame_index).padStart(5, "0")} · ${readOnly ? "只读参考" : "Mask 微调"}`,
  );
  setBoundText(
    "batch-editor-position",
    `${editor.position + 1} / ${state.batch.items.length}`,
  );
  setBoundText("batch-editor-brush", `${Math.round(editor.brushSize)} px`);
  setBoundText("batch-editor-zoom", `${Math.round(editor.zoom * 100)}%`);
  setBoundText(
    "batch-editor-mask-toggle",
    editor.maskVisible ? "隐藏 Mask" : "显示 Mask",
  );
  setBoundText(
    "batch-editor-notice",
    readOnly
      ? "这张帧已经审核，只供放大对照，不能修改或再次保存。"
      : editor.tool === "lasso"
      ? `正在用套索添加${editor.activeLabel === "vessel" ? "血管" : "肿瘤"} Mask。所有修改先保存在本次预览中。`
      : editor.tool === "paint"
      ? `正在用画笔填涂${editor.activeLabel === "vessel" ? "血管" : "肿瘤"} Mask。所有修改先保存在本次预览中。`
      : editor.tool === "erase"
      ? `正在擦除${editor.activeLabel === "vessel" ? "血管" : "肿瘤"} Mask。所有修改先保存在本次预览中。`
      : "拖动画面不会修改 Mask。",
  );
  setBoundText(
    "batch-editor-status",
    item.edited ? "已微调并勾选，返回后会显示标记" : "微调结果尚未写入",
  );
  all('[data-action="batch-editor-label"]').forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.label === editor.activeLabel,
    );
    button.disabled =
      readOnly ||
      (state.manifest.vessel_only && button.dataset.label === "lesion");
  });
  all('[data-action="batch-editor-tool"]').forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === editor.tool);
    button.disabled = readOnly && button.dataset.tool !== "pan";
  });
  all('[data-action="batch-editor-previous"]').forEach((button) => {
    button.disabled = editor.position === 0;
  });
  all('[data-action="batch-editor-next"]').forEach((button) => {
    button.disabled = editor.position === state.batch.items.length - 1;
  });
  all('[data-action="batch-editor-undo"]').forEach((button) => {
    button.disabled = readOnly || editor.history.length === 0;
  });
  all('[data-action="batch-editor-reset"]').forEach((button) => {
    button.disabled = readOnly || !item.edited;
  });
  all('[data-action="batch-editor-toggle-mask"]').forEach((button) => {
    button.classList.toggle("active", editor.maskVisible);
  });
  all('[data-control="batch-editor-brush"]').forEach((input) => {
    input.value = String(editor.brushSize);
    input.disabled = readOnly;
  });
  all('[data-control="batch-editor-zoom"]').forEach((input) => {
    input.value = String(Math.round(editor.zoom * 100));
  });
}

function batchEditorPointFromEvent(event) {
  const canvas = document.querySelector("#batch-editor-canvas");
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

function pushBatchEditorHistory() {
  const item = currentBatchEditorItem();
  if (!item) return;
  const masks = {};
  LABELS.forEach((label) => {
    const canvas = item.masks[label];
    masks[label] = canvas
      .getContext("2d", { willReadFrequently: true })
      .getImageData(0, 0, canvas.width, canvas.height);
  });
  state.batch.editor.history.push({
    masks,
    edited: item.edited,
  });
  if (state.batch.editor.history.length > 20) {
    state.batch.editor.history.shift();
  }
}

function beginBatchEditorGesture(event) {
  const item = currentBatchEditorItem();
  const editor = state.batch.editor;
  if (!editor.open || !item || event.button !== 0) return;
  const canvas = document.querySelector("#batch-editor-canvas");
  const viewport = document.querySelector('[data-role="batch-editor-viewport"]');
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  if (editor.tool === "pan") {
    editor.panning = true;
    editor.panStart = { x: event.clientX, y: event.clientY };
    editor.scrollStart = {
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
    renderBatchEditor();
    return;
  }
  if (!item.selectable) return;
  pushBatchEditorHistory();
  const point = batchEditorPointFromEvent(event);
  editor.drawing = true;
  editor.lastPoint = point;
  editor.gestureLabel = editor.activeLabel;
  editor.lassoPoints = editor.tool === "lasso" ? [point] : [];
  editor.strokePoints =
    editor.tool === "paint" || editor.tool === "erase" ? [point] : [];
  if (editor.tool === "paint" || editor.tool === "erase") {
    drawBatchEditorBrushStroke(point, point);
  } else {
    renderBatchEditor();
  }
}

function continueBatchEditorGesture(event) {
  const editor = state.batch.editor;
  if (editor.panning) {
    const viewport = document.querySelector('[data-role="batch-editor-viewport"]');
    viewport.scrollLeft =
      editor.scrollStart.left - (event.clientX - editor.panStart.x);
    viewport.scrollTop =
      editor.scrollStart.top - (event.clientY - editor.panStart.y);
    return;
  }
  if (!editor.drawing) return;
  event.preventDefault();
  const point = batchEditorPointFromEvent(event);
  if (editor.tool === "lasso") {
    if (distanceBetween(editor.lastPoint, point) < 2) return;
    editor.lassoPoints.push(point);
    editor.lastPoint = point;
    renderBatchEditor();
    return;
  }
  editor.strokePoints.push(point);
  drawBatchEditorBrushStroke(editor.lastPoint, point);
  editor.lastPoint = point;
}

function endBatchEditorGesture(event) {
  const item = currentBatchEditorItem();
  const editor = state.batch.editor;
  if (editor.panning) {
    editor.panning = false;
    editor.panStart = null;
    editor.scrollStart = null;
    renderBatchEditor();
    return;
  }
  if (!editor.drawing || !item) return;
  event.preventDefault();
  let changed = true;
  if (editor.tool === "lasso") {
    const points = editor.lassoPoints;
    changed = points.length >= 3 && polygonArea(points) >= 4;
    if (changed) {
      const context = item.masks[editor.gestureLabel].getContext("2d");
      context.save();
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "#ffffff";
      tracePolygon(context, points);
      context.fill();
      context.restore();
    }
  }
  if (!changed) {
    editor.history.pop();
  } else {
    item.edited = true;
    state.batch.selected.add(item.index);
    updateBatchEditorPreview(item);
  }
  editor.drawing = false;
  editor.lastPoint = null;
  editor.gestureLabel = null;
  editor.lassoPoints = [];
  editor.strokePoints = [];
  renderBatchEditor();
  syncBatchEditorUi();
}

function cancelBatchEditorGesture(restore = true) {
  const item = currentBatchEditorItem();
  const editor = state.batch.editor;
  if (restore && editor.drawing && item) {
    const snapshot = editor.history.pop();
    if (snapshot) {
      LABELS.forEach((label) => {
        item.masks[label]
          .getContext("2d")
          .putImageData(snapshot.masks[label], 0, 0);
      });
      item.edited = snapshot.edited;
    }
  }
  editor.drawing = false;
  editor.panning = false;
  editor.lastPoint = null;
  editor.gestureLabel = null;
  editor.lassoPoints = [];
  editor.strokePoints = [];
  editor.panStart = null;
  editor.scrollStart = null;
  renderBatchEditor();
}

function drawBatchEditorBrushStroke(from, to) {
  const item = currentBatchEditorItem();
  if (!item) return;
  const editor = state.batch.editor;
  drawMaskStroke(
    item.masks[editor.gestureLabel],
    from,
    to,
    editor.brushSize,
    editor.tool === "erase",
  );
  renderBatchEditor();
}

function undoBatchEditor() {
  const item = currentBatchEditorItem();
  const snapshot = state.batch.editor.history.pop();
  if (!item || !snapshot || !item.selectable) return;
  LABELS.forEach((label) => {
    item.masks[label]
      .getContext("2d")
      .putImageData(snapshot.masks[label], 0, 0);
  });
  item.edited = snapshot.edited;
  updateBatchEditorPreview(item);
  renderBatchEditor();
  syncBatchEditorUi();
}

function resetBatchEditorMask() {
  const item = currentBatchEditorItem();
  if (!item || !item.selectable) return;
  pushBatchEditorHistory();
  LABELS.forEach((label) => {
    item.masks[label] = cloneMaskCanvas(item.originalMasks[label]);
  });
  item.edited = false;
  updateBatchEditorPreview(item);
  renderBatchEditor();
  syncBatchEditorUi();
}

function toggleBatchEditorMask() {
  if (!state.batch.editor.open) return;
  state.batch.editor.maskVisible = !state.batch.editor.maskVisible;
  renderBatchEditor();
  syncBatchEditorUi();
}

function syncBatchUi() {
  const modal = document.querySelector('[data-role="batch-modal"]');
  if (!modal) return;
  const propagatedName = labelDisplayName(state.batch.propagatedLabel);
  modal.hidden = !state.batch.open;
  document.body.classList.toggle("batch-modal-open", state.batch.open);
  const overview = document.querySelector('[data-role="batch-overview"]');
  const editorPanel = document.querySelector('[data-role="batch-editor"]');
  if (overview) overview.hidden = state.batch.editor.open;
  if (editorPanel) editorPanel.hidden = !state.batch.editor.open;
  setBoundText("batch-count", state.batch.selected.size);
  setBoundText("batch-error", state.batch.error);
  setBoundText(
    "batch-eyebrow",
    state.batch.mode === "sam2"
      ? `人工关键帧 · ${propagatedName}双向传播`
      : "连续帧候选 Mask",
  );
  setBoundText(
    "batch-title",
    state.batch.mode === "sam2"
      ? `SAM2 ${propagatedName}传播预览`
      : "批量审核",
  );
  setBoundText(
    "batch-guidance",
    state.batch.mode === "sam2"
      ? `SAM2 已从当前关键帧向前 ${sam2BeforeFrames()} 帧、向后 ${sam2AfterFrames()} 帧传播${propagatedName} Mask。另一类 Mask 保留每帧原有内容。已审核帧只供对照且不会被覆盖，请取消勾选边界不准的帧。`
      : state.pendingOperations.length
      ? `已按相同像素位置静态套用 ${state.pendingOperations.length} 次操作，默认只选择前 ${BATCH_EDIT_DEFAULT_LIMIT} 帧。它不会跟踪目标边界，请取消勾选错位帧。`
      : "逐张查看叠加效果。只勾选无需修改的帧，有误的帧取消勾选并留到单帧微调。",
  );
  all("[data-batch-card]").forEach((card) => {
    const selected = state.batch.selected.has(Number(card.dataset.batchCard));
    card.classList.toggle("selected", selected);
  });
  all('[data-action="batch-accept"]').forEach((button) => {
    button.disabled =
      state.batch.loading ||
      state.batch.saving ||
      state.batch.selected.size === 0;
    button.textContent = state.batch.saving
      ? "正在写入…"
      : `通过选中 ${state.batch.selected.size} 帧`;
  });
  if (state.batch.editor.open) {
    syncBatchEditorUi();
    renderBatchEditor();
  }
}

function closeBatchReview(force = false) {
  if (state.batch.saving) return;
  if (
    !force &&
    state.batch.items.some(({ edited }) => edited) &&
    !window.confirm("预览里还有未保存的微调，确定关闭并丢弃吗？")
  ) return;
  state.batch.requestId += 1;
  state.batch.open = false;
  state.batch.loading = false;
  state.batch.mode = "static";
  state.batch.propagatedLabel = "vessel";
  state.batch.editor.open = false;
  state.batch.editor.history = [];
  state.batch.editor.drawing = false;
  state.batch.editor.panning = false;
  state.batch.items = [];
  state.batch.selected = new Set();
  state.batch.error = "";
  const grid = document.querySelector('[data-role="batch-grid"]');
  if (grid) grid.innerHTML = "";
  syncBatchUi();
}

function selectAllBatchItems() {
  state.batch.selected = new Set(
    state.batch.items
      .filter(({ selectable = true }) => selectable)
      .map(({ index }) => index),
  );
  all("[data-batch-index]").forEach((checkbox) => {
    checkbox.checked = !checkbox.disabled;
  });
  syncBatchUi();
}

function clearBatchSelection() {
  state.batch.selected = new Set();
  all("[data-batch-index]").forEach((checkbox) => {
    checkbox.checked = false;
  });
  syncBatchUi();
}

async function acceptBatchCandidates() {
  const indices = [...state.batch.selected].sort((left, right) => left - right);
  if (!indices.length || state.batch.loading || state.batch.saving) return;
  const previewName = state.batch.mode === "sam2" ? "SAM2 传播" : "批量";
  const editedButUnselected = state.batch.items.filter(
    ({ index, edited }) => edited && !state.batch.selected.has(index),
  ).length;
  const discardWarning = editedButUnselected
    ? `\n另有 ${editedButUnselected} 张已微调帧未勾选，这些修改会被丢弃。`
    : "";
  if (
    !window.confirm(
      `确认保存这 ${indices.length} 帧${previewName}预览中的 Mask 吗？${discardWarning}`,
    )
  ) return;

  state.batch.saving = true;
  state.batch.error = "";
  syncBatchUi();
  try {
    const selectedItems = state.batch.items.filter(({ index }) =>
      state.batch.selected.has(index),
    );
    const response = await fetch("/api/batch/save", {
      method: "POST",
      headers: projectHeaders(),
      body: JSON.stringify({
        items: selectedItems.map(({ index, masks }) => ({
          index,
          vessel: exportMaskDataUrl(masks.vessel),
          lesion: exportMaskDataUrl(masks.lesion),
        })),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "批量审核失败");
    result.saved_indices.forEach((index) => {
      state.manifest.items[index].reviewed = true;
    });
    state.manifest.processed = result.processed;
    const completedMode = state.batch.mode;
    const completedLabel = state.batch.propagatedLabel;
    state.batch.saving = false;
    closeBatchReview(true);
    await loadItem(
      result.next_index,
      true,
      completedMode === "sam2"
        ? `已保存 ${result.saved_count} 帧 SAM2 ${labelDisplayName(completedLabel)}传播 Mask，取消勾选的帧仍保留待审核`
        : `已批量保存 ${result.saved_count} 帧，取消勾选的帧仍保留待审核`,
    );
  } catch (error) {
    state.batch.saving = false;
    state.batch.error = error.message;
    syncBatchUi();
  }
}

function updateIndexInUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("index", String(state.index));
  history.replaceState({}, "", url);
}

function renderCanvas() {
  if (!state.displayCanvas || !state.sourceImage) return;
  const canvas = state.displayCanvas;
  if (canvas.width !== state.sourceImage.naturalWidth || canvas.height !== state.sourceImage.naturalHeight) {
    canvas.width = state.sourceImage.naturalWidth;
    canvas.height = state.sourceImage.naturalHeight;
  }
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.drawImage(state.sourceImage, 0, 0, canvas.width, canvas.height);
  if (state.overlayVisible.vessel && state.masks.vessel) drawTint(context, state.masks.vessel, "#00dcff");
  if (state.overlayVisible.lesion && state.masks.lesion) drawTint(context, state.masks.lesion, "#ff40a0");
  drawLassoPreview(context);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
}

function drawTint(targetContext, maskCanvas, color) {
  const tint = document.createElement("canvas");
  tint.width = maskCanvas.width;
  tint.height = maskCanvas.height;
  const context = tint.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, tint.width, tint.height);
  context.globalCompositeOperation = "destination-in";
  context.drawImage(maskCanvas, 0, 0);
  targetContext.globalAlpha = 0.44;
  targetContext.drawImage(tint, 0, 0);
}

function pointFromEvent(event) {
  const rect = state.displayCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * state.displayCanvas.width) / rect.width,
    y: ((event.clientY - rect.top) * state.displayCanvas.height) / rect.height,
  };
}

function pushHistory() {
  if (!state.masks.vessel || !state.masks.lesion) return;
  const snapshot = {};
  LABELS.forEach((label) => {
    const canvas = state.masks[label];
    snapshot[label] = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
  });
  snapshot.pendingOperations = state.pendingOperations.map((operation) => ({
    ...operation,
    points: operation.points?.map((point) => ({ ...point })),
  }));
  state.history.push(snapshot);
  if (state.history.length > 20) state.history.shift();
}

function beginStroke(event) {
  if (event.button !== 0 || state.loading || state.saving || !state.masks[state.activeLabel]) return;
  event.preventDefault();
  state.displayCanvas.setPointerCapture(event.pointerId);
  pushHistory();
  state.drawing = true;
  state.lastPoint = pointFromEvent(event);
  state.gestureLabel = state.activeLabel;
  state.strokePoints =
    state.tool === "paint" || state.tool === "erase" ? [state.lastPoint] : [];
  if (state.tool === "lasso") {
    state.lassoPoints = [state.lastPoint];
    renderCanvas();
    return;
  }
  drawActiveBrushStroke(state.lastPoint, state.lastPoint);
}

function continueStroke(event) {
  if (!state.drawing) return;
  event.preventDefault();
  const point = pointFromEvent(event);
  if (state.tool === "lasso") {
    if (distanceBetween(state.lastPoint, point) < 2) return;
    state.lassoPoints.push(point);
    state.lastPoint = point;
    renderCanvas();
    return;
  }
  state.strokePoints.push(point);
  drawActiveBrushStroke(state.lastPoint, point);
  state.lastPoint = point;
}

function endStroke(event) {
  if (!state.drawing) return;
  event.preventDefault();
  const tool = state.tool;
  const gestureLabel = state.gestureLabel;
  const lassoPoints = state.lassoPoints.map((point) => ({ ...point }));
  const strokePoints = state.strokePoints.map((point) => ({ ...point }));
  const changed =
    tool === "lasso" ? fillLasso() : strokePoints.length > 0;
  state.drawing = false;
  state.lastPoint = null;
  state.gestureLabel = null;
  state.lassoPoints = [];
  state.strokePoints = [];
  if (!changed) {
    state.history.pop();
    renderCanvas();
    setStatus("套索区域太小，请按住并沿目标边界圈画");
    syncUi();
    return;
  }
  state.pendingOperations.push({
    type: tool === "lasso" ? "add" : tool,
    label: gestureLabel,
    points: tool === "lasso" ? lassoPoints : strokePoints,
    brushSize: state.brushSize,
    sourceWidth: state.displayCanvas.width,
    sourceHeight: state.displayCanvas.height,
  });
  state.dirty = true;
  const action =
    tool === "lasso" ? "已套索填充" : tool === "paint" ? "已画笔填涂" : "已擦除";
  setStatus(`${action}${state.activeLabel === "vessel" ? "血管" : "肿瘤"} Mask，按 Enter 保存`);
  syncUi();
}

function cancelGesture() {
  if (!state.drawing) return;
  const snapshot = state.history.pop();
  if (snapshot) {
    LABELS.forEach((label) => {
      const canvas = state.masks[label];
      canvas.getContext("2d").putImageData(snapshot[label], 0, 0);
    });
    state.pendingOperations = snapshot.pendingOperations || [];
  }
  state.drawing = false;
  state.lastPoint = null;
  state.gestureLabel = null;
  state.lassoPoints = [];
  state.strokePoints = [];
  renderCanvas();
}

function distanceBetween(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function polygonArea(points) {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    twiceArea += current.x * next.y - next.x * current.y;
  }
  return Math.abs(twiceArea) / 2;
}

function tracePolygon(context, points) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
}

function fillLasso() {
  const points = state.lassoPoints;
  if (points.length < 3 || polygonArea(points) < 4) return false;
  const canvas = state.masks[state.gestureLabel];
  const context = canvas.getContext("2d");
  context.save();
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "#ffffff";
  tracePolygon(context, points);
  context.fill();
  context.restore();
  renderCanvas();
  return true;
}

function drawLassoPreview(context) {
  if (!state.drawing || state.tool !== "lasso" || state.lassoPoints.length < 2) return;
  const color = state.gestureLabel === "lesion" ? "#ff40a0" : "#00dcff";
  context.save();
  tracePolygon(context, state.lassoPoints);
  context.fillStyle = state.gestureLabel === "lesion" ? "rgba(255, 64, 160, 0.18)" : "rgba(0, 220, 255, 0.18)";
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 2 / state.zoom;
  context.setLineDash([6 / state.zoom, 4 / state.zoom]);
  context.stroke();
  context.restore();
}

function drawMaskStroke(canvas, from, to, brushSize, erase = false) {
  const context = canvas.getContext("2d");
  context.save();
  context.globalCompositeOperation = erase ? "destination-out" : "source-over";
  context.strokeStyle = "#ffffff";
  context.fillStyle = "#ffffff";
  context.lineWidth = brushSize;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  if (from.x === to.x && from.y === to.y) {
    context.beginPath();
    context.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawActiveBrushStroke(from, to) {
  drawMaskStroke(
    state.masks[state.gestureLabel],
    from,
    to,
    state.brushSize,
    state.tool === "erase",
  );
  renderCanvas();
}

function undo() {
  const snapshot = state.history.pop();
  if (!snapshot) {
    setStatus("没有可以撤销的笔画");
    return;
  }
  LABELS.forEach((label) => {
    const canvas = state.masks[label];
    canvas.getContext("2d").putImageData(snapshot[label], 0, 0);
  });
  state.pendingOperations = snapshot.pendingOperations || [];
  state.dirty = true;
  renderCanvas();
  setStatus("已撤销上一笔");
  syncUi();
}

async function resetToCandidate() {
  if (!state.sourceImage || state.loading) return;
  pushHistory();
  try {
    state.masks = await fetchMasks(state.index, true);
    state.pendingOperations = [];
    state.dirty = true;
    renderCanvas();
    setStatus("已恢复当前帧的预识别 Mask");
    syncUi();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function clearAllMasks() {
  if (state.loading || state.saving || !state.masks.vessel || !state.masks.lesion) return;
  pushHistory();
  LABELS.forEach((label) => {
    const canvas = state.masks[label];
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  });
  state.pendingOperations.push({ type: "clear_all" });
  state.dirty = true;
  renderCanvas();
  setStatus("已清空当前帧的全部 Mask，按 S 保存当前帧，Enter 保存并下一张");
  syncUi();
}

function exportMaskDataUrl(maskCanvas) {
  const output = document.createElement("canvas");
  output.width = maskCanvas.width;
  output.height = maskCanvas.height;
  const context = output.getContext("2d");
  context.fillStyle = "#000000";
  context.fillRect(0, 0, output.width, output.height);
  context.drawImage(maskCanvas, 0, 0);
  return output.toDataURL("image/png");
}

async function saveCurrent(advance = true) {
  if (state.loading || state.saving || !state.masks.vessel || !state.masks.lesion) return;
  state.saving = true;
  setStatus("正在写入标定图片和 Mask…");
  syncUi();
  try {
    const response = await fetch(`/api/item/${state.index}/save`, {
      method: "POST",
      headers: projectHeaders(),
      body: JSON.stringify({
        vessel: exportMaskDataUrl(state.masks.vessel),
        lesion: exportMaskDataUrl(state.masks.lesion),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "保存失败");
    state.currentItem.reviewed = true;
    state.manifest.items[state.index].reviewed = true;
    state.manifest.processed = result.processed;
    state.dirty = false;
    state.saving = false;
    state.history = [];
    if (advance) {
      await loadItem(result.next_index, true, "上一张已保存并标记为已审核");
    } else {
      setStatus(
        "当前帧已保存，可按 B 继续批量预览",
        "success",
      );
    }
  } catch (error) {
    state.saving = false;
    setStatus(error.message, "error");
    syncUi();
  }
}

function navigate(delta) {
  loadItem(state.index + delta, false);
}

function toggleMask(label) {
  state.overlayVisible[label] = !state.overlayVisible[label];
  renderCanvas();
  syncUi();
}

function toggleAllMasks() {
  const anyVisible = LABELS.some((label) => state.overlayVisible[label]);
  LABELS.forEach((label) => {
    state.overlayVisible[label] = !anyVisible;
  });
  renderCanvas();
  syncUi();
}

function isEditableTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

window.addEventListener("keydown", (event) => {
  if (state.batch.open) {
    if (state.batch.editor.open) {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault();
        closeBatchEditor();
      } else if (isEditableTarget(event.target)) {
        return;
      } else if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoBatchEditor();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveBatchEditor(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveBatchEditor(1);
      } else if (event.key === "1") {
        event.preventDefault();
        selectBatchEditorLabel("vessel");
      } else if (event.key === "2") {
        event.preventDefault();
        selectBatchEditorLabel("lesion");
      } else if (event.key.toLowerCase() === "q") {
        event.preventDefault();
        setBatchEditorTool("lasso");
      } else if (event.key.toLowerCase() === "w") {
        event.preventDefault();
        setBatchEditorTool("paint");
      } else if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        setBatchEditorTool("erase");
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleBatchEditorMask();
      } else if (event.code === "Space") {
        event.preventDefault();
        setBatchEditorTool("pan");
      } else if (event.key === "[") {
        state.batch.editor.brushSize = Math.max(
          1,
          state.batch.editor.brushSize - 3,
        );
        syncBatchEditorUi();
      } else if (event.key === "]") {
        state.batch.editor.brushSize = Math.min(
          100,
          state.batch.editor.brushSize + 3,
        );
        syncBatchEditorUi();
      } else if (event.key === "+" || event.key === "=") {
        setBatchEditorZoom(state.batch.editor.zoom * 1.15);
      } else if (event.key === "-" || event.key === "_") {
        setBatchEditorZoom(state.batch.editor.zoom / 1.15);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeBatchReview();
    }
    return;
  }
  if (event.ctrlKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
    return;
  }
  if (
    isEditableTarget(event.target) &&
    (event.target instanceof HTMLSelectElement || event.key !== "Enter")
  ) return;
  if (event.key === "Enter") {
    event.preventDefault();
    saveCurrent(true);
  } else if (event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveCurrent(false);
  } else if (event.key === "1") {
    selectLabel("vessel");
  } else if (event.key === "2") {
    selectLabel("lesion");
  } else if (event.key.toLowerCase() === "q") {
    setDrawTool("lasso");
  } else if (event.key.toLowerCase() === "w") {
    setDrawTool("paint");
  } else if (event.key.toLowerCase() === "e") {
    setDrawTool("erase");
  } else if (event.key === "[") {
    setBrushSize(state.brushSize - 3);
  } else if (event.key === "]") {
    setBrushSize(state.brushSize + 3);
  } else if (event.key.toLowerCase() === "v") {
    toggleMask("vessel");
  } else if (event.key.toLowerCase() === "l") {
    toggleMask("lesion");
  } else if (event.key.toLowerCase() === "m" || event.key.toLowerCase() === "h") {
    toggleAllMasks();
  } else if (event.key.toLowerCase() === "x") {
    clearAllMasks();
  } else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    navigate(-1);
  } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    navigate(1);
  } else if (event.key.toLowerCase() === "b") {
    openBatchReview();
  } else if (event.key.toLowerCase() === "p") {
    openSam2Propagation();
  } else if (event.key === "+" || event.key === "=") {
    setZoom(state.zoom * 1.15);
  } else if (event.key === "-" || event.key === "_") {
    setZoom(state.zoom / 1.15);
  }
});

window.addEventListener("beforeunload", (event) => {
  if (
    !state.dirty &&
    !state.batch.items.some(({ edited }) => edited)
  ) return;
  event.preventDefault();
  event.returnValue = "";
});

async function init() {
  app.innerHTML = '<div class="loading-screen"><div class="loading-card"><div class="spinner"></div><h1>正在准备审核数据</h1><p>读取原图、预识别 Mask 和审核进度…</p></div></div>';
  applyLanguage();
  try {
    const response = await fetch("/api/manifest", { cache: "no-store" });
    const manifest = await response.json();
    if (!response.ok) throw new Error(manifest.error || "无法读取审核清单");
    const requestedProject = new URLSearchParams(
      window.location.search,
    ).get("project");
    if (
      requestedProject &&
      requestedProject !== manifest.project_id
    ) {
      throw new Error(
        "浏览器页面属于另一个标定项目，请从 DataSeg 启动器重新打开。",
      );
    }
    state.manifest = manifest;
    const requestedIndex = Number(new URLSearchParams(window.location.search).get("index"));
    state.index = Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < manifest.total ? requestedIndex : 0;
    buildReviewer();
    await loadItem(state.index, true);
  } catch (error) {
    app.innerHTML = `<div class="error-screen"><div class="error-card"><h1>审核工具启动失败</h1><p>${error.message}</p></div></div>`;
    applyLanguage();
  }
}

init();
