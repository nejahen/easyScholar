# easyScholar API Journal Metrics

这是基于 easyScholar 多站点识别思路重写的精简版 Chrome/Edge 扩展。扩展从论文页面识别期刊名称，调用 easyScholar 开放接口，并在页面上显示影响因子和分区标签。

## 已适配站点

- Google Scholar
- Web of Science / Web of Knowledge
- 中国知网
- PubMed
- IEEE Xplore
- SpringerLink
- ACM Digital Library
- DBLP
- 百度学术
- AMiner
- ReadPaper
- ScienceDirect
- Wiley Online Library
- Nature

论文详情页如果提供 `citation_journal_title` 或 `prism.publicationName` 元数据，也会自动识别。

## 安装

1. 在 Chrome 打开 `chrome://extensions/`，或在 Edge 打开 `edge://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择本目录 `api-extension`。
4. 点击扩展图标，填写 easyScholar “开放接口”中的密钥并保存。
5. 刷新论文检索页面。

## 数据和隐私

- 密钥保存在浏览器本地 `chrome.storage.local` 中，不写入源码。
- 只向 `https://easyscholar.cc/open/getPublicationRank` 发送识别出的期刊名称和接口密钥。
- 查询结果在本地缓存 7 天；同一页面上的相同期刊只查询一次。
