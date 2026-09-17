import { PROGRAM_NAME, REPORT_TITLE } from '@/lib/brand'

/**
 * Canned report narrative for the standalone demo.
 *
 * In production the narrative was written by a Feishu Aily skill from the dashboard
 * data snapshot. Here the prose is fixed; `generateReport` in `@/api/report` swaps the
 * data tables below for ones built from the live dashboard snapshot so the numbers
 * always match the charts. Absolute HKD amounts are withheld everywhere in the
 * public demo — amount cells (here and in the live tables) read "Redacted".
 */
export const MOCK_REPORT_MARKDOWN = `# ${REPORT_TITLE}

This report summarises the ${PROGRAM_NAME} for the selected policy year: premium composition by class and broker, the four-year premium trend, loss ratios for the claims-ledger classes and an overview of claims activity.

## Executive Summary

Key findings from the insurance portfolio analysis for the selected policy year. The metrics below cover different time periods and should be read independently.

| Metric | Value |
| --- | --- |
| Premium (Current Policy Year) | Redacted |
| Active Premium Items | Redacted |
| Claims Count (All Years) | Redacted |
| Open Claims | Redacted |
| Total Incurred (All Years) | Redacted |

Total incurred spans every claim year on the ledger, while the premium figure reflects only the selected policy year; the two are not directly comparable.

## Premium by Class

The core classes remain the largest premium contributors for the selected policy year. The table below lists the Top-N classes with their full names and premium share; smaller classes are aggregated as Others.

| Class | Full Name | Premium | Share (%) |
| --- | --- | --- | --- |
| EC | Employees' Compensation | Redacted | 38.2 |
| PPL | Public Liability | Redacted | 18.9 |
| Motor | Motor Fleet | Redacted | 13.9 |
| PARMBBI | Property All Risks & Machinery Breakdown | Redacted | 12.6 |
| Others | Others (aggregated) | Redacted | 16.4 |

Premium allocated pro-rata by month to the policy year.

## Premium by Broker

Premium placement is concentrated among a small number of brokers. Brokers are attributed per policy row for the selected year, so a class placed through different brokers in different years is reflected accordingly.

| Broker | Premium | Share (%) |
| --- | --- | --- |
| Redacted | Redacted | 44.0 |
| Redacted | Redacted | 27.8 |
| Redacted | Redacted | 28.2 |

Premium allocated pro-rata by month to the policy year.

## Premium Trend

Annualised premium has been broadly stable across the policy years in scope, with the core classes accounting for the majority of spend in every year.

| Policy Year | Core Classes | Other Classes | Total |
| --- | --- | --- | --- |
| 23/24 | Redacted | Redacted | Redacted |
| 24/25 | Redacted | Redacted | Redacted |
| 25/26 | Redacted | Redacted | Redacted |
| 26/27 | Redacted | Redacted | Redacted |

Annualised premium allocated pro-rata by month.

## Loss Ratio

Loss ratios for the two most recent policy years are understated because claims are still developing (IBNR); they are not indicative of final outcomes.

Loss ratio = Total Incurred ÷ Annualised Premium (allocated pro-rata by month).

| Class | Full Name | Policy Year | Incurred | Premium | Loss Ratio (%) | Status |
| --- | --- | --- | --- | --- | --- | --- |
| EC | Employees' Compensation | 25/26 | Redacted | Redacted | 15.9 | Developing |
| PPL | Public Liability | 25/26 | Redacted | Redacted | 9.0 | Developing |
| Motor | Motor Fleet | 25/26 | Redacted | Redacted | 20.0 | Developing |

## Claims Overview

Claims activity for the selected policy year is concentrated in the classes that carry a claims ledger. Open claims require follow-up with the corresponding adjusters.

| Class | Full Name | Claims Count | Open Claims | Total Incurred |
| --- | --- | --- | --- | --- |
| EC | Employees' Compensation | Redacted | Redacted | Redacted |
| PPL | Public Liability | Redacted | Redacted | Redacted |
| Motor | Motor Fleet | Redacted | Redacted | Redacted |

## Data Notes

- Premium allocated pro-rata by month to the policy year.
- Loss ratio = Total Incurred ÷ Annualised Premium (allocated pro-rata by month).
- Monetary amounts (HKD) are withheld in the public demo; shares, counts and ratios are computed from the synthetic dashboard data snapshot.
- Narrative text is simulated in this standalone demo.
`
