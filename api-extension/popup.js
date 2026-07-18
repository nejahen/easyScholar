const DEFAULT_METRICS = ["sciif", "sciif5", "jcr", "sciUp", "sciBase"];

document.addEventListener("DOMContentLoaded", restoreSettings);
document.querySelector("#save").addEventListener("click", saveSettings);

async function restoreSettings() {
  const settings = await chrome.storage.local.get({
    secretKey: "",
    enabledMetrics: DEFAULT_METRICS,
  });
  document.querySelector("#secretKey").value = settings.secretKey;
  document.querySelectorAll("input[name='metric']").forEach((input) => {
    input.checked = settings.enabledMetrics.includes(input.value);
  });
}

async function saveSettings() {
  const secretKey = document.querySelector("#secretKey").value.trim();
  const enabledMetrics = [...document.querySelectorAll("input[name='metric']:checked")].map(
    (input) => input.value,
  );
  await chrome.storage.local.set({ secretKey, enabledMetrics });
  const status = document.querySelector("#status");
  status.textContent = secretKey ? "已保存，刷新论文页面后生效" : "已保存；请填写密钥后再查询";
  setTimeout(() => (status.textContent = ""), 2500);
}
