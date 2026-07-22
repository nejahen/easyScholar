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
  useCustomColors: false,
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
    .querySelectorAll("#pattern, #useCustomColors, #borderRadius")
    .forEach((control) => control.addEventListener("input", updatePreview));
  document
    .querySelectorAll("#customTextColor, #customBackgroundColor, #customBorderColor")
    .forEach((control) => control.addEventListener("input", enableCustomColors));
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

  const migratedStyle = {};
  if (settings.stylePreset === "ios" && settings.styleSchemaVersion < 2) {
    settings.borderRadius = THEME_DEFAULTS.ios.borderRadius;
    settings.pattern = THEME_DEFAULTS.ios.pattern;
    migratedStyle.borderRadius = settings.borderRadius;
    migratedStyle.pattern = settings.pattern;
  }
  if (settings.styleSchemaVersion < 3) {
    const colorsChanged =
      settings.customTextColor !== DEFAULT_STYLE.customTextColor ||
      settings.customBackgroundColor !== DEFAULT_STYLE.customBackgroundColor ||
      settings.customBorderColor !== DEFAULT_STYLE.customBorderColor;
    settings.useCustomColors = settings.stylePreset === "custom" || colorsChanged;
    migratedStyle.useCustomColors = settings.useCustomColors;
    migratedStyle.styleSchemaVersion = 3;
  }
  if (Object.keys(migratedStyle).length) {
    await chrome.storage.local.set(migratedStyle);
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
  document.querySelector("#useCustomColors").checked = settings.useCustomColors;
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
  const useCustomColors = document.querySelector("#useCustomColors").checked;
  preview.dataset.theme = theme;
  preview.dataset.customColors = useCustomColors ? "true" : "false";
  document.body.dataset.uiTheme = theme;
  preview.dataset.pattern = document.querySelector("#pattern").value;
  preview.style.setProperty("--journallens-custom-text", document.querySelector("#customTextColor").value);
  preview.style.setProperty("--journallens-custom-bg", document.querySelector("#customBackgroundColor").value);
  preview.style.setProperty("--journallens-custom-border", document.querySelector("#customBorderColor").value);
  preview.style.setProperty("--journallens-radius", `${radius}px`);
  document
    .querySelectorAll(".color-control input")
    .forEach((control) => (control.disabled = !useCustomColors));
  document.querySelector("#radiusValue").value = `${radius}px`;
}

function enableCustomColors() {
  document.querySelector("#useCustomColors").checked = true;
  updatePreview();
}

function applyThemeDefaults() {
  const theme = document.querySelector("#stylePreset").value;
  const defaults = THEME_DEFAULTS[theme];
  if (defaults) {
    document.querySelector("#borderRadius").value = defaults.borderRadius;
    document.querySelector("#pattern").value = defaults.pattern;
  }
  if (theme === "custom") document.querySelector("#useCustomColors").checked = true;
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
    useCustomColors: document.querySelector("#useCustomColors").checked,
    borderRadius: Number(document.querySelector("#borderRadius").value),
    styleSchemaVersion: 3,
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
