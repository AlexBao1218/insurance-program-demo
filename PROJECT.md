# Insurance Program Demo — 项目手册

两部分。第一部分给 Alex 看，讲这个东西在哪、怎么预览、怎么放进个人网站。
第二部分给 AI 看，讲架构、规则和不能碰的东西。改代码前两部分都读。

---

## Part 1 · 给 Alex

### 这是什么

在公司用飞书妙搭（Spark）做的保险项目管理系统的公开作品集版本。前端原样保留，飞书运行时用一个本地 shim 替掉，数据是合成的，记录级字段全部遮蔽，AI 功能只保留形态不保留能力。

### 在哪

| 位置 | 地址 |
|---|---|
| 本地 | `~/Desktop/insurance-demo` |
| GitHub | https://github.com/AlexBao1218/insurance-program-demo（目前 **private**，确认没问题后再改 public） |
| 线上 | https://insurance-demo.zijun.cloud |
| 原始导出包 | `~/Downloads/` 里的 insurance 导出 zip（含真实标识，不要上传到任何地方） |

### 本地预览

```bash
cd ~/Desktop/insurance-demo && npm run dev
```

打开 http://localhost:5173。五个页面：`/`（Hub）、`/dashboard`、`/assistant`、`/data`、`/data/class/recClsEC`（任意险种详情）。

生产构建检查：

```bash
cd ~/Desktop/insurance-demo && npm run typecheck && npm run lint && npm run build
```

### 部署到 Vercel

Vercel CLI 在这台机器上没有登录，所以我没有部署。步骤：

```bash
cd ~/Desktop/insurance-demo && vercel login
```

```bash
cd ~/Desktop/insurance-demo && vercel --prod
```

第一次会问项目名，用 `insurance-program-demo`。`vercel.json` 已经配好 SPA 重写，`vite build` 输出 `dist/`，Vercel 会自动识别 Vite。

部署完成后在 Vercel 项目的 Domains 里加 `insurance-demo.zijun.cloud`，然后到 DNSPod 给 `zijun.cloud` 加一条 CNAME：`insurance-demo` → `cname.vercel-dns.com`。

### 放进 zijun.cloud

zijun.cloud 的项目页由 JSON 驱动，不用写 TSX。要做的事：

1. 在 `content/projects/_index/en.json` 和 `zh.json` 的 `projects` 数组加一条，slug 用 `insurance-program`（demo 页顶部横幅的 "How it was built" 链接已经指向 `https://zijun.cloud/en/projects/insurance-program`，slug 不要改）。
2. 新建 `content/projects/insurance-program/en.json` 和 `zh.json`。素材直接取：
   - 卡片文案、标签、亮点：本仓库 `docs/portfolio-summary.md`
   - 正文各节：本仓库 `docs/case-study.md`（英文）和 `docs/zh/case-study.md`（中文）
   - 架构图和 ER 图：`docs/architecture.mmd`、`docs/data-model.mmd`
3. `meta.url` 填 demo 线上地址，`urlLabel` 写 "Open demo"。
4. AI 助手"能做什么"的示意图放在这个项目页里，不放在 demo 里。demo 的 AI 页只是形态复刻。
5. 截图：README 里有占位段落，部署后截 Hub、Dashboard、险种详情、AI 页各一张。

case study 里有几处 `[TO FILL]`（使用人数、节省时间等业务指标），发布前填掉或删掉。

### 还没做的事

- Vercel 部署和子域名
- zijun.cloud 项目页
- README 截图
- GitHub 仓库切 public

---

## Part 2 · For AI agents

Read this before touching any file. The rules in "Disclosure policy" are not negotiable and were set by the owner for Hong Kong compliance reasons.

### Purpose

Public portfolio demo of an internal insurance-programme management app the owner built on Feishu Spark (妙搭). The goal is to show the system's design and interaction, not its data. Anything that would identify the employer, its counterparties, or real figures is withheld.

### Disclosure policy (hard rules)

1. **No company name, real or fictional.** The programme is `PROGRAM_NAME` = "Internal Insurance Program". Never invent a stand-in company, insurer, broker, or person. Invented specifics were tried and rejected by the owner as misleading.
2. **Withhold, don't substitute.** A withheld value renders as the `<Redacted />` bar (`client/src/components/Redacted.tsx`), never as a made-up value, never as a dash. In any withheld column, every cell shows the bar, including cells that were empty in the source.
3. **What is withheld:** all monetary amounts (any currency), all day-level dates, policy/claim numbers, insurer and broker names, claimants, descriptions, locations, attachment names, remarks, claim counts, loss ratios, per-layer co-insurance shares.
4. **What may show:** class codes and standard class names, policy-year labels (`26/27`), month-level cutoff ("Data as of June 2026"), share percentages in the premium donuts, chart shapes and proportions, claim status, layer structure (Primary / Excess / Lead) and the "Total 100%" line, counts of pages.
5. **Feishu-only features say so.** Bitable sync, deep links, Feishu Docs export, and live AI show `NOT_AVAILABLE_LABEL` ("Not available in public demo"). The assistant page is a visual replica of the Aily panel; every message gets the not-available notice, never a generated answer.
6. **Data Management list:** 12 rows per page, only page 1 renders rows, pages 2+ show the privacy notice at the same card height. Search covers page 1 only.
7. **Never reintroduce** the real short name, the employer name, tenant domain, Base app token, Aily channel token, Feishu app id, or real broker/insurer names. Run the leak scan below before every commit.

