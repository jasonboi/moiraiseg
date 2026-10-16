const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "../app/static/app.js"), "utf8")
  .replace(/\ninit\(\);\s*$/, "");

function setup({ empty = false, invalid = false } = {}) {
  const requests = [];
  const context = vm.createContext({
    localStorage: { getItem: () => null },
    MutationObserver: class { observe() {} },
    document: { querySelector: () => null },
    window: { addEventListener() {}, confirm: () => true, setInterval: () => 1, clearInterval() {} },
    requestAnimationFrame() {},
    fetch: async (url, options) => {
      const body = options.body ? JSON.parse(options.body) : undefined;
      requests.push({ url, body });
      if (url === "/api/sam2/propagate") {
        return { ok: true, json: async () => ({
          review_token: "test-review", labels: ["fat", "muscle"],
          items: [0, 1, 2].map((index) => ({
            index, reviewed: index === 0, frame_index: index,
            masks: invalid ? { fat: "predicted-fat" } : { fat: "predicted-fat", muscle: "predicted-muscle" },
          })),
        }) };
      }
      if (url === "/api/batch/save") {
        return { ok: true, json: async () => ({
          saved_count: body.items.length, saved_indices: body.items.map(({ index }) => index),
          processed: body.items.length, last_saved_index: 2,
        }) };
      }
      return { ok: true };
    },
  });
  vm.runInContext(source, context);
  vm.runInContext(`
    function canvas(value, filled = true) {
      return { value, filled, width: 2, height: 2, getContext: () => ({
        getImageData: () => ({data: [0, 0, 0, filled ? 255 : 0]})
      }) };
    }
    syncBatchUi = () => {};
    syncBatchEditorUi = () => {};
    renderBatchEditor = () => {};
    renderBatchGrid = () => {};
    cancelBatchEditorGesture = () => {};
    renderBatchPreview = (image, masks) => Object.values(masks).map(mask => mask.value).join("|");
    loadImage = async (url) => ({value: url, naturalWidth: 2, naturalHeight: 2});
    maskCanvasFromImage = (image) => canvas(image.value);
    cloneMaskCanvas = (mask) => canvas(mask.value, mask.filled);
    exportMaskDataUrl = (mask) => mask.value;
    setStatus = (text, tone) => { state.status = {text, tone}; };
    loadItem = async (index, force, message) => { state.lastLoaded = {index, message}; };
    state.manifest = {
      project_id: "test", items: [{reviewed:true}, {reviewed:false}, {reviewed:false}],
      mask_categories: [
        {folder_name:"fat", display_name:"Fat"},
        {folder_name:"muscle", display_name:"Muscle"},
        {folder_name:"nerve", display_name:"Nerve"}
      ]
    };
    state.index = 1;
    state.currentItem = {reviewed: false};
    state.activeLabel = "nerve";
    state.masks = {
      fat: canvas("seed-fat", ${!empty}), muscle: canvas("seed-muscle", ${!empty}),
      nerve: canvas("empty-nerve", false)
    };
  `, context);
  return { context, requests, run: (code) => vm.runInContext(code, context) };
}

test("one propagation request seeds all categories even when the selected category is empty", async () => {
  const { requests, run } = setup();
  await run("openSam2Propagation()");
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].body.masks, { fat: "seed-fat", muscle: "seed-muscle", nerve: "empty-nerve" });
  assert.equal(run("state.batch.items[2].masks.fat.value"), "predicted-fat");
  assert.equal(run("state.batch.items[2].masks.muscle.value"), "predicted-muscle");
  assert.equal(run("state.batch.items[2].masks.nerve.value"), "/api/item/2/mask/nerve");
  assert.equal(run("state.batch.items[1].masks.nerve.value"), "empty-nerve");
  assert.equal(run("state.batch.items[0].selectable"), false);
  assert.equal(run("state.batch.selected.has(0)"), false);
  assert.equal(run("state.batch.items[1].originalMasks.fat !== state.batch.items[1].masks.fat"), true);
});

test("all-empty keyframes stop before a request", async () => {
  const { requests, run } = setup({ empty: true });
  await run("openSam2Propagation()");
  assert.equal(requests.length, 0);
  assert.equal(run("state.status.tone"), "error");
  assert.match(run("state.status.text"), /所有 Mask 均为空/);
});

test("incomplete multi-category responses release the review lease and cannot be saved", async () => {
  const { requests, run } = setup({ invalid: true });
  await run("openSam2Propagation()");
  assert.equal(run("state.batch.items.length"), 0);
  assert.equal(run("state.batch.reviewToken"), null);
  assert.equal(run("state.batch.loading"), false);
  assert.ok(run("state.batch.error"));
  assert.equal(requests[1].url, "/api/sam2/reviews/test-review");
});

test("one review batch edits both categories and saves their separate masks together", async () => {
  const { requests, run } = setup();
  await run("openSam2Propagation()");
  run(`
    openBatchEditor(1);
    selectBatchEditorLabel("fat");
    currentBatchEditorItem().masks.fat.value = "edited-fat";
    selectBatchEditorLabel("muscle");
    currentBatchEditorItem().masks.muscle.value = "edited-muscle";
    currentBatchEditorItem().edited = true;
    moveBatchEditor(1);
  `);
  assert.equal(run("state.batch.editor.activeLabel"), "muscle");
  run("closeBatchEditor(); openBatchEditor(1)");
  assert.equal(run("state.batch.editor.activeLabel"), "muscle");
  await run("acceptBatchCandidates()");
  const saved = requests.find(({ url }) => url === "/api/batch/save").body;
  assert.deepEqual(saved.items.map(({ index }) => index), [1, 2]);
  assert.deepEqual(saved.items[0].masks, { fat: "edited-fat", muscle: "edited-muscle", nerve: "empty-nerve" });
  assert.deepEqual(saved.items[1].masks, { fat: "predicted-fat", muscle: "predicted-muscle", nerve: "/api/item/2/mask/nerve" });
  assert.equal(run("state.batch.open"), false);
  assert.equal(run("state.lastLoaded.index"), 2);
});

test("multi-category guidance translates both preserved categories and overwrite protection", () => {
  const { run } = setup();
  const text = run('englishText("向前 4 帧、向后 16 帧一起传播Fat、Muscle Mask。只有手动勾选的向后已审核帧会被重写。关键帧中为空的Nerve保留各帧原有内容。")');
  assert.match(text, /Fat、Muscle/);
  assert.match(text, /Only manually selected/);
  assert.match(text, /Nerve are empty/);
  assert.doesNotMatch(text, /关键帧|已审核|保留/);
});
