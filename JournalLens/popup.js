const DEFAULT_METRICS = ["sciif", "sciif5", "jcr", "sciUp", "sciBase", "customRank"];
const DEFAULT_SITES = [
  "googleScholar", "webOfScience", "cnki", "pubmed", "ieee", "springer", "acm",
  "dblp", "baiduScholar", "aminer", "readpaper", "scienceDirect", "wiley", "nature",
];
const DEFAULT_STYLE = {
  stylePreset: "colorful",
  pattern: "none",
  customTextColor: "#ffffff",
  customBackgroundColor: "#0b57d0",
  customBorderColor: "#0842a0",
  borderRadius: 4,
};
const THEME_DEFAULTS = {
  ios: { borderRadius: 16, pattern: "none" },
};

document.addEventListener("DOMContentLoaded", initializePopup);

async function initializePopup() {
  document.querySelector("#save").addEventListener("click", saveSettings);
  document.querySelector("#selectAllSites").addEventListener("click", () => setAllSites(true));
  document.querySelector("#clearAllSites").addEventListener("click", () => setAllSites(false));
  document
    .querySelectorAll("#pattern, #customTextColor, #customBackgroundColor, #customBorderColor, #borderRadius")
    .forEach((control) => control.addEventListener("input", updatePreview));
  document.querySelector("#stylePreset").addEventListener("change", applyThemeDefaults);
  await restoreSettings();
  updatePreview();
}

async function restoreSettings() {
  const settings = await chrome.storage.local.get({
    secretKey: "",
    enabledMetrics: DEFAULT_METRICS,
    enabledSites: DEFAULT_SITES,
    metadataFallback: true,
    styleSchemaVersion: 0,
    ...DEFAULT_STYLE,
  });

  if (settings.stylePreset === "ios" && settings.styleSchemaVersion < 2) {
    settings.borderRadius = THEME_DEFAULTS.ios.borderRadius;
    settings.pattern = THEME_DEFAULTS.ios.pattern;
    await chrome.storage.local.set({
      borderRadius: settings.borderRadius,
      pattern: settings.pattern,
      styleSchemaVersion: 2,
    });
  }

  document.querySelector("#secretKey").value = settings.secretKey;
  setCheckedValues("metric", settings.enabledMetrics);
  setCheckedValues("site", settings.enabledSites);
  document.querySelector("#metadataFallback").checked = settings.metadataFallback;
  document.querySelector("#stylePreset").value = settings.stylePreset;
  document.querySelector("#pattern").value = settings.pattern;
  document.querySelector("#customTextColor").value = settings.customTextColor;
  document.querySelector("#customBackgroundColor").value = settings.customBackgroundColor;
  document.querySelector("#customBorderColor").value = settings.customBorderColor;
  document.querySelector("#borderRadius").value = settings.borderRadius;
}

function setCheckedValues(name, selectedValues) {
  const selected = new Set(selectedValues);
  document.querySelectorAll(`input[name='${name}']`).forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function setAllSites(checked) {
  document.querySelectorAll("input[name='site']").forEach((input) => {
    input.checked = checked;
  });
}

function updatePreview() {
  const preview = document.querySelector("#stylePreview");
  const radius = Number(document.querySelector("#borderRadius").value);
  const theme = document.querySelector("#stylePreset").value;
  preview.dataset.theme = theme;
  document.body.dataset.uiTheme = theme;
  preview.dataset.pattern = document.querySelector("#pattern").value;
  preview.style.setProperty("--journallens-custom-text", document.querySelector("#customTextColor").value);
  preview.style.setProperty("--journallens-custom-bg", document.querySelector("#customBackgroundColor").value);
  preview.style.setProperty("--journallens-custom-border", document.querySelector("#customBorderColor").value);
  preview.style.setProperty("--journallens-radius", `${radius}px`);
  document.querySelector("#radiusValue").value = `${radius}px`;
}

function applyThemeDefaults() {
  const theme = document.querySelector("#stylePreset").value;
  const defaults = THEME_DEFAULTS[theme];
  if (defaults) {
    document.querySelector("#borderRadius").value = defaults.borderRadius;
    document.querySelector("#pattern").value = defaults.pattern;
  }
  updatePreview();
}

async function saveSettings() {
  const secretKey = document.querySelector("#secretKey").value.trim();
  const enabledMetrics = checkedValues("metric");
  const enabledSites = checkedValues("site");
  const settings = {
    secretKey,
    enabledMetrics,
    enabledSites,
    metadataFallback: document.querySelector("#metadataFallback").checked,
    stylePreset: document.querySelector("#stylePreset").value,
    pattern: document.querySelector("#pattern").value,
    customTextColor: document.querySelector("#customTextColor").value,
    customBackgroundColor: document.querySelector("#customBackgroundColor").value,
    customBorderColor: document.querySelector("#customBorderColor").value,
    borderRadius: Number(document.querySelector("#borderRadius").value),
    styleSchemaVersion: 2,
  };

  await chrome.storage.local.set(settings);
  const status = document.querySelector("#status");
  const siteSummary = enabledSites.length ? `已启用 ${enabledSites.length} 个网站` : "所有网站均已停用";
  status.textContent = secretKey
    ? `设置已保存，${siteSummary}；刷新论文页面后生效`
    : `设置已保存，${siteSummary}；请填写密钥后再查询`;
  setTimeout(() => (status.textContent = ""), 3500);
}

function checkedValues(name) {
  return [...document.querySelectorAll(`input[name='${name}']:checked`)].map((input) => input.value);
}