### Architecture

Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui + ECharts. Static SPA, no backend.

```
client/src/
  platform/index.tsx      shim replacing @lark-apaas/client-toolkit (logger, capabilityClient
                          that always rejects, demo user, scopedStorage, UniversalLink, Toaster)
  lib/brand.ts            naming + disclosure constants (PROGRAM_NAME, REDACTED, labels)
  lib/data-source.ts      load chain: localStorage → capability (rejects) → bundled dataset
  lib/analytics.ts        pure aggregations: pro-rata annualisation, top-N, loss ratio,
                          classNameLookup (display name = full name up to first comma)
  data/programme.ts       34 classes, one policy per class-year, hand-written claims +
                          seeded synthetic claims (767 total); identity fields = REDACTED
  data/ai.ts              assistant copy (welcome, suggested questions, notice)
  data/mock-report.ts     canned report narrative (amounts/counts already "Redacted")
  api/report/index.ts     client-side generateReport (merges canned text + redacted tables)
  components/Redacted.tsx <Redacted />, <Sensitive />, isRedactedValue
  components/DemoFooter.tsx (bottom disclosure line), Layout.tsx (sidebar 18rem), AppSidebar.tsx, Header.tsx
  pages/HomePage          hub with two programme cards (Dealer card disabled)
  pages/DashboardPage     sections/ + charts/ + report/ (export pipeline, DOCX, PNG capture)
  pages/DataManagePage    paginated class list
  pages/ClassDetailPage   chips, insurer panel, policies tab, claims tab, claim dialog
  pages/AssistantPage     Aily panel replica
server/capabilities/      plugin definitions kept as documentation (tokens scrubbed)
docs/                     case study EN/ZH, mermaid diagrams, portfolio blurb
DELIVERY.md, .agent-memory/MEMORY.md   engineering history from the original build (scrubbed)
```

Vite aliases `@lark-apaas/client-toolkit*` to the shim, so page code still imports the original names.

### Commands

```bash
npm run dev        # http://localhost:5173
npm run typecheck  # tsc, must be clean
npm run lint       # eslint, 0 errors (2 known warnings in report/ExportReportForm.tsx)
npm run build      # vite build → dist/
```

Leak scan (must print nothing). The word list — employer, its abbreviation, the retired fictional brand, tenant/app/key prefixes, broker and insurer names — lives outside the repo at `~/Desktop/.leakscan/insurance.txt`:

```bash
grep -rniwf ~/Desktop/.leakscan/insurance.txt client/src shared server docs README.md PROJECT.md dist
```

### Conventions

- Page headers: `h1` `text-[28px] font-bold tracking-[-0.02em]`, subtitle `mt-1 text-[13px] text-muted-foreground` with `DATA_PERIOD`.
- Cards on Assistant and Data Management are `h-[calc(100vh-12rem)] min-h-[420px]` so their bottoms align across pages.
- Charts: keep axes, ticks, gridlines and category labels; hide numeric tick values and data labels; tooltips print "Redacted" for withheld figures.
- Brokers stay as internal grouping keys (`Broker A`…`Others`) in `data/programme.ts` only; they are never rendered.
- Do not add company logos. The mark is lucide `ShieldCheck`.
- English UI copy. The owner reviews visually; when in doubt take a screenshot at 1440×900.

### Verification before claiming done

1. typecheck, lint, build all clean.
2. Leak scan empty.
3. Browser pass of all five routes plus one class detail with Policies and Claims tabs, at desktop and 375px, no console errors on a fresh load.
4. Every withheld column shows the bar in every row.

### Where the history lives

- `docs/case-study.md` — architecture, data model, decisions, outcomes (has `[TO FILL]` placeholders).
- `DELIVERY.md` §8 and `AGENTS.md` — the disclosure rules in the original handoff wording.
- `.agent-memory/MEMORY.md` — incident log from the original Spark build (iOS iframe storage partitioning, Feishu API CORS, cache version guards).
- Git log — every disclosure decision is a separate commit with the reasoning in the message.
