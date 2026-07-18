const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

let messageListener;
let fetchCount = 0;
const stored = { secretKey: "TEST_KEY" };

const chrome = {
  runtime: {
    onMessage: {
      addListener(listener) {
        messageListener = listener;
      },
    },
  },
  storage: {
    local: {
      async get(query) {
        if (typeof query === "string") return { [query]: stored[query] };
        return { ...query, ...stored };
      },
      async set(values) {
        Object.assign(stored, values);
      },
    },
  },
};

async function fetch(url) {
  fetchCount += 1;
  const parsed = new URL(String(url));
  assert.equal(parsed.origin + parsed.pathname, "https://www.easyscholar.cc/open/getPublicationRank");
  assert.equal(parsed.searchParams.get("secretKey"), "TEST_KEY");
  assert.equal(parsed.searchParams.get("publicationName"), "Nature");
  return {
    ok: true,
    async json() {
      return {
        code: 200,
        msg: "SUCCESS",
        data: {
          officialRank: { all: { sciif: "50.5", sci: "Q1", sciUp: "1区" } },
          customRank: {
            rankInfo: [
              {
                uuid: "1614986460329492480",
                abbName: "DUFE",
                oneRankText: "TOP",
                twoRankText: "A",
                threeRankText: "B",
              },
            ],
            rank: ["1614986460329492480&&&3"],
          },
        },
      };
    },
  };
}

const source = fs.readFileSync(path.join(__dirname, "..", "background.js"), "utf8");
vm.runInNewContext(source, { chrome, fetch, URL, Map, Date, Promise, String, Object, Error });

function query(name) {
  return new Promise((resolve) => {
    const keepChannelOpen = messageListener(
      { type: "JOURNALLENS_QUERY", publicationName: name },
      {},
      resolve,
    );
    assert.equal(keepChannelOpen, true);
  });
}

(async () => {
  const first = await query(" Nature ");
  assert.equal(first.ok, true);
  assert.equal(first.data.official.sciif, "50.5");
  assert.deepEqual(JSON.parse(JSON.stringify(first.data.custom[0])), {
    uuid: "1614986460329492480",
    abbName: "DUFE",
    level: 3,
    rank: "B",
  });

  const second = await query("Nature");
  assert.equal(second.ok, true);
  assert.equal(fetchCount, 1, "第二次查询应命中本地缓存");
  console.log("background API and cache tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
