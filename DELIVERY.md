# Internal Insurance Program — 交付说明

> Dealer Insurance Program → Internal Insurance Program 改造完成。本文档覆盖：改动清单、
> 你需要在 Spark 里做的绑定步骤、待核对的字段名清单、mock→真实数据切换验证步骤。
> 改造规格来源：programme 的 Spark HANDOFF 文档（2026-08-19）。

## 1. 一句话总结

数据源换成 the programme 的三表（Insurance_Class 34 / Policy_Master 201 / Claims_Master 767），
页面从经销商视角换成险种视角，Dashboard 按新规格重做（KPI + 双 pie 年度选择器 +
期间重叠年度归集的保费趋势 + 理赔区），并真正接通了 mock 兜底（capability 不可用时
四个页面用内置合成数据渲染，右上角显示 "Synthetic data" 徽标）。

## 2. 改动文件清单

**新增**
- `src/lib/field-names.ts` — 三表字段名常量（唯一出处，见 §4 核对清单）
- `src/data/programme.ts` — 三表类型定义 + 合成数据（聚合层合成、记录层字段以 REDACTED 哨兵存储；覆盖 HANDOFF Part E 全部数据怪癖）
- `src/lib/data-source.ts` — capability 读取（分页 searchRecords）、localStorage 缓存、
  mock 兜底、Bitable 深链构造。⚠️ 命名决策：新数据模块叫 `data-source.ts`（而非覆写
  原 `bitable.ts`），原 dealer 版 `bitable.ts` 已删除
- `src/lib/analytics.ts` — 纯函数聚合层：**按月 pro-rata 年度归集（D1-c 修订版，
  见 §5 说明）**、按险种/Broker 聚合、Top7+Others、趋势、KPI、loss ratio 矩阵、
  `validateBaselines` 基准自检
- `src/pages/ClassDetailPage/` — 险种详情页（历年保单 + 理赔，路由 `/data/class/:classId`）
- `src/pages/DashboardPage/sections/` 六个新 section（PremiumByClass/PremiumByBroker/
  PremiumTrend/ClaimsByYear/IncurredByClass/LossRatioTable）
- `src/pages/DataManagePage/sections/ClassTableSection.tsx`
- `shared/capabilities/programme_insurance_class_reader_1.json`、`programme_policy_master_reader_1.json`、
  `programme_claims_master_reader_1.json` — 三份 capability 模板（tableID 为占位符，见 §3）

**重写**：`DashboardPage.tsx`、`KpiCardsSection.tsx`、`DataManagePage.tsx`、
`StatsCardsSection.tsx`、`app.tsx`（路由）、`AppSidebar.tsx`（标题/导航）、`index.html`（标题）

**删除**：`DealerDetailPage/`、`ProgressPage/`（经确认删除）、`src/data/dealer.ts`、
`src/data/dealer-data.json`、`src/lib/bitable.ts`、`hero-component.tsx`、Dashboard 全部
dealer 时代 sections、`DealerTableSection.tsx`、4 份 dealer 相关 capability json

**未动**：`src/components/ui/*`（shadcn 生成件）、`AssistantPage`（Aily SDK 结构与
channel token 原样保留）、`shared/plugin-types.ts`（平台自动生成，绑定新 capability 后
会由 Spark 重新生成）、`client/` 目录（模板遗留物，无路由引用，可自行删除）

## 3. 你需要在 Spark 里做的绑定步骤

1. 把 `code/` 整个目录导入 Feishu Spark（妙搭）。
2. 在 Spark 的插件/capability 配置里，为三份 capability 各自绑定 the programme 的 Base
   （appToken 已填好；本 demo 仓库中替换为占位符 `demo-base-token`）：
   - `programme_insurance_class_reader_1` → Insurance_Class 表
   - `programme_policy_master_reader_1` → Policy_Master 表
   - `programme_claims_master_reader_1` → Claims_Master 表
   绑定时把每份 json 里 `tableID` 的 `TODO_TABLE_ID` 换成实际 tableID。
