# Portfolio card: Internal Insurance Program

Material for the project card on the personal website. Two blocks, English and Chinese, each with a blurb, tech tags and three highlights. The company is not named; the public demo uses synthetic aggregates, redacts record-level fields and marks unavailable features explicitly.

---

## English

### Blurb (about 150 words)

An internal risk-management workspace built inside a utility company's Feishu tenant for a corporate insurance programme of 34 classes of cover. Before it, premiums, policy periods and claims lived in a broker workbook, three claims ledgers and folders of PDFs, and simple questions took hours of manual arithmetic. The app reads three Bitable tables (34 classes, 201 policy rows, 767 claims) through the platform's capabilities, joins them in the browser, caches with schema and version guards, and computes premium, trend and loss-ratio views with a pro-rata monthly rule that handles 18-month policy chains without double counting. An Aily agent answers questions in chat; a server-side proxy calls an Aily skill per report section and the client re-inserts live charts, then exports to Markdown, Word with embedded figures, PDF or a Feishu Doc. Built on Feishu Spark with React, TypeScript and NestJS; the public demo runs the same code on synthetic aggregates, redacts every record-level field (policy numbers, insurers, claimants) behind explicit "Redacted" bars, and shows the AI panel as a visual replica with a clear "Not available" state instead of fabricated answers.

### Tech tags

React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · ECharts · NestJS · Feishu Bitable · Feishu Spark · Feishu Aily · docx

### Highlights

- Pro-rata monthly attribution of annualised premium to policy years, so a chain of back-to-back 18-month policies contributes exactly one year of premium to each handover year instead of two.
- A data layer that survives the platform: tolerant extractors for every Bitable value shape, a localStorage cache with key-presence and version guards, and a loader that falls back to a bundled dataset so every page renders even outside Feishu.
- AI report generation that stays honest: one skill call per section with pinned output structure, full class names supplied alongside every code, an IBNR caveat on immature years, and live dashboard charts re-inserted into the model's Markdown before export to Word or Feishu Docs.

---

## 中文

### 简介（约 160 字）

一个建在公用事业公司飞书租户内部的风险管理工作台，服务于一套 34 个险种的企业保险计划。此前保费、保单期间和理赔分散在经纪人汇总表、三份理赔台账和成堆的 PDF 里，一个简单的问题要手工算上几小时。应用通过平台 capability 读取三张多维表格（34 个险种、201 行保单、767 个理赔），在浏览器里关联，用结构和版本双重守卫缓存，再以按月 pro-rata 规则计算保费、趋势和赔付率，18 个月首尾相接的保单链不会被重复计算。Aily 智能体在聊天里答疑；服务端代理按报告板块逐个调用 Aily 技能，前端把实时图表插回原位，可导出 Markdown、带图 Word、PDF 或飞书文档。基于飞书妙搭，用 React、TypeScript 和 NestJS 实现；公开 demo 用同一套代码跑在合成的聚合数据上，保单号、保险公司、索赔人等记录级字段一律以明确的"Redacted"遮蔽条呈现，AI 面板只做视觉复刻并明示"Not available"，不伪造回答。

### 技术标签

React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · ECharts · NestJS · 飞书多维表格 · 飞书妙搭 · 飞书 Aily · docx

### 亮点

- 年化保费按月 pro-rata 归集到保单年度，首尾相接的 18 个月保单链在交接年份只贡献恰好一年的保费，而不是两年。
- 一套扛得住平台变化的数据层：兼容所有 Bitable 值形态的容错提取器、带键存在和版本双重守卫的 localStorage 缓存、以及在飞书之外也能靠内置数据集渲染每个页面的加载器。
- 不说假话的 AI 报告：每个板块单独调用技能并固定输出结构，每个险种代码旁都附全称，未成熟年度加 IBNR 提示，模型输出的 Markdown 里插回 Dashboard 实时图表后再导出到 Word 或飞书文档。
