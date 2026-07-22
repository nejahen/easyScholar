const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const fields = new Map();
const field = (selector) => {
  if (!fields.has(selector)) {
    fields.set(selector, {
      checked: false,
      dataset: {},
      style: { setProperty() {} },
      value: "",
    });
  }
  return fields.get(selector);
};

let savedSettings;
const context = {
  chrome: {
    storage: {
      local: {
        async get(defaults) {
          return {
            ...defaults,
            borderRadius: 4,
            enabledMetrics: [],
            enabledSites: [],
            stylePreset: "ios",
            styleSchemaVersion: 0,
          };
        },
        async set(settings) {
          savedSettings = settings;
        },
      },
    },
  },
  document: {
    body: { dataset: {} },
    addEventListener() {},
    querySelector: field,
    querySelectorAll() { return []; },
  },
  setTimeout() {},
};

vm.runInNewContext(fs.readFileSync(require.resolve("../popup.js"), "utf8"), context);

(async () => {
  await context.restoreSettings();
  assert.equal(field("#borderRadius").value, 16);
  assert.equal(field("#pattern").value, "none");
  assert.deepEqual(JSON.parse(JSON.stringify(savedSettings)), {
    borderRadius: 16,
    pattern: "none",
    styleSchemaVersion: 2,
  });

  context.updatePreview();
  assert.equal(context.document.body.dataset.uiTheme, "ios");
  assert.equal(field("#radiusValue").value, "16px");
  console.log("popup iOS theme migration tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
