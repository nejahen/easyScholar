const API_URL = "https://easyscholar.cc/open/getPublicationRank";
const CACHE_PREFIX = "journal-cache:";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const pendingQueries = new Map();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "EASYSCHOLAR_QUERY") return false;

  queryPublication(message.publicationName)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function queryPublication(publicationName) {
  const normalizedName = normalizePublicationName(publicationName);
  if (!normalizedName) throw new Error("没有识别到期刊名称");

  const settings = await chrome.storage.local.get({ secretKey: "" });
  if (!settings.secretKey) throw new Error("请先在扩展弹窗中填写 easyScholar 密钥");

  const cacheKey = `${CACHE_PREFIX}${normalizedName.toLocaleLowerCase()}`;
  const cached = await chrome.storage.local.get(cacheKey);
  if (cached[cacheKey] && Date.now() - cached[cacheKey].savedAt < CACHE_TTL_MS) {
    return cached[cacheKey].data;
  }

  if (pendingQueries.has(cacheKey)) return pendingQueries.get(cacheKey);

  const request = fetchPublication(settings.secretKey, normalizedName)
    .then(async (data) => {
      await chrome.storage.local.set({
        [cacheKey]: { savedAt: Date.now(), data },
      });
      return data;
    })
    .finally(() => pendingQueries.delete(cacheKey));

  pendingQueries.set(cacheKey, request);
  return request;
}

async function fetchPublication(secretKey, publicationName) {
  const url = new URL(API_URL);
  url.searchParams.set("secretKey", secretKey);
  url.searchParams.set("publicationName", publicationName);

  const response = await fetch(url, { method: "GET", credentials: "omit" });
  if (!response.ok) throw new Error(`easyScholar 请求失败（HTTP ${response.status}）`);

  const payload = await response.json();
  if (!payload?.data) throw new Error(payload?.msg || "easyScholar 返回数据格式异常");

  const official = payload.data.officialRank?.all || {};
  const custom = payload.data.customRank?.rankInfo || [];
  if (!Object.keys(official).length && !custom.length) {
    throw new Error(payload.msg || "easyScholar 中未找到该期刊");
  }

  return { publicationName, official, custom };
}

function normalizePublicationName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:|·-]+|[\s,;:|·-]+$/g, "")
    .slice(0, 240);
}
