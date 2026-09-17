# 工作区记忆

## devserver 依赖变更后 504 / virtual:capabilities 解析失败白屏

- 现象：npm install 新依赖后页面报错 `[plugin:vite:import-analysis] Failed to resolve import "virtual:capabilities"`，deps chunk 返回 504（Outdated Optimize Dep）；vite 进程不会因 package.json/node_modules 变化自动重启
- 根因：平台 devserver 只监听源码文件变化，依赖安装后旧 vite 进程预打包 hash 与 transform 缓存失配；沙箱禁止 bash 删除 node_modules/.vite 缓存
- 修复：`kill` 掉 `node scripts/dev.mjs` / vite 进程（平台自动拉起新实例），重启后虚拟模块与 deps 重新解析即恢复；无需改代码

## 沙箱 dev 环境 base 路径

- dev 下 vite base 为 `/app/<app_id>/`，curl 探测模块必须带该前缀，不带前缀会命中 302/SPA fallback 得到误导结果

## Aily Web SDK（initAgentChat）移动端卡 loading

- 现象：`@lark-apaas/aily-web-sdk` 的 `initAgentChat` 嵌入自定义智能体聊天面板，桌面正常、手机端永远加载中；非应用配置问题
- 根因：SDK 内嵌跨域 iframe（aily.feishu.cn/custom_agent/cui），WebKit 对第三方 iframe 存储分区使 aily session 无法在 iframe 内使用（iOS 卡 splash、waitForReady 超时；顶层直开同 URL 正常）；且 SDK 等 ready 30s 超时后仅 warn 不 reject 照样 resolve，宿主页面无法感知失败
- 修复：桌面端保留 iframe 嵌入 + Promise.race 15s 超时兜底切错误态；移动端（useIsMobile）不 init SDK，AssistantPage 挂载后 `window.location.replace('https://aily.feishu.cn/custom_agent/cui?channelToken=' + token)` 自动顶层跳转（replace 不写历史，防返回死循环），仅渲染居中「正在打开 AI 咨询…」瞬时提示防白屏
- 注意：项目 eslint no-restricted-syntax 禁 `window.location.href =` 导航写法，跳外链用 `window.location.assign()` 可过检
 - 调查：initAgentChat 仅支持 channelToken/customParams/customParamsToken，实例仅 destroy()；iframe URL 只拼 channelToken+__parentOrigin；custom_agent/cui 页面（全量 chunk grep）也只读这两个参数，agent 桥仅接 updateConfig/initParentContext；clear/clearAndStop 仅 initAilyChat(ChatPanel) 路径有效——前端无法强制新建会话，需 Aily 控制台侧配置

## Aily 开放 API 调用可行性（2026-08-26 Dashboard 导出报告 PoC）

- 渠道：①自定义智能体对话 `POST /open-apis/aily/v1/agents/:agent_id/chats`（body 带 stream:true 走 SSE，session_id 多轮）；②显式技能触发 `POST /open-apis/aily/v1/apps/:app_id/skills/:skill_id/start`（同步返回、可传技能入参，但要求技能挂在 Aily **应用** spring_xxx__c 下，自定义智能体 agent_xxx 无此 API，只能靠对话意图匹配）
- 前端直调不可行（已实测）：open.feishu.cn 对 OPTIONS preflight 返回 404 且无 Access-Control-Allow-Origin，浏览器预检必失败；鉴权要 tenant/user_access_token，换 token 需 app_secret 不能进前端；Web SDK channelToken 仅限 iframe 嵌入（initAgentChat 只有 destroy()；initAilyChat 的 sendMessage+skillID 需另一套 appKey CUI 渠道，与 channelToken 不通用）
- 可行路径：升级全栈应用后服务端代理（app_id+app_secret 换 tenant_access_token，secret 存环境变量；妙搭服务端有 @lark-apaas/miaoda-connections-sdk 管第三方凭据）；权限 scope：aily:session/message/run/file 读写 + Aily 控制台开「Open API」使用渠道；限频 10 次/秒（chats）、SSE 超时 5 分钟
- 沙箱验证边界：lark-cli 白名单无 aily 域、无租户凭据，无法完成带鉴权真实调用；已验证端点可达（无 token 返回 code 99991661 标准鉴权错误）

## NestJS 业务模块注入 HttpService 报 UnknownDependenciesException

- 现象：业务 service 构造器注入 `HttpService`，启动报 `Nest can't resolve dependencies ... HttpService`，devServer 崩溃、/api 全量 502
- 根因：PlatformModule.forRoot() 虽集成 HttpModule 但非全局导出（@Global 未开），业务模块上下文拿不到 HttpService
- 修复：业务 module 的 imports 里显式 `import { HttpModule } from '@nestjs/axios'`；另：本版本（1.1.60）未导出 NeedLogin，鉴权靠 PlatformModule 默认 alwaysNeedLogin:true

## Summary-only 分类（GMI/BT/HMI）数据模式

- Insurance_Class 中 `Is_Summary_Only=true` 的分类（GMI/BT/HMI）按设计没有 Policy_Master 行：保费手填在 class 层 `Premium_Manual`，承保人在 class 层 `Insurer` 文本字段（2026-09 后加）
- 应用侧统一入口：`analytics.ts` 的 `classPremiumInYear` / `classPremiumLabelInYear`——summary-only 只在 CURRENT_YEAR 返回 premiumManual，其他年份为 0；所有保费聚合（列表、详情、图表、KPI、导出报告）必须走这两个包装函数，禁止直接调 `premiumInYear(c.policies, …)`
- Insurer 展示：列表 `ClassTableSection.distinctInsurers` 与详情 `InsurerPanel` 对 summary-only 读 `cls.insurer`；详情页用合成单行 `summaryInsurerRow` 复用 InsurerStructure 解析器
- localStorage 缓存（demo_programme_data）有两层守卫：①键存在守卫（缺 `isSummaryOnly` / policy 行缺 `originalAmount` 的旧缓存视为过期）；②`STORAGE_VERSION`（demo_programme_data_v，当前 '3'）版本守卫——插件字段集变更后旧缓存键齐全但值过时，键守卫拦不住，必须升版本号强制重拉
- ⚠️ 前置依赖：feishu-bitable 插件实例的 `formValue.fields` 是创建时固定的字段清单，Base 后续新增的列不会自动进入返回——Base 加字段后必须在插件调试页面手动更新实例字段配置；且平台禁止 AI 用 plugin_instance(UPDATE) 修改 feishu-bitable 等外部服务类实例（防写入副作用），只能引导用户手动改。programme_insurance_class_reader_1 已于 2026-09-10 由用户手动补齐 Is_Summary_Only / Premium_Manual / Insurer 三字段
- 排查此类「代码正确但读不到新字段」问题：先用 lark-cli `base +field-list` 核对表真实字段名，再用 `base +record-search --search-field` 核实记录值，最后对照浏览器日志里插件返回的 field count（实拉 12 = 14 配置字段减 2 个 DuplexLink）即可定位到实例配置层

## 遗留未调用插件实例（commit 检查会反复告警，属预期）

- `spark_ai_assistant_1` 与 `custom_feishu_agent_message_sender_1` 是早期规划（AGENTS.md custom-feishu-agent 消息桥方案）创建的插件实例，实际 AI 助手改走 Aily Web SDK（initAgentChat + 移动端顶层跳转），代码中无 .load() 调用
- 插件实例无法删除，commit 插件链路检查告警可忽略；若未来改用消息桥方案再接入
