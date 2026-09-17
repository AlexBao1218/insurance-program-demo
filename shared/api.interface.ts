/* 前后端共享的类型写在这里 */

/** Dashboard 可导出报告板块 */
export type ReportSectionKey =
  | 'premiumByClass'
  | 'premiumByBroker'
  | 'premiumTrend'
  | 'lossRatio'
  | 'claimsOverview';

/** Dashboard 一键导出报告请求（Aily 技能结构化输入） */
export interface GenerateReportRequest {
  /** Dashboard 当前渲染状态的数据快照（全部数据行、KPI、年份、口径脚注、full_name） */
  report_data: Record<string, unknown>;
  /** 勾选的板块英文标签 */
  sections: string[];
  /** 用户补充说明 */
  notes?: string;
  /** 报告口径标注，如 "Policy Year 25/26 · Trend 23/24–26/27"，服务端拼入标题下方 */
  report_caliber?: string;
}

/** Dashboard 一键导出报告响应 */
export interface GenerateReportResponse {
  /** Markdown 格式的报告全文 */
  report_markdown: string;
  /** 是否为 mock 响应（凭据未配置时） */
  mock: boolean;
  /** 生成失败的板块名称列表（仅并行调用有失败时返回） */
  failed_sections?: string[];
}

/** 导出 Markdown 为飞书云文档请求 */
export interface ExportReportToDocRequest {
  markdown: string;
  title: string;
}

/** 导出 Markdown 为飞书云文档响应 */
export interface ExportReportToDocResponse {
  url: string;
  docToken: string;
}
