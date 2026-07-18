(() => {
  "use strict";

  const processedAnchors = new WeakSet();
  const journalRequests = new Map();
  let scanTimer = 0;

  const adapters = [
    { test: /(^|\.)scholar\.google\./, scan: scanGoogleScholar },
    { test: /webofscience|webofknowledge/, scan: scanWebOfScience },
    { test: /(^|\.)cnki\.net$/, scan: scanCnki },
    { test: /^pubmed\.ncbi\.nlm\.nih\.gov$/, scan: scanPubMed },
    { test: /^ieeexplore\.ieee\.org$/, scan: scanIEEE },
    { test: /^link\.springer\.com$/, scan: scanSpringer },
    { test: /^dl\.acm\.org$/, scan: scanAcm },
    { test: /(^|\.)dblp(\.uni-trier)?\.de$|^dblp\.org$/, scan: scanDblp },
    { test: /^xueshu\.baidu\.com$/, scan: scanBaiduScholar },
    { test: /(^|\.)aminer\.cn$/, scan: scanAminer },
    { test: /(^|\.)readpaper\.com$/, scan: scanReadPaper },
    { test: /^www\.sciencedirect\.com$/, scan: scanScienceDirect },
    { test: /^onlinelibrary\.wiley\.com$/, scan: scanWiley },
    { test: /^www\.nature\.com$/, scan: scanNature },
  ];

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanPage, 250);
  }

  function scanPage() {
    const host = location.hostname.toLowerCase();
    const adapter = adapters.find((candidate) => candidate.test.test(host));
    if (adapter) adapter.scan();
    scanCitationMetadata();
  }

  function queueResult(anchor, publicationName) {
    const name = cleanJournalName(publicationName);
    if (!anchor || !name || processedAnchors.has(anchor)) return;
    processedAnchors.add(anchor);

    const container = document.createElement("span");
    container.className = "journallens-badges";
    container.dataset.publication = name;
    container.append(statusBadge("查询中…"));
    anchor.insertAdjacentElement("afterend", container);

    queryJournal(name)
      .then((result) => renderMetrics(container, result))
      .catch((error) => renderError(container, error));
  }

  function queryJournal(name) {
    const key = name.toLocaleLowerCase();
    if (!journalRequests.has(key)) {
      journalRequests.set(
        key,
        new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { type: "JOURNALLENS_QUERY", publicationName: name },
            (response) => {
              if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
              if (!response?.ok) return reject(new Error(response?.error || "查询失败"));
              resolve(response.data);
            },
          );
        }),
      );
    }
    return journalRequests.get(key);
  }

  async function renderMetrics(container, result) {
    const { enabledMetrics } = await chrome.storage.local.get({
      enabledMetrics: ["sciif", "sciif5", "jcr", "sciUp", "sciBase", "customRank"],
    });
    const all = result.official || {};
    const specs = [
      ["sciif", "IF", all.sciif, "if"],
      ["sciif5", "5年IF", all.sciif5, "if"],
      ["jcr", "JCR", all.sci || all.ssci, "jcr"],
      ["sciUp", "中科院升级版", all.sciUp, "cas"],
      ["sciBase", "中科院基础版", all.sciBase, "cas"],
      ["sciUpTop", "Top", all.sciUpTop, "cas"],
      ["sciwarn", "预警", all.sciwarn, "warn"],
    ];
    const selected = new Set(enabledMetrics);
    const badges = specs
      .filter(([key, _label, value]) => selected.has(key) && hasMetric(value))
      .map(([_key, label, value, kind]) => metricBadge(label, value, kind));
    if (selected.has("customRank")) {
      (result.custom || []).forEach((item) => {
        badges.push(metricBadge(item.abbName, item.rank, "custom"));
      });
    }

    container.replaceChildren(...(badges.length ? badges : [statusBadge("暂无指标")]));
    container.title = result.publicationName || container.dataset.publication;
  }

  function renderError(container, error) {
    const badge = statusBadge("未查到");
    badge.dataset.error = "true";
    badge.title = error?.message || "easyScholar 查询失败";
    container.replaceChildren(badge);
  }

  function metricBadge(label, value, kind) {
    const badge = document.createElement("span");
    badge.className = "journallens-badge";
    badge.dataset.kind = kind;
    badge.textContent = `${label} ${formatMetric(value)}`;
    return badge;
  }

  function statusBadge(text) {
    const badge = document.createElement("span");
    badge.className = "journallens-status";
    badge.textContent = text;
    return badge;
  }

  function hasMetric(value) {
    return value !== undefined && value !== null && value !== "" && value !== false;
  }

  function formatMetric(value) {
    if (Array.isArray(value)) return value.join(" / ");
    if (typeof value === "object") {
      return Object.values(value).filter(hasMetric).join(" / ");
    }
    return String(value);
  }

  function cleanJournalName(value) {
    return String(value || "")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/^来源[:：]\s*/i, "")
      .replace(/\s+/g, " ")
      .replace(/^[\s,;:|·-]+|[\s,;:|·-]+$/g, "")
      .slice(0, 240);
  }

  function scanGoogleScholar() {
    document.querySelectorAll(".gs_ri").forEach((row) => {
      const anchor = row.querySelector("h3 a, h3");
      const journal = extractScholarJournal(row.querySelector(".gs_a")?.textContent);
      queueResult(anchor, journal);
    });
    document.querySelectorAll("tr.gsc_a_tr").forEach((row) => {
      const meta = row.querySelectorAll(".gs_gray")[1]?.textContent || "";
      const journal = meta.replace(/,?\s+\d{4}.*$/, "");
      queueResult(row.querySelector(".gsc_a_t a"), journal);
    });
  }

  function extractScholarJournal(text) {
    const source = String(text || "");
    return source.match(/-\s*(.+?)(?:,\s*\d{4}\b|\s+-\s+\d{4}\b)/)?.[1] || "";
  }

  function scanWebOfScience() {
    document
      .querySelectorAll("app-jcr-overlay span[lang='en'], app-jcr-overlay button[lang='en'], [data-ta='source-title']")
      .forEach((node) => queueResult(node, node.textContent));
  }

  function scanCnki() {
    document.querySelectorAll("td.source a, .source a, a.fz14").forEach((node) => {
      queueResult(node, node.getAttribute("title") || node.textContent);
    });
  }

  function scanPubMed() {
    document.querySelectorAll("article.full-docsum").forEach((article) => {
      const citation = article.querySelector(".full-journal-citation")?.textContent || "";
      const journal = citation.split(/\.\s+(?=\d{4}|\d{1,2}\s)/)[0];
      queueResult(article.querySelector(".docsum-title"), journal);
    });
  }

  function scanIEEE() {
    document
      .querySelectorAll(".publisher-info-container .publisher-info, xpl-publisher, .publication-title")
      .forEach((node) => queueResult(node, node.textContent));
  }

  function scanSpringer() {
    document
      .querySelectorAll("a[data-test='journal-link'], .c-card__subtitle a, [data-test='journal']")
      .forEach((node) => queueResult(node, node.getAttribute("title") || node.textContent));
  }

  function scanAcm() {
    document
      .querySelectorAll("a[href*='/journal/'], .citation__conference__name, .epub-section__title")
      .forEach((node) => queueResult(node, node.textContent));
  }

  function scanDblp() {
    document.querySelectorAll("cite.data .venue, .publ .venue").forEach((node) => {
      queueResult(node, node.textContent.replace(/\(\d+\)$/, ""));
    });
  }

  function scanBaiduScholar() {
    document.querySelectorAll(".sc_info a[title]").forEach((node) => {
      queueResult(node, node.getAttribute("title"));
    });
  }

  function scanAminer() {
    document.querySelectorAll(".venue-line").forEach((node) => {
      queueResult(node, node.childNodes[0]?.textContent || node.textContent);
    });
  }

  function scanReadPaper() {
    document.querySelectorAll(".paper-item .title, .publication-title").forEach((node) => {
      queueResult(node, node.textContent);
    });
  }

  function scanScienceDirect() {
    document.querySelectorAll(".publication-title-link, a.publication-title").forEach((node) => {
      queueResult(node, node.textContent);
    });
  }

  function scanWiley() {
    document.querySelectorAll("a.publication-title, .meta__info .publication").forEach((node) => {
      queueResult(node, node.textContent);
    });
  }

  function scanNature() {
    document.querySelectorAll("a[data-track-action='view journal'], .c-meta__item--block-at-lg").forEach((node) => {
      queueResult(node, node.textContent);
    });
  }

  function scanCitationMetadata() {
    const selectors = [
      "meta[name='citation_journal_title']",
      "meta[name='prism.publicationName']",
      "meta[property='og:site_name']",
    ];
    const meta = selectors.map((selector) => document.querySelector(selector)).find(Boolean);
    const journal = meta?.getAttribute("content");
    const anchor = document.querySelector("h1") || document.querySelector("main");
    if (journal && anchor) queueResult(anchor, journal);
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scanPage();
})();
