import type { ComponentType } from 'react'

import type { ReportSectionKey } from '@shared/api.interface'
import type { IClassWithRelations } from '@/data/programme'
import type { PolicyYear } from '@/lib/analytics'
import PremiumByClassChart from '../charts/PremiumByClassChart'
import PremiumByBrokerChart from '../charts/PremiumByBrokerChart'
import PremiumTrendChart from '../charts/PremiumTrendChart'

export interface ReportChartProps {
  classes: IClassWithRelations[]
  year: PolicyYear
}

export interface ReportSectionOption {
  key: ReportSectionKey
  label: string
  /** 报告预览按二级标题匹配板块（AI 生成的标题写法可能有细微差异） */
  titlePattern: RegExp
  /** 该板块在段落与数据表之间插入的 Dashboard 同源图表；无对应图表则不插 */
  Chart?: ComponentType<ReportChartProps>
}

/** 板块 → 标题匹配 + 图表组件映射（报告预览的唯一配置表） */
export const REPORT_SECTION_OPTIONS: ReportSectionOption[] = [
  {
    key: 'premiumByClass',
    label: 'Premium by Class',
    titlePattern: /premium\s+by\s+class/i,
    Chart: PremiumByClassChart,
  },
  {
    key: 'premiumByBroker',
    label: 'Premium by Broker',
    titlePattern: /premium\s+by\s+broker/i,
    Chart: PremiumByBrokerChart,
  },
  {
    key: 'premiumTrend',
    label: 'Premium Trend',
    titlePattern: /premium\s+trend/i,
    Chart: PremiumTrendChart,
  },
  {
    key: 'lossRatio',
    label: 'Loss Ratio',
    titlePattern: /loss\s+ratio/i,
  },
  {
    key: 'claimsOverview',
    label: 'Claims Overview',
    titlePattern: /claims?/i,
  },
]

export function matchReportSection(
  title: string,
): ReportSectionOption | undefined {
  return REPORT_SECTION_OPTIONS.find((o) => o.titlePattern.test(title))
}

export const ALL_SECTION_KEYS: ReportSectionKey[] = REPORT_SECTION_OPTIONS.map(
  (o) => o.key,
)
