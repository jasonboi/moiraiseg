const DEFAULT_SAM2_BEFORE_FRAMES = 4;
const DEFAULT_SAM2_AFTER_FRAMES = 16;
const SAM2_REVIEW_HEARTBEAT_MS = 30_000;
const SAM2_REVIEW_RELEASE_RETRY_MS = Object.freeze([0, 500, 2_000]);
const MAX_MASK_CATEGORIES = 5;
const MASK_OVERLAY_ALPHA = 0.44;
const MASK_CATEGORY_COLOR_CANDIDATES = Object.freeze([
  "#0072B2",
  "#D55E00",
  "#009E73",
  "#CC79A7",
  "#E69F00",
]);
const LANGUAGE_STORAGE_KEY = "dataseg-language";
const ENGLISH_TEXT = {
  "English": "中文",
  "切换为英文": "Switch to Chinese",
  "Mask 类别": "Mask categories",
  "添加": "Add",
  "管理": "Manage",
  "编辑": "Edit",
  "删除": "Delete",
  "隐藏": "Hide",
  "显示": "Show",
  "归档恢复": "Archive recovery",
  "暂无归档类别": "No archived categories",
  "归档的 Mask 类别": "Archived Mask categories",
  "归档类别保存在当前项目中，可以恢复原有 Mask。": "Archived categories stay in this project and can restore their original Masks.",
  "恢复": "Restore",
  "正在恢复…": "Restoring…",
  "归档时间": "Archived",
  "关闭归档列表": "Close archive list",
  "发现同名归档": "Archived data found",
  "这个文件夹已有归档数据。选择恢复旧数据，或保留归档并以当前输入新建空类别。": "This folder already has archived data. Restore the old data, or keep the archive and create an empty category from the current input.",
  "恢复旧数据": "Restore old data",
  "以当前输入新建空类别": "Create empty category",
  "返回编辑": "Back to editing",
  "正在归档…": "Archiving…",
  "当前帧有未保存修改，请先保存或丢弃后再管理类别。": "This frame has unsaved changes. Save or discard them before managing categories.",
  "类别操作正在进行，请稍后再试。": "A category operation is in progress. Try again when it finishes.",
  "活动类别已达到 5 个，请先归档一个类别再恢复。": "There are already 5 active categories. Archive one before restoring another.",
  "归档列表为空。": "The archive is empty.",
  "编辑 Mask 类别": "Edit Mask category",
  "名称和颜色会立即更新。文件夹名保持不变。": "The name and color update immediately. The folder name stays unchanged.",
  "保存修改": "Save changes",
  "正在更新…": "Updating…",
  "删除类别将在归档功能完成后启用。": "Category deletion will be enabled with archive recovery.",
  "还没有 Mask 类别。先定义要标记的内容。": "No Mask categories yet. Define what you want to annotate first.",
  "添加第一个类别": "Add first category",
  "添加 Mask 类别": "Add Mask category",
  "名称显示在标定界面中。文件夹名保存后不能修改。": "The name appears in the annotation UI. The folder name cannot be changed after saving.",
  "显示名称": "Display name",
  "文件夹名字": "Folder name",
  "覆盖颜色": "Overlay color",
  "小写字母开头，只能使用小写字母、数字、下划线和连字符。": "Start with a lowercase letter. Use lowercase letters, numbers, underscores, and hyphens only.",
  "覆盖透明度固定为 44%": "Overlay opacity is fixed at 44%",
  "取消": "Cancel",
  "添加类别": "Add category",
  "例如：神经": "For example: nerve",
  "例如：nerve": "For example: nerve",
  "Mask 编辑画布": "Mask editing canvas",
  "等待图像": "Waiting for image",
  "添加 Mask 方式": "Mask drawing mode",
  "套索": "Lasso",
  "画笔": "Brush",
  "橡皮 ·": "Eraser ·",
  "按住并沿边界圈画，松开后自动闭合并填充。": "Hold and trace the boundary. Release to close and fill.",
  "沿目标边界圈画，松开后自动闭合并填充。": "Trace the target boundary. Release to close and fill.",
  "按住鼠标直接填涂，适合横断面和局部补画。": "Hold the pointer to paint cross-sections or make local corrections.",
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
  "跳转到下一张未审核": "Jump to next pending frame",
  "已跳转到下一张待审核帧": "Opened the next pending frame",
  "当前图像就是唯一待审核帧": "The current image is the only pending frame",
  "所有图像均已审核": "All images have been reviewed",
  "帧 —": "Frame —",
  "帧已选": "frames selected",
  "文件": "File",
  "序号": "Position",
  "← 上一张": "← Previous",
  "下一张 →": "Next →",
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
  "关闭传播审核": "Close propagation review",
  "关闭": "Close",
  "全选": "Select all",
  "全不选": "Select none",
  "允许覆盖向后已审核帧": "Allow overwriting following reviewed frames",
  "关键帧之前的已审核帧始终受保护": "Reviewed frames before the keyframe always stay protected",
  "Shift 连选 · 按住勾选框拖动可批量选择或取消": "Shift-select a range · drag across checkboxes to select or clear",
  "通过选中帧": "Accept selected frames",
  "预览内微调 · 只在确认后写入": "Preview editing · saved only after confirmation",
  "← 上一帧": "← Previous frame",
  "下一帧 →": "Next frame →",
  "返回传播预览": "Return to propagation preview",
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
  "当前修改还没有保存，确定离开这张图吗？": "The current changes are unsaved. Leave this image?",
  "正在载入图像和 Mask…": "Loading image and Masks…",
  "已载入保存后的审核 Mask": "Loaded the saved reviewed Mask",
  "已载入预识别 Mask": "Loaded the candidate Mask",
  "SAM2 返回了未知的 Mask 类别": "SAM2 returned an unknown Mask label.",
  "当前已审核帧有新修改，请先按 S 保存，再按 P 传播": "This reviewed frame has unsaved changes. Press S to save, then P to propagate.",
  "SAM2 关键帧传播失败": "SAM2 keyframe propagation failed.",
  "没有可以审核的传播帧。": "No propagated frames are available for review.",
  "关键帧": "Keyframe",
  "已审核参考": "Reviewed reference",
  "已审核 · 可覆盖": "Reviewed · overwrite enabled",
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
  "传播结果保存失败": "Could not save the propagation results.",
  "套索区域太小，请按住并沿目标边界圈画": "The lasso area is too small. Hold and trace the target boundary.",
  "已套索填充": "Lasso filled ",
  "已画笔填涂": "Brush painted ",
  "已擦除": "Erased ",
  "没有可以撤销的笔画": "There are no strokes to undo.",
  "已撤销上一笔": "Undid the previous stroke.",
  "已恢复当前帧的预识别 Mask": "Restored the candidate Mask for this frame.",
  "已清空当前帧的全部 Mask，按 S 保存当前帧，Enter 保存并下一张": "Cleared all Masks on this frame. Press S to save here or Enter to save and continue.",
  "已清空当前微调帧的全部 Mask。按 Ctrl+Z 可撤销。": "Cleared all Masks on this editing frame. Press Ctrl+Z to undo.",
  "正在写入标定图片和 Mask…": "Saving the annotated image and Masks…",
  "保存失败": "Save failed.",
  "上一张已保存并标记为已审核": "The previous frame was saved and marked as reviewed.",
  "当前帧已保存": "The current frame was saved",
  "正在准备审核数据": "Preparing review data",
  "读取原图、预识别 Mask 和审核进度…": "Loading source images, candidate Masks, and review progress…",
  "无法读取审核清单": "Could not load the review manifest.",
  "浏览器页面属于另一个标定项目，请从 DataSeg 启动器重新打开。": "This page belongs to a different annotation project. Reopen it from the DataSeg launcher.",
  "审核工具启动失败": "Review tool failed to start",
};
const originalText = new WeakMap();
const originalAttributes = new WeakMap();