3. 把三个实际 tableID 同步填到 `src/lib/field-names.ts` 的 `TABLE_IDS`（这决定了详情页
   "View in Bitable" 深链和 PDF 附件的兜底链接；不填也能运行，只是深链退化为 Base 首页）。
4. 按 §4 核对字段名。
5. Aily agent 绑定保持你现有的飞书侧配置（代码未改动）。建议在 Aily 控制台配置示例问题：
   「EC 25/26 保费多少？」「PARMBBI 现在的保单期间？」「Open 的 Motor 理赔有哪些？」

**注意**：capability json 中公式/rollup 字段的 `type: 20 / bizType: Formula` 与
单选 `type: 3`、复选框 `type: 7` 是按 Bitable 标准码填的设计值。**如果 Spark 绑定界面
重新生成了 fields 配置，以 Spark 生成的为准**（代码侧提取器对文本/数字/对象形态都做了
兼容，type 码差异不影响解析）。

## 4. 待核对字段名清单（⚠️ 必须逐字符一致）

字段名唯一出处是 `src/lib/field-names.ts`。以下是设计名，请对照 Base 实际列名核对，
不一致时同时改 field-names.ts 与对应 capability json：

- **Insurance_Class**：Class_Code, Full_Name, Item_No, Broker, Is_Core, Has_Claims_Ledger,
  Class_Level, Currency, Premium_Current_Year, Claims_Count_Rollup, Open_Claims_Rollup,
  Total_Incurred_Rollup
- **Policy_Master**：Policy_ID, Policy_No, Policy_Year, Class, Sub_Policy, Period_Start,
  Period_End, Insurer, Broker, Currency, Premium_Full_Term, **Premium_Annualized_12m**,
  Is_Placeholder, PDF_Policy, PDF_Endorsement, PDF_DN_CN, Claims_Count, Claims_Incurred,
  Loss_Ratio, Remarks
- **Claims_Master**：Claim_ID, Claim_No, Class, Policy, Policy_Year, DOL, Claimant,
  Description, Loss_Location, Lead_Insurer_Ref, Sequence_No, Case_Value_Ind, Case_Value_Exp,
  Reserve_Ind, Reserve_Exp, Reserve_Total, Paid_Total, Total_Incurred, Paid_Ind, Paid_Exp,
  Excess_Recovered, Status, Last_Update_Note, Remarks, Source_File

另外两个单选值假设也请核对：`Class_Level` 的取值按「主险种」/「附属·项目保单」判断
（代码用包含匹配，见 `analytics.ts` 的 `classLevelLabel`）；`Status` 取值 Open/Closed。

## 5. mock → 真实数据切换验证步骤

数据加载顺序：localStorage 缓存 → capability 拉取（成功即缓存）→ 失败落 mock。

1. 未绑定 Base 时打开应用：四页面用合成数据渲染，右上角有 **"Synthetic data"** 徽标 —— 正常。
2. 绑定完成后，点任意页面右上角 **Sync** 按钮强制拉取。成功后徽标消失，toast 显示
   `Data loaded, 34 insurance classes`。
3. 打开浏览器控制台看 `[baselines]` 三行日志（每次数据加载后自动输出），对照基准：
   - Claims total=**767**, open=**68**；PPL: count=127, open=5, incurred=5,740,590.44；
     Motor: count=263, open=48, incurred=8,856,664.20；EC: count=377, open=15, incurred=23,046,607.38
   - Premium trend：26/27 = **31.08M**。**年度归集口径为按月 pro-rata**（2026-08-19 修订）：
     某行计入年度桶 N 的金额 = 年化保费 × 重叠月数 ÷ 12。PARMBBI 是 18 个月首尾相接的
     保单链（23-24 保到 2024/09/30、24-26 从 2024/10/01 接续），交接年（如 24/25）由前后
     两张保单各按重叠月份分摊、合计约一个 PA12，**不会双计**；1 Jan–31 Dec 等非 4 月锚定
     的行会跨两桶按 3/12 + 9/12 分摊。整 12 个月 4 月对齐的普通保单不受影响。注意 HANDOFF
     的参考值（24/25 ≈ 32.4M 等）是按旧"重叠即计全额"口径估的，pro-rata 后交接年会明显
     低于该参考值，属预期；若 Period_Start/Period_End 没读到，归集会退化为 Policy_Year
     字符串匹配（PARMBBI 交接年份额消失），需检查字段绑定
