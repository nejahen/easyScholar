# JournalLens（期刊透镜）

JournalLens 是一款精简的 Chrome/Edge 学术浏览器扩展。它从论文页面识别期刊名称，调用 easyScholar 开放接口，并在页面上显示影响因子和分区标签。

扩展图标以放大镜、期刊页面和指标线构成，使用与 iOS 玻璃主题一致的蓝紫渐变视觉。

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
3. 点击“加载已解压的扩展程序”，选择本目录 `JournalLens`。
4. 点击扩展图标，填写 easyScholar “开放接口”中的密钥并保存。
5. 刷新论文检索页面。

## 可配置选项

- 可分别启用或停用每一个已适配网站。
- 可选择显示哪些官方指标和自定义数据集。
- 内置分类彩色、经典蓝色、柔和胶囊、iOS 玻璃拟态、深色、透明描边和自定义配色主题；iOS 主题会同步改变设置面板与论文标签。
- 可选择纯色、斜纹、圆点或渐变高光底纹。
- 文字色、背景色和边框色可覆盖任意主题；圆角大小与底纹也会在设置页实时预览。

## 数据和隐私

- 密钥保存在浏览器本地 `chrome.storage.local` 中，不写入源码。
- 只向 `https://www.easyscholar.cc/open/getPublicationRank` 发送识别出的期刊名称和接口密钥。
- 查询结果在本地缓存 7 天；同一页面上的相同期刊只查询一次。
- 支持展示官方数据集，以及按照 `rankInfo.uuid` 和 `rank` 映射出的自定义数据集等级。