function englishDynamicText(value) {
  const exact = ENGLISH_TEXT[value];
  if (exact) return exact;
  const rules = [
    [/^显示或隐藏 (.+)$/, (match, label) => `Show or hide ${label}`],
    [/^选择 (.+)，快捷键 (\d+)$/, (match, label, key) => `Select ${label}, shortcut ${key}`],
    [/^(隐藏|显示) (.+) Mask$/, (match, action, label) => `${action === "隐藏" ? "Hide" : "Show"} ${label} Mask`],
    [/^管理 (.+)$/, (match, label) => `Manage ${label}`],
    [/^已添加 (.+) Mask$/, (match, label) => `Added the ${label} Mask`],
    [/^已更新 (.+) Mask$/, (match, label) => `Updated the ${label} Mask`],
    [/^已归档 (.+) Mask，可从归档恢复$/, (match, label) => `Archived the ${label} Mask. You can restore it from Archive recovery.`],
    [/^已恢复 (.+) Mask 和归档数据$/, (match, label) => `Restored the ${label} Mask and its archived data.`],
    [/^(\d+) 个归档$/, "$1 archived"],
    [/^查看 (\d+) 个归档类别$/, "View $1 archived categories"],
    [/^按住鼠标擦除(.+) Mask。$/, (match, label) => `Hold the pointer to erase the ${label} Mask.`],
    [/^SAM2 传播(.+)$/, (match, label) => `Propagate ${label} with SAM2`],
    [/^(\d+) 帧已选$/, "$1 frames selected"],
    [/^帧 (\d+)$/, "Frame $1"],
    [/^(选择|已审核参考)帧 (\d+)$/, (match, action, frame) => `${action === "选择" ? "Select" : "Reviewed reference"} frame ${frame}`],
    [/^帧 (\d+) · (只读参考|Mask 微调)$/, (match, frame, mode) => `Frame ${frame} · ${ENGLISH_TEXT[mode]}`],
    [/^放大(微调|查看)帧 (\d+)$/, (match, action, frame) => `${action === "微调" ? "Edit" : "View"} frame ${frame}`],
    [/^(.*) 第 (\d+) 帧候选 Mask$/, (match, clip, frame) => `${clip}, candidate Mask for frame ${frame}`],
    [/^正在用套索添加(.+) Mask。所有修改先保存在本次预览中。$/, (match, label) => `Adding the ${label} Mask with the lasso. Changes stay in this preview until confirmed.`],
    [/^正在用画笔填涂(.+) Mask。所有修改先保存在本次预览中。$/, (match, label) => `Painting the ${label} Mask. Changes stay in this preview until confirmed.`],
    [/^正在擦除(.+) Mask。所有修改先保存在本次预览中。$/, (match, label) => `Erasing the ${label} Mask. Changes stay in this preview until confirmed.`],
    [/^当前(.+) Mask 为空。请先用套索或画笔标出目标，再按 P 传播$/, (match, label) => `The current ${label} Mask is empty. Mark the target with the lasso or brush, then press P.`],
    [/^正在传播当前帧(.+) Mask…$/, (match, label) => `Propagating the current ${label} Mask…`],
    [/^SAM2 (.+)传播预览$/, (match, label) => `SAM2 ${label} propagation preview`],
    [/^人工关键帧 · (.+)双向传播$/, (match, label) => `Manual keyframe · bidirectional ${label} propagation`],
    [/^SAM2 已从当前关键帧向前 (\d+) 帧、向后 (\d+) 帧传播(.+) Mask。其它活动类别保留每帧原有内容。关键帧之前的已审核帧始终受保护。需要重写向后传播结果时，请开启“允许覆盖向后已审核帧”并手动勾选。$/, (match, before, after, label) => `SAM2 propagated the ${label} Mask ${before} previous frames and ${after} following frames from the current keyframe. Other active Mask categories keep each frame's existing content. Reviewed frames before the keyframe always stay protected. To replace following propagation results, enable “Allow overwriting following reviewed frames” and select them manually.`],
    [/^SAM2 已从当前关键帧向前 (\d+) 帧、向后 (\d+) 帧传播(.+) Mask。其它活动类别保留每帧原有内容。关键帧之前的已审核帧仍受保护。只有手动勾选的向后已审核帧会被重写。$/, (match, before, after, label) => `SAM2 propagated the ${label} Mask ${before} previous frames and ${after} following frames from the current keyframe. Other active Mask categories keep each frame's existing content. Reviewed frames before the keyframe remain protected. Only selected reviewed frames after the keyframe will be replaced.`],
    [/^通过选中 (\d+) 帧$/, "Accept $1 selected frames"],
    [/^确认保存这 (\d+) 帧 SAM2 传播预览中的 Mask 吗？(.*)$/s, (match, count, warning) => `Save the Masks from these ${count} SAM2 propagation preview frames?${englishText(warning)}`],
    [/^另有 (\d+) 张已微调帧未勾选，这些修改会被丢弃。$/, "$1 edited frames are not selected. Their changes will be discarded."],
    [/^其中 (\d+) 张已审核帧将被覆盖，原 Mask 会被替换。$/, "$1 reviewed frames will be overwritten and their existing Masks will be replaced."],
    [/^已保存 (\d+) 帧 SAM2 (.+)传播 Mask，取消勾选的帧仍保留待审核$/, (match, count, label) => `Saved SAM2 ${label} Masks for ${count} frames. Unselected frames remain pending.`],
    [/^已保存 (\d+) 帧 SAM2 (.+)传播 Mask，其中 (\d+) 张已审核帧已覆盖$/, (match, count, label, overwritten) => `Saved SAM2 ${label} Masks for ${count} frames and overwrote ${overwritten} reviewed frames.`],
    [/^(已套索填充|已画笔填涂|已擦除)(.+) Mask，按 Enter 保存$/, (match, action, label) => `${ENGLISH_TEXT[action]}${label} Mask. Press Enter to save.`],
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
  if (root.nodeType === Node.ELEMENT_NODE && root.closest?.("[data-no-translate]")) return;
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.parentElement?.closest("[data-no-translate]")) return;
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
    const element = walker.currentNode.nodeType === Node.ELEMENT_NODE
      ? walker.currentNode
      : walker.currentNode.parentElement;
    if (element?.closest?.("[data-no-translate]")) continue;
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
  masks: {},
  history: [],
  dirty: false,
  loading: false,
  saving: false,
  activeLabel: null,
  tool: "lasso",
  addTool: "lasso",
  brushSize: 24,
  zoom: 1,
  overlayVisible: {},
  displayCanvas: null,
  stage: null,
  viewport: null,
  drawing: false,
  lastPoint: null,
  gestureLabel: null,
  lassoPoints: [],
  strokePoints: [],
  batch: {
    propagatedLabel: null,
    requestId: 0,
    open: false,
    loading: false,
    saving: false,
    reviewToken: null,
    heartbeatId: null,
    overwriteReviewed: false,
    keyframeIndex: null,
    items: [],
    selected: new Set(),
    selectionAnchor: null,
    selectionDrag: {
      active: false,
      selecting: true,
      visited: new Set(),
      ignoreClickIndex: null,
    },
    error: "",
    editor: {
      open: false,
      position: 0,
      activeLabel: null,
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
  categoryDialogMode: "add",
  editingCategoryFolder: null,
  categorySaving: false,
  archiveSaving: false,
  categoryConflict: null,
  categoryDialogReturnFocus: null,
  archiveDialogReturnFocus: null,
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
    ? "DataSeg Mask Annotation"
    : "DataSeg Mask 标定";
  if (state.language === "en") {
    translateTree(app);
  } else {
    restoreChineseTree(app);
  }
}

function toggleLanguage() {
  state.language = state.language === "en" ? "zh-CN" : "en";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  refreshMaskArchiveDialog();
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

function maskCategories() {
  return state.manifest?.mask_categories || [];
}

function archivedMaskCategories() {
  return state.manifest?.archived_mask_categories || [];
}

function categoryFolders() {
  return maskCategories().map(({ folder_name: folderName }) => folderName);
}

function categoryFor(folderName) {
  return maskCategories().find(
    ({ folder_name: candidate }) => candidate === folderName,
  ) || null;
}

function nextAvailableMaskCategoryColor(categories = maskCategories()) {
  const used = new Set(
    categories.map(({ color }) => String(color).toUpperCase()),
  );
  return MASK_CATEGORY_COLOR_CANDIDATES.find(
    (color) => !used.has(color.toUpperCase()),
  ) || MASK_CATEGORY_COLOR_CANDIDATES[0];
}

function labelDisplayName(label) {
  return categoryFor(label)?.display_name || label || "Mask";
}

function labelColor(label) {
  return categoryFor(label)?.color || "#35C8D7";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hasMaskCategories() {
  return maskCategories().length > 0;
}

function masksReady() {
  return hasMaskCategories() && categoryFolders().every(
    (folderName) => Boolean(state.masks[folderName]),
  );
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

function categoryRowsMarkup() {
  if (!hasMaskCategories()) {
    return `
      <div class="mask-category-empty">
        <p>还没有 Mask 类别。先定义要标记的内容。</p>
        <button class="plain-button mask-category-empty-button" data-action="add-mask-category">添加第一个类别</button>
      </div>`;
  }
  return maskCategories().map((category, index) => {
    const folderName = escapeHtml(category.folder_name);
    const displayName = escapeHtml(category.display_name);
    const color = escapeHtml(category.color);
    return `
      <div class="mask-category-row" data-category-row="${folderName}" style="--category-color: ${color}">
        <button class="mask-category-select" data-action="label" data-label="${folderName}" title="${displayName}" aria-label="选择 ${displayName}，快捷键 ${index + 1}">
          <span class="mask-category-swatch"></span>
          <span class="mask-category-name" data-no-translate title="${displayName}">${displayName}</span>
          <kbd>${index + 1}</kbd>
        </button>
        <button class="mask-category-visibility" type="button" data-action="toggle-mask-category" data-label="${folderName}" aria-pressed="true" title="隐藏 ${displayName} Mask" aria-label="隐藏 ${displayName} Mask">隐藏</button>
        <button class="mask-category-menu-trigger" type="button" popovertarget="mask-category-menu-${folderName}" data-category-menu-trigger="${folderName}" data-category-management title="管理 ${displayName}" aria-label="管理 ${displayName}">管理</button>
        <div class="mask-category-menu-panel" id="mask-category-menu-${folderName}" data-category-menu="${folderName}" popover>
          <button type="button" data-action="edit-mask-category" data-label="${folderName}" data-category-management>编辑</button>
          <button type="button" class="danger" data-action="archive-mask-category" data-label="${folderName}" data-category-management>删除</button>
        </div>
      </div>`;
  }).join("");
}

function maskCategoriesMarkup() {
  const archiveCount = archivedMaskCategories().length;
  return `
    <div class="mask-category-block" data-role="mask-category-block">
      <div class="mask-category-heading">
        <span><strong>Mask 类别</strong> <small>${maskCategories().length} / ${MAX_MASK_CATEGORIES}</small></span>
        <button class="plain-button mask-category-add" data-action="add-mask-category" data-category-management${maskCategories().length >= MAX_MASK_CATEGORIES ? " disabled" : ""}>添加</button>
      </div>
      <div class="mask-category-list">${categoryRowsMarkup()}</div>
      <footer class="mask-category-archive-footer">
        <button class="mask-category-archive-placeholder" type="button" data-action="open-mask-archives" aria-haspopup="dialog"${archiveCount ? "" : " disabled"} title="${archiveCount ? `查看 ${archiveCount} 个归档类别` : "暂无归档类别"}">
          <span>归档恢复</span><small>${archiveCount ? `${archiveCount} 个归档` : "暂无归档类别"}</small>
        </button>
      </footer>
    </div>`;
}

function formatArchiveTime(value) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  return new Intl.DateTimeFormat(
    state.language === "en" ? "en" : "zh-CN",
    { dateStyle: "medium", timeStyle: "short" },
  ).format(timestamp);
}

function archiveRowsMarkup({ conflict = false } = {}) {
  const archives = conflict
    ? state.categoryConflict?.archives || []
    : archivedMaskCategories();
  if (!archives.length) {
    return '<p class="mask-archive-empty">归档列表为空。</p>';
  }
  return archives.map((archive) => {
    const archiveId = escapeHtml(archive.archive_id);
    const displayName = escapeHtml(archive.display_name);
    const folderName = escapeHtml(archive.folder_name);
    const color = escapeHtml(archive.color);
    const action = conflict
      ? "restore-conflicting-archive"
      : "restore-mask-category";
    return `
      <article class="mask-category-archive-row" style="--category-color: ${color}">
        <span class="mask-category-archive-swatch" aria-hidden="true"></span>
        <span class="mask-category-archive-details">
          <strong data-no-translate title="${displayName}">${displayName}</strong>
          <code data-no-translate title="${folderName}">${folderName}</code>
          <small><span>归档时间</span> <time datetime="${escapeHtml(archive.archived_at)}">${escapeHtml(formatArchiveTime(archive.archived_at))}</time></small>
        </span>
        <button class="plain-button" type="button" data-action="${action}" data-archive-id="${archiveId}"${maskCategories().length >= MAX_MASK_CATEGORIES ? ' disabled title="活动类别已达到 5 个，请先归档一个类别再恢复。"' : ""}>恢复</button>
      </article>`;
  }).join("");
}

function maskArchiveDialogMarkup() {
  return `
    <div class="mask-category-modal" data-role="mask-archive-modal" hidden>
      <button class="mask-category-backdrop" data-action="close-mask-archives" aria-label="关闭归档列表"></button>
      <section class="mask-category-dialog mask-archive-dialog" role="dialog" aria-modal="true" aria-labelledby="mask-archive-title">
        <header>
          <h2 id="mask-archive-title">归档的 Mask 类别</h2>
          <button class="mask-category-close-button" type="button" data-action="close-mask-archives">关闭</button>
        </header>
        <p class="mask-category-intro">归档类别保存在当前项目中，可以恢复原有 Mask。</p>
        <div class="mask-category-archive-list" data-role="mask-archive-list">${archiveRowsMarkup()}</div>
        <p class="mask-category-error" data-bind="mask-archive-error" role="alert"></p>
      </section>
    </div>`;
}

function maskCategoryConflictDialogMarkup() {
  return `
    <div class="mask-category-modal" data-role="mask-category-conflict-modal" hidden>
      <button class="mask-category-backdrop" data-action="cancel-mask-category-conflict" aria-label="返回编辑"></button>
      <section class="mask-category-dialog mask-category-conflict-dialog" role="dialog" aria-modal="true" aria-labelledby="mask-category-conflict-title">
        <header>
          <h2 id="mask-category-conflict-title">发现同名归档</h2>
          <button class="mask-category-close-button" type="button" data-action="cancel-mask-category-conflict">返回编辑</button>
        </header>
        <p class="mask-category-intro">这个文件夹已有归档数据。选择恢复旧数据，或保留归档并以当前输入新建空类别。</p>
        <div class="mask-category-archive-list" data-role="mask-category-conflict-list"></div>
        <p class="mask-category-error" data-bind="mask-category-conflict-error" role="alert"></p>
        <footer>
          <button class="plain-button" type="button" data-action="cancel-mask-category-conflict">取消</button>
          <button class="save-button" type="button" data-action="start-empty-mask-category">以当前输入新建空类别</button>
        </footer>
      </section>
    </div>`;
}

function toolsMarkup() {
  return `
    <div class="tool-stack">
      <div class="mode-selector" aria-label="添加 Mask 方式">
        <button class="plain-button" data-action="tool" data-tool="lasso">套索 <kbd>Q</kbd></button>
        <button class="plain-button" data-action="tool" data-tool="paint">画笔 <kbd>W</kbd></button>
      </div>
      <button class="tool-button eraser" data-action="tool" data-tool="erase">
        <span class="tool-dot"></span><span>橡皮 · <b data-bind="eraser-label">Mask</b> <kbd>E</kbd></span>
      </button>
      <p class="tool-help" data-bind="tool-help">按住并沿边界圈画，松开后自动闭合并填充。</p>
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
    <p class="meta-picker-help">选择片段后跳到首张待审核帧，也可直接选择帧。</p>
    <button class="plain-button pending-jump-button" data-action="jump-unreviewed">
      跳转到下一张未审核
    </button>`;
}

function navigationMarkup() {
  return `
    <div class="navigation-controls">
      <button class="plain-button" data-action="previous">← 上一张</button>
      <button class="plain-button" data-action="next">下一张 →</button>
    </div>
    <button class="plain-button propagation-open-button" data-action="sam2-propagate">
      SAM2 传播 Mask <kbd>P</kbd>
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

function maskCategoryDialogMarkup() {
  return `
    <div class="mask-category-modal" data-role="mask-category-modal" hidden>
      <button class="mask-category-backdrop" data-action="close-mask-category" aria-label="关闭"></button>
      <section class="mask-category-dialog" role="dialog" aria-modal="true" aria-labelledby="mask-category-title">
        <header>
          <div>
            <h2 id="mask-category-title" data-bind="mask-category-title">添加 Mask 类别</h2>
          </div>
          <button class="mask-category-close-button" type="button" data-action="close-mask-category" aria-label="关闭">关闭</button>
        </header>
        <p class="mask-category-intro" data-bind="mask-category-intro">名称显示在标定界面中。文件夹名保存后不能修改。</p>
        <form data-form="mask-category">
          <label>
            <span>显示名称</span>
            <input name="display_name" maxlength="80" autocomplete="off" required placeholder="例如：神经" />
          </label>
          <label>
            <span>文件夹名字</span>
            <input name="folder_name" maxlength="32" pattern="[a-z][a-z0-9_\\-]{0,31}" autocomplete="off" required placeholder="例如：nerve" />
            <small>小写字母开头，只能使用小写字母、数字、下划线和连字符。</small>
          </label>
          <label>
            <span>覆盖颜色</span>
            <span class="mask-color-control">
              <input type="color" name="color" value="#0072B2" required />
              <output data-bind="mask-category-color">#0072B2</output>
              <small>覆盖透明度固定为 44%</small>
            </span>
          </label>
          <p class="mask-category-error" data-bind="mask-category-error" role="alert"></p>
          <footer>
            <button class="plain-button" type="button" data-action="close-mask-category">取消</button>
            <button class="save-button" type="submit" data-action="submit-mask-category" data-bind="submit-mask-category">添加类别</button>
          </footer>
        </form>
      </section>
    </div>`;
}

function batchCategoryButtonsMarkup() {
  return maskCategories().map((category, index) => `
    <button class="tool-button" data-action="batch-editor-label" data-label="${escapeHtml(category.folder_name)}" style="--category-color: ${escapeHtml(category.color)}">
      <span class="tool-dot"></span><span data-no-translate>${escapeHtml(category.display_name)} Mask <kbd>${index + 1}</kbd></span>
    </button>`).join("");
}

function batchReviewMarkup() {
  return `
    <div class="batch-modal" data-role="batch-modal" hidden>
      <button class="batch-backdrop" data-action="batch-close" aria-label="关闭传播审核"></button>
      <section class="batch-dialog" role="dialog" aria-modal="true" aria-labelledby="batch-title">
        <div class="batch-overview" data-role="batch-overview">
          <header class="batch-header">
            <div>
              <p class="batch-eyebrow" data-bind="batch-eyebrow">人工关键帧 · Mask 双向传播</p>
              <h2 id="batch-title" data-bind="batch-title">SAM2 Mask 传播预览</h2>
            </div>
            <button class="batch-close-button" data-action="batch-close" aria-label="关闭">关闭</button>
          </header>
          <p class="batch-guidance" data-bind="batch-guidance"></p>
          <label class="batch-overwrite-option">
            <input type="checkbox" data-control="batch-overwrite-reviewed" />
            <span>
              <strong>允许覆盖向后已审核帧</strong>
              <small>关键帧之前的已审核帧始终受保护</small>
            </span>
          </label>
          <div class="batch-grid" data-role="batch-grid"></div>
          <p class="batch-error" data-bind="batch-error"></p>
          <footer class="batch-footer">
            <div>
              <div class="batch-selection"><strong data-bind="batch-count">0</strong> 帧已选</div>
              <p class="batch-selection-help">Shift 连选 · 按住勾选框拖动可批量选择或取消</p>
            </div>
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
              <button class="batch-close-button" data-action="batch-editor-done" aria-label="返回传播预览">关闭</button>
            </div>
          </header>
          <div class="batch-editor-body">
            <aside class="batch-editor-tools">
              <div class="batch-category-buttons" data-role="batch-category-buttons">${batchCategoryButtonsMarkup()}</div>
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
                <button class="plain-button danger" data-action="batch-editor-clear">
                  清空全部 <kbd>X</kbd>
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
          <section class="rail-section mask-category-section">${maskCategoriesMarkup()}</section>
          <section class="rail-section"><h2 class="panel-title">编辑工具</h2>${toolsMarkup()}</section>
          <section class="rail-section"><h2 class="panel-title">笔刷大小</h2>${brushMarkup()}</section>
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
    ${batchReviewMarkup()}
    ${maskCategoryDialogMarkup()}
    ${maskArchiveDialogMarkup()}
    ${maskCategoryConflictDialogMarkup()}`;
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

function nextUnreviewedIndex() {
  const items = state.manifest?.items || [];
  for (let offset = 1; offset <= items.length; offset += 1) {
    const candidateIndex = (state.index + offset) % items.length;
    if (!items[candidateIndex].reviewed) return candidateIndex;
  }
  return null;
}

async function jumpToNextUnreviewed() {
  const targetIndex = nextUnreviewedIndex();
  if (targetIndex === null) {
    setStatus("所有图像均已审核", "success");
    return;
  }
  if (targetIndex === state.index) {
    setStatus("当前图像就是唯一待审核帧");
    return;
  }
  await jumpToImage(targetIndex, "已跳转到下一张待审核帧");
}

function categoryManagementBusy() {
  return (
    state.loading ||
    state.saving ||
    state.categorySaving ||
    state.archiveSaving ||
    state.batch.open ||
    state.batch.loading ||
    state.batch.saving ||
    state.batch.editor.open
  );
}

function localizedText(value) {
  return state.language === "en" ? englishText(value) : value;
}

function categoryDestructiveOperationBlocked() {
  if (state.dirty) {
    const message = "当前帧有未保存修改，请先保存或丢弃后再管理类别。";
    setStatus(message, "error");
    window.alert(localizedText(message));
    return true;
  }
  if (categoryManagementBusy()) {
    const message = "类别操作正在进行，请稍后再试。";
    setStatus(message, "error");
    return true;
  }
  return false;
}

function syncCategoryManagementControls() {
  const managementBusy = categoryManagementBusy();
  all("[data-category-management]").forEach((button) => {
    button.disabled =
      managementBusy ||
      (button.dataset.action === "add-mask-category" &&
        maskCategories().length >= MAX_MASK_CATEGORIES);
  });
  all('[data-action="open-mask-archives"]').forEach((button) => {
    button.disabled = managementBusy || archivedMaskCategories().length === 0;
  });
  all('[data-action="restore-mask-category"], [data-action="restore-conflicting-archive"]').forEach((button) => {
    button.disabled =
      managementBusy || maskCategories().length >= MAX_MASK_CATEGORIES;
  });
  if (managementBusy) {
    all("[data-category-menu]:popover-open").forEach((menu) => menu.hidePopover());
  }
}

function wireMaskCategoryListControls(root = document) {
  root.querySelectorAll('[data-action="label"]').forEach((button) => {
    button.addEventListener("click", () => selectLabel(button.dataset.label));
  });
  root.querySelectorAll('[data-action="add-mask-category"]').forEach((button) => {
    button.addEventListener("click", () => openMaskCategoryDialog());
  });
  root.querySelectorAll('[data-action="toggle-mask-category"]').forEach((button) => {
    button.addEventListener("click", () => toggleMask(button.dataset.label));
  });
  root.querySelectorAll('[data-action="edit-mask-category"]').forEach((button) => {
    button.addEventListener("click", () => openMaskCategoryDialog(button.dataset.label));
  });
  root.querySelectorAll('[data-action="archive-mask-category"]').forEach((button) => {
    button.addEventListener("click", () => requestMaskCategoryArchive(button.dataset.label));
  });
  root.querySelectorAll('[data-action="open-mask-archives"]').forEach((button) => {
    button.addEventListener("click", openMaskArchiveDialog);
  });
  root.querySelectorAll("[data-category-menu-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (categoryManagementBusy()) {
        event.preventDefault();
        return;
      }
      const menu = document.querySelector(
        `[data-category-menu="${CSS.escape(trigger.dataset.categoryMenuTrigger)}"]`,
      );
      if (!menu) return;
      const bounds = trigger.getBoundingClientRect();
      menu.style.left = `${Math.max(8, bounds.right - 92)}px`;
      menu.style.top = `${Math.min(window.innerHeight - 92, bounds.bottom + 5)}px`;
    });
  });
}

function wireBatchCategoryButtons(root = document) {
  root.querySelectorAll('[data-action="batch-editor-label"]').forEach((button) => {
    button.addEventListener("click", () =>
      selectBatchEditorLabel(button.dataset.label),
    );
  });
}

function refreshMaskCategoryControls() {
  const categoryBlock = document.querySelector('[data-role="mask-category-block"]');
  if (categoryBlock) categoryBlock.outerHTML = maskCategoriesMarkup();
  const refreshedCategoryBlock = document.querySelector('[data-role="mask-category-block"]');
  if (refreshedCategoryBlock) wireMaskCategoryListControls(refreshedCategoryBlock);

  const batchButtons = document.querySelector('[data-role="batch-category-buttons"]');
  if (batchButtons) {
    batchButtons.innerHTML = batchCategoryButtonsMarkup();
    wireBatchCategoryButtons(batchButtons);
  }
  refreshMaskArchiveDialog();
  syncUi();
  renderCanvas();
  applyLanguage();
}

function refreshMaskArchiveDialog() {
  const list = document.querySelector('[data-role="mask-archive-list"]');
  if (!list) return;
  list.innerHTML = archiveRowsMarkup();
  wireMaskArchiveControls(list);
}

function wireMaskArchiveControls(root = document) {
  root.querySelectorAll('[data-action="restore-mask-category"]').forEach((button) => {
    button.addEventListener("click", () => restoreMaskCategory(button.dataset.archiveId));
  });
}

function requestMaskCategoryArchive(folderName) {
  if (!categoryFor(folderName)) return;
  const menu = document.querySelector(`[data-category-menu="${CSS.escape(folderName)}"]`);
  if (menu?.matches(":popover-open")) menu.hidePopover();
  if (categoryDestructiveOperationBlocked()) return;
  const category = categoryFor(folderName);
  const confirmed = window.confirm(
    state.language === "en"
      ? `Delete “${category.display_name}”? Its Masks will move into this project's recoverable archive.`
      : `删除“${category.display_name}”类别？它的 Mask 会移入当前项目的可恢复归档。`,
  );
  if (!confirmed) return;
  archiveMaskCategory(folderName);
}

function removeCategoryCanvasState(folderName) {
  delete state.masks[folderName];
  delete state.overlayVisible[folderName];
  state.history.forEach((snapshot) => delete snapshot[folderName]);
}

function activateCategoryAfterRemoval(removedIndex) {
  const categories = maskCategories();
  const category = categories[Math.min(removedIndex, categories.length - 1)] || null;
  state.activeLabel = category?.folder_name || null;
  if (state.activeLabel) state.overlayVisible[state.activeLabel] = true;
  state.batch.propagatedLabel = state.activeLabel;
  state.batch.editor.activeLabel = state.activeLabel;
}

function focusCurrentCategoryControl() {
  requestAnimationFrame(() => {
    const target = state.activeLabel
      ? document.querySelector(
          `[data-action="label"][data-label="${CSS.escape(state.activeLabel)}"]`,
        )
      : document.querySelector('[data-action="add-mask-category"]');
    target?.focus();
  });
}

async function archiveMaskCategory(folderName) {
  const removedIndex = maskCategories().findIndex(
    ({ folder_name: candidate }) => candidate === folderName,
  );
  if (removedIndex < 0) return;
  const category = maskCategories()[removedIndex];
  state.archiveSaving = true;
  setStatus("正在归档…");
  syncUi();
  try {
    const response = await fetch(
      `/api/mask-categories/${encodeURIComponent(folderName)}`,
      { method: "DELETE", headers: projectHeaders() },
    );
    const archived = await response.json();
    if (!response.ok) throw new Error(archived.error || "无法归档 Mask 类别");
    state.manifest.mask_categories.splice(removedIndex, 1);
    state.manifest.archived_mask_categories ||= [];
    state.manifest.archived_mask_categories.push(archived);
    removeCategoryCanvasState(folderName);
    if (state.activeLabel === folderName) {
      activateCategoryAfterRemoval(removedIndex);
    }
    state.archiveSaving = false;
    refreshMaskCategoryControls();
    focusCurrentCategoryControl();
    setStatus(`已归档 ${category.display_name} Mask，可从归档恢复`, "success");
  } catch (error) {
    state.archiveSaving = false;
    setStatus(error.message, "error");
    syncUi();
  }
}

function openMaskArchiveDialog(event) {
  if (categoryManagementBusy() || !archivedMaskCategories().length) return;
  const modal = document.querySelector('[data-role="mask-archive-modal"]');
  if (!modal) return;
  state.archiveDialogReturnFocus = event?.currentTarget || document.activeElement;
  refreshMaskArchiveDialog();
  setBoundText("mask-archive-error", "");
  modal.hidden = false;
  document.body.classList.add("mask-category-modal-open");
  applyLanguage();
  requestAnimationFrame(() => {
    modal.querySelector('[data-action="restore-mask-category"]')
      ?.focus();
  });
}

function closeMaskArchiveDialog() {
  if (state.archiveSaving) return;
  const modal = document.querySelector('[data-role="mask-archive-modal"]');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("mask-category-modal-open");
  const returnFocus = state.archiveDialogReturnFocus;
  state.archiveDialogReturnFocus = null;
  if (returnFocus?.isConnected) requestAnimationFrame(() => returnFocus.focus());
}

async function restoreMaskCategory(archiveId, { fromConflict = false } = {}) {
  if (categoryDestructiveOperationBlocked()) return false;
  if (maskCategories().length >= MAX_MASK_CATEGORIES) {
    const message = "活动类别已达到 5 个，请先归档一个类别再恢复。";
    setBoundText(
      fromConflict ? "mask-category-conflict-error" : "mask-archive-error",
      message,
    );
    setStatus(message, "error");
    return false;
  }
  state.archiveSaving = true;
  setBoundText(
    fromConflict ? "mask-category-conflict-error" : "mask-archive-error",
    "",
  );
  syncCategoryManagementControls();
  try {
    const response = await fetch(
      `/api/mask-archives/${encodeURIComponent(archiveId)}/restore`,
      {
        method: "POST",
        headers: projectHeaders(),
        body: "{}",
      },
    );
    const category = await response.json();
    if (!response.ok) throw new Error(category.error || "无法恢复 Mask 类别");
    state.manifest.mask_categories.push(category);
    state.manifest.archived_mask_categories = archivedMaskCategories().filter(
      ({ archive_id: candidate }) => candidate !== archiveId,
    );
    state.activeLabel = category.folder_name;
    state.overlayVisible[category.folder_name] = true;
    state.batch.propagatedLabel = state.activeLabel;
    state.batch.editor.activeLabel = state.activeLabel;
    state.archiveSaving = false;
    if (fromConflict) {
      closeMaskCategoryConflict(false);
      closeMaskCategoryDialog();
    }
    closeMaskArchiveDialog();
    refreshMaskCategoryControls();
    if (state.sourceImage) {
      await loadItem(
        state.index,
        true,
        `已恢复 ${category.display_name} Mask 和归档数据`,
      );
    } else {
      setStatus(`已恢复 ${category.display_name} Mask 和归档数据`, "success");
    }
    focusCurrentCategoryControl();
    return true;
  } catch (error) {
    state.archiveSaving = false;
    setBoundText(
      fromConflict ? "mask-category-conflict-error" : "mask-archive-error",
      error.message,
    );
    setStatus(error.message, "error");
    syncUi();
    return false;
  }
}

function showMaskCategoryConflict(payload, archives) {
  state.categoryConflict = { payload, archives };
  const categoryModal = document.querySelector('[data-role="mask-category-modal"]');
  const conflictModal = document.querySelector(
    '[data-role="mask-category-conflict-modal"]',
  );
  const list = document.querySelector('[data-role="mask-category-conflict-list"]');
  if (!categoryModal || !conflictModal || !list) return;
  list.innerHTML = archiveRowsMarkup({ conflict: true });
  list.querySelectorAll('[data-action="restore-conflicting-archive"]').forEach((button) => {
    button.addEventListener("click", () =>
      restoreMaskCategory(button.dataset.archiveId, { fromConflict: true }),
    );
  });
  setBoundText("mask-category-conflict-error", "");
  categoryModal.hidden = true;
  conflictModal.hidden = false;
  applyLanguage();
  requestAnimationFrame(() => {
    conflictModal.querySelector('[data-action="restore-conflicting-archive"]')
      ?.focus();
  });
}

function closeMaskCategoryConflict(returnToForm = true) {
  if (state.categorySaving || state.archiveSaving) return;
  const conflictModal = document.querySelector(
    '[data-role="mask-category-conflict-modal"]',
  );
  const categoryModal = document.querySelector('[data-role="mask-category-modal"]');
  if (conflictModal) conflictModal.hidden = true;
  state.categoryConflict = null;
  if (returnToForm && categoryModal) {
    categoryModal.hidden = false;
    requestAnimationFrame(() => {
      categoryModal.querySelector('[name="folder_name"]')?.focus();
    });
  }
}

function focusableDialogElements(modal) {
  return [...modal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => element.offsetParent !== null);
}

function trapDialogFocus(event, modal) {
  if (event.key !== "Tab") return;
  const focusable = focusableDialogElements(modal);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function wireControls() {
  all('[data-action="language"]').forEach((button) => {
    button.addEventListener("click", toggleLanguage);
  });
  wireMaskCategoryListControls();
  wireMaskArchiveControls();
  wireBatchCategoryButtons();
  all('[data-action="close-mask-category"]').forEach((button) => {
    button.addEventListener("click", closeMaskCategoryDialog);
  });
  all('[data-action="close-mask-archives"]').forEach((button) => {
    button.addEventListener("click", closeMaskArchiveDialog);
  });
  all('[data-action="cancel-mask-category-conflict"]').forEach((button) => {
    button.addEventListener("click", () => closeMaskCategoryConflict(true));
  });
  all('[data-action="start-empty-mask-category"]').forEach((button) => {
    button.addEventListener("click", startEmptyMaskCategory);
  });
  const categoryForm = document.querySelector('[data-form="mask-category"]');
  if (categoryForm) {
    categoryForm.addEventListener("submit", submitMaskCategory);
    const colorInput = categoryForm.elements.color;
    colorInput.addEventListener("input", () => {
      setBoundText("mask-category-color", colorInput.value.toUpperCase());
    });
  }
  all('[data-action="tool"]').forEach((button) => {
    button.addEventListener("click", () => setDrawTool(button.dataset.tool));
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
  all('[data-action="jump-unreviewed"]').forEach((button) =>
    button.addEventListener("click", jumpToNextUnreviewed),
  );
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
  all('[data-action="sam2-propagate"]').forEach((button) => button.addEventListener("click", openSam2Propagation));
  all('[data-action="batch-close"]').forEach((button) =>
    button.addEventListener("click", () => closeBatchReview(false)),
  );
  all('[data-action="batch-select-all"]').forEach((button) => button.addEventListener("click", selectAllBatchItems));
  all('[data-action="batch-clear"]').forEach((button) => button.addEventListener("click", clearBatchSelection));
  all('[data-control="batch-overwrite-reviewed"]').forEach((input) =>
    input.addEventListener("change", () =>
      setBatchReviewedOverwrite(input.checked),
    ),
  );
  all('[data-action="batch-accept"]').forEach((button) => button.addEventListener("click", acceptBatchCandidates));
  all('[data-action="batch-editor-done"]').forEach((button) => button.addEventListener("click", closeBatchEditor));
  all('[data-action="batch-editor-previous"]').forEach((button) =>
    button.addEventListener("click", () => moveBatchEditor(-1)),
  );
  all('[data-action="batch-editor-next"]').forEach((button) =>
    button.addEventListener("click", () => moveBatchEditor(1)),
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
  all('[data-action="batch-editor-clear"]').forEach((button) =>
    button.addEventListener("click", clearBatchEditorMasks),
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
  window.addEventListener("pointermove", continueBatchSelectionDragFromPoint);
  window.addEventListener("pointerup", endBatchSelectionDrag);
  window.addEventListener("pointercancel", endBatchSelectionDrag);
}

function openMaskCategoryDialog(folderName = null) {
  if (categoryManagementBusy()) return;
  const modal = document.querySelector('[data-role="mask-category-modal"]');
  const form = document.querySelector('[data-form="mask-category"]');
  const category = folderName ? categoryFor(folderName) : null;
  if (!modal || !form || (folderName && !category)) return;
  if (!category && maskCategories().length >= MAX_MASK_CATEGORIES) return;

  state.categoryDialogReturnFocus = document.activeElement;
  state.categoryDialogMode = category ? "edit" : "add";
  state.editingCategoryFolder = category?.folder_name || null;
  form.reset();
  const submitButton = form.querySelector('[data-action="submit-mask-category"]');
  if (submitButton) submitButton.disabled = false;
  form.elements.display_name.value = category?.display_name || "";
  form.elements.folder_name.value = category?.folder_name || "";
  form.elements.folder_name.readOnly = Boolean(category);
  form.elements.color.value = category?.color || nextAvailableMaskCategoryColor();
  setBoundText(
    "mask-category-title",
    category ? "编辑 Mask 类别" : "添加 Mask 类别",
  );
  setBoundText(
    "mask-category-intro",
    category
      ? "名称和颜色会立即更新。文件夹名保持不变。"
      : "名称显示在标定界面中。文件夹名保存后不能修改。",
  );
  setBoundText(
    "submit-mask-category",
    category ? "保存修改" : "添加类别",
  );
  setBoundText("mask-category-color", form.elements.color.value.toUpperCase());
  setBoundText("mask-category-error", "");
  if (category) {
    const menu = document.querySelector(
      `[data-category-menu="${CSS.escape(category.folder_name)}"]`,
    );
    if (menu?.matches(":popover-open")) menu.hidePopover();
  }
  modal.hidden = false;
  document.body.classList.add("mask-category-modal-open");
  requestAnimationFrame(() => form.elements.display_name.focus());
}

function closeMaskCategoryDialog() {
  if (state.categorySaving || state.archiveSaving) return;
  const modal = document.querySelector('[data-role="mask-category-modal"]');
  if (!modal) return;
  modal.hidden = true;
  const conflictModal = document.querySelector(
    '[data-role="mask-category-conflict-modal"]',
  );
  if (conflictModal) conflictModal.hidden = true;
  document.body.classList.remove("mask-category-modal-open");
  state.categoryDialogMode = "add";
  state.editingCategoryFolder = null;
  state.categoryConflict = null;
  const returnFocus = state.categoryDialogReturnFocus;
  state.categoryDialogReturnFocus = null;
  if (returnFocus?.isConnected) requestAnimationFrame(() => returnFocus.focus());
}

function applyMaskCategoryMutation(result, editing) {
  const category = result.category || result;
  if (editing) {
    const index = maskCategories().findIndex(
      ({ folder_name: folder }) => folder === category.folder_name,
    );
    if (index >= 0) state.manifest.mask_categories[index] = category;
  } else {
    state.manifest.mask_categories.push(category);
    state.activeLabel = category.folder_name;
    state.overlayVisible[category.folder_name] = true;
    state.batch.propagatedLabel = state.activeLabel;
    state.batch.editor.activeLabel = state.activeLabel;
    if (state.sourceImage) addBlankCategoryToCurrentFrame(category.folder_name);
  }
  state.categorySaving = false;
  closeMaskCategoryConflict(false);
  closeMaskCategoryDialog();
  refreshMaskCategoryControls();
  setStatus(
    editing
      ? `已更新 ${category.display_name} Mask`
      : result.backfilled_count > 0
      ? `已添加 ${category.display_name} Mask，并为 ${result.backfilled_count} 个已审核帧补全空 Mask`
      : `已添加 ${category.display_name} Mask`,
    "success",
  );
}

async function submitMaskCategory(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const submitButton = form.querySelector('[data-action="submit-mask-category"]');
  const editing = state.categoryDialogMode === "edit";
  const payload = {
    display_name: form.elements.display_name.value.trim(),
    color: form.elements.color.value.toUpperCase(),
  };
  if (!editing) payload.folder_name = form.elements.folder_name.value.trim();
  const requestUrl = editing
    ? `/api/mask-categories/${encodeURIComponent(state.editingCategoryFolder)}`
    : "/api/mask-categories";
  state.categorySaving = true;
  submitButton.disabled = true;
  submitButton.textContent = editing ? "正在更新…" : "正在添加…";
  setBoundText("mask-category-error", "");
  try {
    const response = await fetch(requestUrl, {
      method: editing ? "PATCH" : "POST",
      headers: projectHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      if (
        !editing &&
        response.status === 409 &&
        result.code === "archived_folder_conflict" &&
        Array.isArray(result.archives)
      ) {
        state.categorySaving = false;
        submitButton.disabled = false;
        submitButton.textContent = "添加类别";
        showMaskCategoryConflict(payload, result.archives);
        return;
      }
      throw new Error(
        result.error || (editing ? "无法更新 Mask 类别" : "无法添加 Mask 类别"),
      );
    }
    applyMaskCategoryMutation(result, editing);
  } catch (error) {
    state.categorySaving = false;
    setBoundText("mask-category-error", error.message);
    submitButton.disabled = false;
    submitButton.textContent = editing ? "保存修改" : "添加类别";
  }
}

async function startEmptyMaskCategory() {
  const conflict = state.categoryConflict;
  if (!conflict || state.categorySaving || state.archiveSaving) return;
  const payload = {
    ...conflict.payload,
    archive_action: "start_empty",
  };
  state.categorySaving = true;
  setBoundText("mask-category-conflict-error", "");
  syncCategoryManagementControls();
  try {
    const response = await fetch("/api/mask-categories", {
      method: "POST",
      headers: projectHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "无法新建空 Mask 类别");
    }
    applyMaskCategoryMutation(result, false);
  } catch (error) {
    state.categorySaving = false;
    setBoundText("mask-category-conflict-error", error.message);
    syncUi();
  }
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
  setBoundText("eraser-label", labelDisplayName(state.activeLabel));
  setBoundText(
    "tool-help",
    state.tool === "lasso"
      ? "沿目标边界圈画，松开后自动闭合并填充。"
      : state.tool === "paint"
      ? "按住鼠标直接填涂，适合横断面和局部补画。"
      : `按住鼠标擦除${labelDisplayName(state.activeLabel)} Mask。`,
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
    button.disabled = state.loading || state.saving;
  });
  syncCategoryManagementControls();
  all('[data-action="toggle-mask-category"]').forEach((button) => {
    const category = categoryFor(button.dataset.label);
    const visible = Boolean(state.overlayVisible[button.dataset.label]);
    const action = visible ? "隐藏" : "显示";
    button.textContent = action;
    button.setAttribute("aria-pressed", String(visible));
    button.setAttribute("title", `${action} ${category?.display_name || button.dataset.label} Mask`);
    button.setAttribute("aria-label", `${action} ${category?.display_name || button.dataset.label} Mask`);
    button.disabled = state.loading || state.saving;
    if (state.language === "en") translateTree(button);
  });
  all('[data-action="tool"]').forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === state.tool);
    button.disabled =
      state.loading ||
      state.saving ||
      !hasMaskCategories() ||
      !state.overlayVisible[state.activeLabel];
  });
  all('[data-action="undo"], [data-action="reset"], [data-action="toggle-all"], [data-action="clear-all"]').forEach((button) => {
    button.disabled = state.loading || state.saving || !hasMaskCategories();
  });
  all('[data-control="brush"]').forEach((input) => {
    input.value = String(state.brushSize);
  });
  all('[data-control="zoom"]').forEach((input) => {
    input.value = String(Math.round(state.zoom * 100));
  });
  all('[data-action="save"]').forEach((button) => {
    button.disabled = state.loading || state.saving || !masksReady();
    button.innerHTML = state.saving ? "正在保存…" : "保存并下一张 <kbd>Enter</kbd>";
  });
  all('[data-action="save-stay"]').forEach((button) => {
    button.disabled = state.loading || state.saving || !masksReady();
    button.innerHTML = state.saving ? "正在保存…" : "仅保存当前帧 <kbd>S</kbd>";
  });
  all('[data-action="sam2-propagate"]').forEach((button) => {
    button.disabled = state.loading || state.saving || state.batch.loading || state.batch.saving || !masksReady();
    button.innerHTML = `SAM2 传播${labelDisplayName(state.activeLabel)} <kbd>P</kbd>`;
  });
  const hasPendingItem = state.manifest.items.some(
    (manifestItem) => !manifestItem.reviewed,
  );
  all('[data-action="jump-unreviewed"]').forEach((button) => {
    button.disabled =
      state.loading ||
      state.saving ||
      state.batch.loading ||
      state.batch.saving ||
      !hasPendingItem;
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
  if (!categoryFolders().includes(label)) return;
  cancelGesture();
  state.activeLabel = label;
  state.overlayVisible[label] = true;
  state.tool = state.addTool;
  syncUi();
  renderCanvas();
}

function setDrawTool(tool) {
  if (!["lasso", "paint", "erase"].includes(tool)) return;
  if (!hasMaskCategories()) {
    openMaskCategoryDialog();
    return;
  }
  if (!state.overlayVisible[state.activeLabel]) return;
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

function addBlankCategoryToCurrentFrame(folderName) {
  const width = state.sourceImage.naturalWidth;
  const height = state.sourceImage.naturalHeight;
  const canvas = makeMaskCanvas(width, height);
  state.masks[folderName] = canvas;
  state.history.forEach((snapshot) => {
    snapshot[folderName] = canvas
      .getContext("2d", { willReadFrequently: true })
      .getImageData(0, 0, width, height);
  });
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
  const folders = categoryFolders();
  const images = await Promise.all(
    folders.map((folderName) =>
      loadImage(`/api/item/${index}/mask/${encodeURIComponent(folderName)}${suffix}`),
    ),
  );
  const width = state.sourceImage.naturalWidth;
  const height = state.sourceImage.naturalHeight;
  return Object.fromEntries(
    folders.map((folderName, position) => [
      folderName,
      maskCanvasFromImage(images[position], width, height),
    ]),
  );
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

function cloneMaskCanvas(source) {
  const canvas = makeMaskCanvas(source.width, source.height);
  canvas.getContext("2d").drawImage(source, 0, 0);
  return canvas;
}

function renderBatchPreview(sourceImage, masks) {
  const canvas = makeMaskCanvas(sourceImage.naturalWidth, sourceImage.naturalHeight);
  const context = canvas.getContext("2d");
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
  categoryFolders().forEach((folderName) => {
    if (masks[folderName]) drawTint(context, masks[folderName], labelColor(folderName));
  });
  context.globalAlpha = 1;
  return canvas.toDataURL("image/jpeg", 0.82);
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
  if (!categoryFolders().includes(item.label)) {
    throw new Error("SAM2 返回了未知的 Mask 类别");
  }
  const propagatedImage = await loadImage(item.mask);
  const propagatedLabel = item.label;
  const masks = Object.fromEntries(await Promise.all(
    categoryFolders()
      .filter((folderName) => folderName !== propagatedLabel)
      .map(async (folderName) => {
        if (item.index === state.index && state.dirty) {
          return [folderName, cloneMaskCanvas(state.masks[folderName])];
        }
        const preservedImage = await loadImage(
          `/api/item/${item.index}/mask/${encodeURIComponent(folderName)}`,
        );
        return [
          folderName,
          maskCanvasFromImage(
            preservedImage,
            sourceImage.naturalWidth,
            sourceImage.naturalHeight,
          ),
        ];
      }),
  ));
  masks[propagatedLabel] = maskCanvasFromImage(
    propagatedImage,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight,
  );
  return {
    index: item.index,
    item,
    masks,
    originalMasks: Object.fromEntries(
      categoryFolders().map((folderName) => [
        folderName,
        cloneMaskCanvas(masks[folderName]),
      ]),
    ),
    sourceImage,
    preview: renderBatchPreview(sourceImage, masks),
    selectable:
      !item.reviewed ||
      (
        state.batch.overwriteReviewed &&
        item.index > state.batch.keyframeIndex
      ),
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
  state.batch.propagatedLabel = propagationLabel;
  state.batch.editor.open = false;
  state.batch.open = true;
  state.batch.loading = true;
  stopSam2ReviewHeartbeat();
  state.batch.reviewToken = null;
  state.batch.overwriteReviewed = false;
  state.batch.keyframeIndex = keyframeIndex;
  state.batch.items = [];
  state.batch.selected = new Set();
  state.batch.selectionAnchor = null;
  state.batch.selectionDrag.active = false;
  state.batch.selectionDrag.visited = new Set();
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
    const reviewToken = typeof result.review_token === "string"
      ? result.review_token
      : null;
    if (!reviewToken) throw new Error("SAM2 传播审核状态无效");
    if (
      requestId !== state.batch.requestId ||
      !state.batch.open ||
      state.index !== keyframeIndex
    ) {
      releaseSam2Review(reviewToken);
      return;
    }
    state.batch.reviewToken = reviewToken;
    startSam2ReviewHeartbeat(reviewToken);
    const items = await Promise.all(result.items.map(loadSam2Preview));
    if (
      requestId !== state.batch.requestId ||
      !state.batch.open ||
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
    grid.innerHTML = '<div class="batch-empty">没有可以审核的传播帧。</div>';
    return;
  }
  grid.innerHTML = state.batch.items
    .map(({ index, item, preview, selectable = true, edited = false }) => {
      const selected = state.batch.selected.has(index);
      const badges = [
        item.is_keyframe ? '<span class="batch-card-badge keyframe">关键帧</span>' : "",
        item.reviewed
          ? `<span class="batch-card-badge ${selectable ? "overwrite" : "reference"}">${selectable ? "已审核 · 可覆盖" : "已审核参考"}</span>`
          : "",
        edited ? '<span class="batch-card-badge edited">已微调</span>' : "",
      ].join("");
      return `
      <article class="batch-card${selected ? " selected" : ""}${selectable ? "" : " reference"}${item.reviewed && selectable ? " overwrite-enabled" : ""}" data-batch-card="${index}">
        <button type="button" class="batch-select-toggle" data-batch-index="${index}" aria-label="${selectable ? "选择" : "已审核参考"}帧 ${item.frame_index}" aria-pressed="${selected}"${selectable ? "" : " disabled"}>
          <span class="batch-check">✓</span>
        </button>
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
  all("[data-batch-index]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      beginBatchSelectionDrag(button, event);
    });
    button.addEventListener("pointerenter", (event) => {
      continueBatchSelectionDrag(button, event);
    });
    button.addEventListener("click", (event) => {
      const index = Number(button.dataset.batchIndex);
      if (state.batch.selectionDrag.ignoreClickIndex === index) return;
      applyBatchSelection(
        index,
        !state.batch.selected.has(index),
        event.shiftKey,
      );
    });
  });
  all("[data-batch-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      openBatchEditor(Number(button.dataset.batchEdit));
    });
  });
}

function selectableBatchIndices() {
  return state.batch.items
    .filter(({ selectable = true }) => selectable)
    .map(({ index }) => index);
}

function setBatchReviewedOverwrite(enabled) {
  if (state.batch.loading || state.batch.saving) return;
  state.batch.overwriteReviewed = Boolean(enabled);
  state.batch.items.forEach((entry) => {
    entry.selectable =
      !entry.item.reviewed ||
      (
        state.batch.overwriteReviewed &&
        entry.index > state.batch.keyframeIndex
      );
  });
  if (!state.batch.overwriteReviewed) {
    state.batch.items
      .filter(({ item }) => item.reviewed)
      .forEach(({ index }) => state.batch.selected.delete(index));
    const editorItem = currentBatchEditorItem();
    if (editorItem?.item.reviewed) {
      cancelBatchEditorGesture(true);
      state.batch.editor.tool = "pan";
    }
  }
  state.batch.selectionAnchor = null;
  renderBatchGrid();
  syncBatchUi();
}

function setBatchItemSelection(index, selected) {
  const item = state.batch.items.find((entry) => entry.index === index);
  if (!item?.selectable) return;
  if (selected) {
    state.batch.selected.add(index);
  } else {
    state.batch.selected.delete(index);
  }
}

function applyBatchSelection(index, selected, extendRange = false) {
  const selectable = selectableBatchIndices();
  const targetPosition = selectable.indexOf(index);
  if (targetPosition < 0) return;
  const anchorPosition = selectable.indexOf(state.batch.selectionAnchor);
  if (extendRange && anchorPosition >= 0) {
    const start = Math.min(anchorPosition, targetPosition);
    const end = Math.max(anchorPosition, targetPosition);
    selectable.slice(start, end + 1).forEach((itemIndex) => {
      setBatchItemSelection(itemIndex, selected);
    });
  } else {
    setBatchItemSelection(index, selected);
    state.batch.selectionAnchor = index;
  }
  syncBatchUi();
}

function beginBatchSelectionDrag(button, event) {
  if (event.button !== 0 || button.disabled) return;
  event.preventDefault();
  button.focus({ preventScroll: true });
  const index = Number(button.dataset.batchIndex);
  const selecting = !state.batch.selected.has(index);
  state.batch.selectionDrag.active = true;
  state.batch.selectionDrag.selecting = selecting;
  state.batch.selectionDrag.visited = new Set([index]);
  state.batch.selectionDrag.ignoreClickIndex = index;
  applyBatchSelection(index, selecting, event.shiftKey);
}

function continueBatchSelectionDrag(button, event) {
  const drag = state.batch.selectionDrag;
  if (!drag.active || button.disabled || event.buttons === 0) return;
  const index = Number(button.dataset.batchIndex);
  if (drag.visited.has(index)) return;
  drag.visited.add(index);
  drag.ignoreClickIndex = index;
  setBatchItemSelection(index, drag.selecting);
  syncBatchUi();
}

function continueBatchSelectionDragFromPoint(event) {
  if (!state.batch.selectionDrag.active || event.buttons === 0) return;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const button = target?.closest?.("[data-batch-index]");
  if (button) continueBatchSelectionDrag(button, event);
}

function endBatchSelectionDrag() {
  const drag = state.batch.selectionDrag;
  if (!drag.active) return;
  drag.active = false;
  drag.visited = new Set();
  requestAnimationFrame(() => {
    drag.ignoreClickIndex = null;
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
  editor.activeLabel = state.batch.propagatedLabel;
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
  if (!item?.selectable || !categoryFolders().includes(label)) return;
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
    categoryFolders().forEach((folderName) => {
      drawTint(context, item.masks[folderName], labelColor(folderName));
    });
  }
  const editor = state.batch.editor;
  if (
    editor.drawing &&
    editor.tool === "lasso" &&
    editor.lassoPoints.length >= 2
  ) {
    const color = labelColor(editor.gestureLabel);
    context.save();
    tracePolygon(context, editor.lassoPoints);
    context.fillStyle = color;
    context.globalAlpha = 0.18;
    context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = color;
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
      ? `正在用套索添加${labelDisplayName(editor.activeLabel)} Mask。所有修改先保存在本次预览中。`
      : editor.tool === "paint"
      ? `正在用画笔填涂${labelDisplayName(editor.activeLabel)} Mask。所有修改先保存在本次预览中。`
      : editor.tool === "erase"
      ? `正在擦除${labelDisplayName(editor.activeLabel)} Mask。所有修改先保存在本次预览中。`
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
    button.disabled = readOnly;
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
  all('[data-action="batch-editor-clear"]').forEach((button) => {
    button.disabled = readOnly;
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
  categoryFolders().forEach((label) => {
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
      categoryFolders().forEach((label) => {
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
  categoryFolders().forEach((label) => {
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
  categoryFolders().forEach((label) => {
    item.masks[label] = cloneMaskCanvas(item.originalMasks[label]);
  });
  item.edited = false;
  updateBatchEditorPreview(item);
  renderBatchEditor();
  syncBatchEditorUi();
}

function clearBatchEditorMasks() {
  const item = currentBatchEditorItem();
  if (!item || !item.selectable) return;
  pushBatchEditorHistory();
  categoryFolders().forEach((label) => {
    const canvas = item.masks[label];
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  });
  item.edited = true;
  state.batch.selected.add(item.index);
  updateBatchEditorPreview(item);
  renderBatchEditor();
  syncBatchEditorUi();
  setBoundText("batch-editor-notice", "已清空当前微调帧的全部 Mask。按 Ctrl+Z 可撤销。");
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
  syncCategoryManagementControls();
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
    `人工关键帧 · ${propagatedName}双向传播`,
  );
  setBoundText(
    "batch-title",
    `SAM2 ${propagatedName}传播预览`,
  );
  setBoundText(
    "batch-guidance",
    state.batch.overwriteReviewed
      ? `SAM2 已从当前关键帧向前 ${sam2BeforeFrames()} 帧、向后 ${sam2AfterFrames()} 帧传播${propagatedName} Mask。其它活动类别保留每帧原有内容。关键帧之前的已审核帧仍受保护。只有手动勾选的向后已审核帧会被重写。`
      : `SAM2 已从当前关键帧向前 ${sam2BeforeFrames()} 帧、向后 ${sam2AfterFrames()} 帧传播${propagatedName} Mask。其它活动类别保留每帧原有内容。关键帧之前的已审核帧始终受保护。需要重写向后传播结果时，请开启“允许覆盖向后已审核帧”并手动勾选。`,
  );
  all('[data-control="batch-overwrite-reviewed"]').forEach((input) => {
    input.checked = state.batch.overwriteReviewed;
    input.disabled = state.batch.loading || state.batch.saving;
  });
  all("[data-batch-card]").forEach((card) => {
    const selected = state.batch.selected.has(Number(card.dataset.batchCard));
    card.classList.toggle("selected", selected);
  });
  all("[data-batch-index]").forEach((button) => {
    const selected = state.batch.selected.has(
      Number(button.dataset.batchIndex),
    );
    button.setAttribute("aria-pressed", String(selected));
  });
  all('[data-action="batch-accept"]').forEach((button) => {
    button.disabled =
      state.batch.loading ||
      state.batch.saving ||
      !state.batch.reviewToken ||
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

function stopSam2ReviewHeartbeat() {
  if (state.batch.heartbeatId !== null) {
    window.clearInterval(state.batch.heartbeatId);
    state.batch.heartbeatId = null;
  }
}

function startSam2ReviewHeartbeat(reviewToken) {
  stopSam2ReviewHeartbeat();
  state.batch.heartbeatId = window.setInterval(async () => {
    if (state.batch.reviewToken !== reviewToken) {
      stopSam2ReviewHeartbeat();
      return;
    }
    try {
      const response = await fetch(
        `/api/sam2/reviews/${encodeURIComponent(reviewToken)}/heartbeat`,
        { method: "POST", headers: projectHeaders() },
      );
      if (!response.ok) {
        stopSam2ReviewHeartbeat();
        state.batch.reviewToken = null;
        state.batch.error = "SAM2 传播审核已过期，请关闭后重新传播";
        syncBatchUi();
      }
    } catch {
      // The server lease remains valid until its timeout, so a transient miss is safe.
    }
  }, SAM2_REVIEW_HEARTBEAT_MS);
}

function releaseSam2Review(reviewToken = state.batch.reviewToken) {
  if (!reviewToken) return;
  if (reviewToken === state.batch.reviewToken) {
    state.batch.reviewToken = null;
    stopSam2ReviewHeartbeat();
  }
  const release = async (attempt = 0) => {
    if (SAM2_REVIEW_RELEASE_RETRY_MS[attempt]) {
      await new Promise((resolve) =>
        window.setTimeout(resolve, SAM2_REVIEW_RELEASE_RETRY_MS[attempt]),
      );
    }
    try {
      const response = await fetch(
        `/api/sam2/reviews/${encodeURIComponent(reviewToken)}`,
        {
          method: "DELETE",
          headers: projectHeaders(),
          keepalive: true,
        },
      );
      if (response.ok || response.status === 400 || response.status === 404) return;
    } catch {
      // Retry below while the page is still alive. The server also expires the lease.
    }
    if (attempt + 1 < SAM2_REVIEW_RELEASE_RETRY_MS.length) {
      release(attempt + 1);
    }
  };
  release();
}

function closeBatchReview(force = false) {
  if (state.batch.saving) return;
  if (
    !force &&
    state.batch.items.some(({ edited }) => edited) &&
    !window.confirm("预览里还有未保存的微调，确定关闭并丢弃吗？")
  ) return;
  releaseSam2Review();
  state.batch.requestId += 1;
  state.batch.open = false;
  state.batch.loading = false;
  state.batch.overwriteReviewed = false;
  state.batch.keyframeIndex = null;
  state.batch.propagatedLabel = state.activeLabel;
  state.batch.editor.open = false;
  state.batch.editor.history = [];
  state.batch.editor.drawing = false;
  state.batch.editor.panning = false;
  state.batch.items = [];
  state.batch.selected = new Set();
  state.batch.selectionAnchor = null;
  state.batch.selectionDrag.active = false;
  state.batch.selectionDrag.visited = new Set();
  state.batch.selectionDrag.ignoreClickIndex = null;
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
  state.batch.selectionAnchor = null;
  syncBatchUi();
}

function clearBatchSelection() {
  state.batch.selected = new Set();
  state.batch.selectionAnchor = null;
  syncBatchUi();
}

async function acceptBatchCandidates() {
  const indices = [...state.batch.selected].sort((left, right) => left - right);
  if (!indices.length || state.batch.loading || state.batch.saving) return;
  const editedButUnselected = state.batch.items.filter(
    ({ index, edited }) => edited && !state.batch.selected.has(index),
  ).length;
  const discardWarning = editedButUnselected
    ? `\n另有 ${editedButUnselected} 张已微调帧未勾选，这些修改会被丢弃。`
    : "";
  const reviewedSelected = state.batch.items.filter(
    ({ index, item }) =>
      item.reviewed && state.batch.selected.has(index),
  ).length;
  const overwriteWarning = reviewedSelected
    ? `\n其中 ${reviewedSelected} 张已审核帧将被覆盖，原 Mask 会被替换。`
    : "";
  if (
    !window.confirm(
      `确认保存这 ${indices.length} 帧 SAM2 传播预览中的 Mask 吗？${overwriteWarning}${discardWarning}`,
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
        review_token: state.batch.reviewToken,
        overwrite_reviewed: reviewedSelected > 0,
        keyframe_index: state.batch.keyframeIndex,
        items: selectedItems.map(({ index, masks }) => ({
          index,
          masks: Object.fromEntries(
            categoryFolders().map((folderName) => [
              folderName,
              exportMaskDataUrl(masks[folderName]),
            ]),
          ),
        })),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "传播结果保存失败");
    stopSam2ReviewHeartbeat();
    state.batch.reviewToken = null;
    result.saved_indices.forEach((index) => {
      state.manifest.items[index].reviewed = true;
    });
    state.manifest.processed = result.processed;
    const completedLabel = state.batch.propagatedLabel;
    const lastSavedIndex = Number.isInteger(result.last_saved_index)
      ? result.last_saved_index
      : indices[indices.length - 1];
    state.batch.saving = false;
    closeBatchReview(true);
    await loadItem(
      lastSavedIndex,
      true,
      result.overwritten_count
        ? `已保存 ${result.saved_count} 帧 SAM2 ${labelDisplayName(completedLabel)}传播 Mask，其中 ${result.overwritten_count} 张已审核帧已覆盖`
        : `已保存 ${result.saved_count} 帧 SAM2 ${labelDisplayName(completedLabel)}传播 Mask，取消勾选的帧仍保留待审核`,
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
  categoryFolders().forEach((folderName) => {
    if (state.overlayVisible[folderName] && state.masks[folderName]) {
      drawTint(context, state.masks[folderName], labelColor(folderName));
    }
  });
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
  targetContext.globalAlpha = MASK_OVERLAY_ALPHA;
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
  if (!masksReady()) return;
  const snapshot = {};
  categoryFolders().forEach((label) => {
    const canvas = state.masks[label];
    snapshot[label] = canvas
      .getContext("2d", { willReadFrequently: true })
      .getImageData(0, 0, canvas.width, canvas.height);
  });
  state.history.push(snapshot);
  if (state.history.length > 20) state.history.shift();
}

function beginStroke(event) {
  if (event.button !== 0 || state.loading || state.saving) return;
  if (!hasMaskCategories()) {
    openMaskCategoryDialog();
    return;
  }
  if (!state.overlayVisible[state.activeLabel]) return;
  if (!state.masks[state.activeLabel]) return;
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
  const changed =
    tool === "lasso" ? fillLasso() : state.strokePoints.length > 0;
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
  state.dirty = true;
  const action =
    tool === "lasso" ? "已套索填充" : tool === "paint" ? "已画笔填涂" : "已擦除";
  setStatus(`${action}${labelDisplayName(state.activeLabel)} Mask，按 Enter 保存`);
  syncUi();
}

function cancelGesture() {
  if (!state.drawing) return;
  const snapshot = state.history.pop();
  if (snapshot) {
    categoryFolders().forEach((label) => {
      const canvas = state.masks[label];
      canvas.getContext("2d").putImageData(snapshot[label], 0, 0);
    });
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
  const color = labelColor(state.gestureLabel);
  context.save();
  tracePolygon(context, state.lassoPoints);
  context.fillStyle = color;
  context.globalAlpha = 0.18;
  context.fill();
  context.globalAlpha = 1;
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
  categoryFolders().forEach((label) => {
    const canvas = state.masks[label];
    canvas.getContext("2d").putImageData(snapshot[label], 0, 0);
  });
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
    state.dirty = true;
    renderCanvas();
    setStatus("已恢复当前帧的预识别 Mask");
    syncUi();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function clearAllMasks() {
  if (state.loading || state.saving || !masksReady()) return;
  pushHistory();
  categoryFolders().forEach((label) => {
    const canvas = state.masks[label];
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  });
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
  if (state.loading || state.saving || !masksReady()) return;
  state.saving = true;
  setStatus("正在写入标定图片和 Mask…");
  syncUi();
  try {
    const response = await fetch(`/api/item/${state.index}/save`, {
      method: "POST",
      headers: projectHeaders(),
      body: JSON.stringify({
        masks: Object.fromEntries(
          categoryFolders().map((folderName) => [
            folderName,
            exportMaskDataUrl(state.masks[folderName]),
          ]),
        ),
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
      setStatus("当前帧已保存", "success");
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
  if (!categoryFolders().includes(label) || state.loading || state.saving) return;
  state.overlayVisible[label] = !state.overlayVisible[label];
  if (!state.overlayVisible[label] && label === state.activeLabel) {
    cancelGesture();
    setStatus("当前类别已隐藏。重新选择该类别后可继续绘制。");
  }
  renderCanvas();
  syncUi();
}

function toggleAllMasks() {
  const anyVisible = categoryFolders().some((label) => state.overlayVisible[label]);
  categoryFolders().forEach((label) => {
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
  const conflictModal = document.querySelector(
    '[data-role="mask-category-conflict-modal"]',
  );
  if (conflictModal && !conflictModal.hidden) {
    trapDialogFocus(event, conflictModal);
    if (event.key === "Escape") {
      event.preventDefault();
      closeMaskCategoryConflict(true);
    }
    return;
  }
  const archiveModal = document.querySelector('[data-role="mask-archive-modal"]');
  if (archiveModal && !archiveModal.hidden) {
    trapDialogFocus(event, archiveModal);
    if (event.key === "Escape") {
      event.preventDefault();
      closeMaskArchiveDialog();
    }
    return;
  }
  const categoryModal = document.querySelector('[data-role="mask-category-modal"]');
  if (categoryModal && !categoryModal.hidden) {
    trapDialogFocus(event, categoryModal);
    if (event.key === "Escape") {
      event.preventDefault();
      closeMaskCategoryDialog();
    }
    return;
  }
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
      } else if (/^[1-5]$/.test(event.key)) {
        event.preventDefault();
        selectBatchEditorLabel(categoryFolders()[Number(event.key) - 1]);
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
      } else if (event.key.toLowerCase() === "x") {
        event.preventDefault();
        clearBatchEditorMasks();
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
  } else if (/^[1-5]$/.test(event.key)) {
    selectLabel(categoryFolders()[Number(event.key) - 1]);
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

window.addEventListener("pagehide", () => {
  releaseSam2Review();
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
    state.manifest.archived_mask_categories ||= [];
    state.activeLabel = manifest.mask_categories[0]?.folder_name || null;
    state.overlayVisible = Object.fromEntries(
      manifest.mask_categories.map(({ folder_name: folderName }) => [
        folderName,
        true,
      ]),
    );
    state.batch.propagatedLabel = state.activeLabel;
    state.batch.editor.activeLabel = state.activeLabel;
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