4. 抽查页面：Dashboard 两个 pie 切换年度（23/24 的 Broker pie 应出现灰色
   "Unknown (2023 file)" 分片）；险种总览 34 行分组正确；PPL 详情页 26/27 应有
   两行 Primary 保单（公开 demo 中保单号显示为 Redacted）、Excess 行保费为 "-"、占位行灰显带 Placeholder 徽标；
   理赔表 PPL/Motor/EC 列各不相同。
5. 如需清缓存重测：控制台执行 `localStorage.removeItem('demo_programme_data')` 后刷新。

## 6. 已验证项（本地 mock 走查，2026-08-19）

- `npm run typecheck`、`npx eslint src` 全绿。
- 四页面 mock 渲染无应用层控制台错误（本地出现的 capability/account 404 是 Spark 壳层
  在本地环境的预期行为，正是 mock 兜底的触发条件）。
- 聚合逻辑用 node 脚本对 mock 数据全量断言通过：PARMBBI `24-26` 同时计入 24/25 与 25/26、
  不计入 23/24 与 26/27；26/27 合计 31,084,661.4；Top7+Others 折叠；Unknown broker 分片；
  占位行理赔计入理赔统计、排除保费统计；Group Travel 空保费排除。
- Part F 验收清单逐项核对通过（build 除外，见 §7）。

## 7. 已知限制与小决策记录

1. **`npm run build` / `npm run dev` 本地不可用**：导出包里没有 `scripts/` 目录
   （dev.mjs/build.sh 是 Spark 平台自带）。本地开发用 `npx vite`；**build 需在 Spark
   平台完成验证**。`npm install` 需加 `--ignore-scripts`（prepare 钩子同样引用缺失脚本）。
2. mock 数据不写入 localStorage（防止污染真实数据缓存），所以未绑定期间每次进页面都会
   重试一次 capability——这是有意为之，绑定成功后第一次拉取即缓存。
3. `DATA_PERIOD`（页面副标题 "Data as of 2026 Q1"）沿用原值，请按理赔数据截止期在
   `src/lib/data-period.ts` 更新。
4. 图表沿用代码库实际使用的 **ECharts**（HANDOFF 提到的 recharts 封装 `ui/chart.tsx`
   在原库中就是零引用死代码，予以保留未删，因其属 `components/ui/` 禁改范围）。
5. Assistant 页的示例问题不在代码里（聊天面由 Aily SDK 全托管），需在 Aily 控制台配置。
6. 理赔挂靠：claims 优先用 Class 关联，缺失时通过 Policy 关联反查险种（767 条全绑定，
   正常情况不会走到反查）。

## 8. 公开 demo 脱敏规则（2026-09）

- 不出现任何公司名：程序名统一用 `src/lib/brand.ts` 的 `PROGRAM_NAME` / `PROGRAM_SHORT` / `ORG_LABEL`。
- 聚合层（各险种各年度保费、损失率、理赔数、Dashboard 图表/KPI）为合成数字，右上角 "Synthetic data" 徽标说明。
- 记录层可识别真实实体/文件的字段（保单号、承保人名称、理赔号、索赔人、事故描述、地点、附件名、备注、来源文件）
  存为 `REDACTED` 哨兵，由 `<Redacted />` 统一渲染为灰条 "Redacted for public demo"，不编造替代值。
- Broker 是图表分类，改为 Broker A–D / Others。
- "Sync Data" / "View in Bitable" / 附件链接在公开 demo 中不可用（toast / 禁用态提示 "Not available in public demo"）。
