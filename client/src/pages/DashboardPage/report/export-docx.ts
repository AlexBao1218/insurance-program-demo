import type { Paragraph, Table, TextRun } from 'docx'
import { REPORT_TITLE } from '@/lib/brand'
import { REDACTED_AMOUNT } from '@/api/report'

export async function generateDocxBlob(markdown: string, chartScreenshots?: Map<string, string>): Promise<Blob> {
  const {
    Document, Packer, Paragraph, TextRun,
    Table, TableRow, TableCell,
    HeadingLevel, WidthType, BorderStyle, AlignmentType,
    PageNumber, Footer, Header, ImageRun,
  } = await import('docx')
  const { marked } = await import('marked')

  const tokens = marked.lexer(markdown)
  const children: (Paragraph | Table)[] = []

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  let figureCounter = 0

  function renderToken(token: (typeof tokens)[number]): Paragraph | Table | (Paragraph | Table)[] | null {
    const CHART_MAP: Record<string, string> = {
      'premium by class': 'premium-by-class',
      'premium by broker': 'premium-by-broker',
      'premium trend': 'premium-trend',
    }
    const type = token.type

    if (type === 'heading') {
      const t = token as unknown as { depth: number; text: string }
      const headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel] =
        t.depth === 1 ? HeadingLevel.TITLE
        : t.depth === 2 ? HeadingLevel.HEADING_1
        : HeadingLevel.HEADING_2
      const headingPara = new Paragraph({
        heading: headingLevel,
        spacing: { before: t.depth <= 2 ? 360 : 240, after: 120 },
        children: [
          new TextRun({
            text: t.text,
            font: 'Calibri Light',
            size: t.depth === 1 ? 36 : t.depth === 2 ? 28 : 24,
            bold: t.depth <= 2,
          }),
        ],
      })

      if (t.depth === 2 && chartScreenshots) {
        const chartId = CHART_MAP[t.text.trim().toLowerCase()]
        if (chartId !== undefined) {
          const dataUrl = chartScreenshots.get(chartId)
          if (dataUrl) {
            const figureNum = ++figureCounter
            const headingWithKeepNext = new Paragraph({
              heading: headingLevel,
              spacing: { before: 360, after: 120 },
              keepNext: true,
              children: [
                new TextRun({
                  text: t.text,
                  font: 'Calibri Light',
                  size: 28,
                  bold: true,
                }),
              ],
            })
            const caption = `Figure ${figureNum} \u2014 ${t.text.trim()}`
            return [
              headingWithKeepNext,
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 60 },
                children: [new ImageRun({
                  type: 'png',
                  data: base64ToArrayBuffer(dataUrl.split(',')[1]),
                  transformation: { width: 600, height: 333 },
                })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                  text: caption,
                  font: 'Calibri',
                  size: 18,
                  italics: true,
                  color: '666666',
                })],
              }),
            ]
          }
          // chart expected but not available → note
          return [
            headingPara,
            new Paragraph({
              spacing: { before: 60, after: 200 },
              children: [new TextRun({
                text: 'Chart unavailable in this export \u2014 see the dashboard for the visual.',
                font: 'Calibri',
                size: 18,
                italics: true,
                color: '999999',
              })],
            }),
          ]
        }
      }
      return headingPara
    }

    if (type === 'paragraph') {
      const t = token as unknown as { tokens?: Array<{ type: string; text?: string; href?: string }> }
      const runs: TextRun[] = []
      if (t.tokens) {
        for (const inline of t.tokens) {
          if (inline.type === 'strong') {
            runs.push(new TextRun({ text: inline.text, font: 'Calibri', size: 22, bold: true }))
          } else if (inline.type === 'em') {
            runs.push(new TextRun({ text: inline.text, font: 'Calibri', size: 22, italics: true }))
          } else if (inline.type === 'link') {
            runs.push(new TextRun({ text: inline.text, font: 'Calibri', size: 22, color: '2155A6', underline: {} }))
          } else if (inline.type === 'codespan') {
            runs.push(new TextRun({ text: inline.text, font: 'Consolas', size: 22 }))
          } else if (inline.type === 'br') {
            runs.push(new TextRun({ break: 1 }))
          } else if (inline.text !== undefined) {
            runs.push(new TextRun({ text: inline.text, font: 'Calibri', size: 22 }))
          }
        }
      }
      return new Paragraph({
        spacing: { after: 80 },
        children: runs.length > 0 ? runs : [new TextRun({ text: '', font: 'Calibri', size: 22 })],
      })
    }

    if (type === 'table') {
      const t = token as unknown as {
        header: Array<{ tokens?: Array<{ text?: string; raw?: string }>; text?: string }>
        rows: Array<Array<{ tokens?: Array<{ text?: string; raw?: string }>; text?: string }>>
      }
      const allRows = [t.header, ...t.rows]
      if (allRows.length === 0) return new Table({ rows: [] })

      const cellTexts: string[][] = allRows.map((row) =>
        row.map((cell) => {
          let text = ''
          if (Array.isArray(cell.tokens)) {
            for (const sub of cell.tokens) {
              if (typeof sub.text === 'string') text += sub.text
              else if (typeof sub.raw === 'string') text += sub.raw
            }
          } else if (typeof cell.text === 'string') {
            text = cell.text
          }
          return text.trim()
        }),
      )

      const colCount = cellTexts[0]?.length ?? 0
      const isNumericCol: boolean[] = []
      for (let c = 0; c < colCount; c++) {
        const dataCells = cellTexts.slice(1).map((row) => row[c] ?? '')
        isNumericCol.push(
          dataCells.length > 0 &&
            dataCells.every((val) => val === REDACTED_AMOUNT || /^[\d,.\-%()\s]+$/.test(val)),
        )
      }

      const cellBorder = {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      }
      const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 }

      const tableRows = cellTexts.map((row, rowIdx) => {
        const isHeader = rowIdx === 0
        return new TableRow({
          tableHeader: isHeader,
          children: row.map((cellText, colIdx) =>
            new TableCell({
              shading: isHeader ? { fill: 'D9D9D9' } : undefined,
              borders: cellBorder,
              margins: cellMargins,
              width: { size: 100 / colCount, type: WidthType.PERCENTAGE },
              verticalAlign: 'center',
              children: [
                new Paragraph({
                  alignment: isHeader
                    ? AlignmentType.LEFT
                    : isNumericCol[colIdx]
                      ? AlignmentType.RIGHT
                      : AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: cellText,
                      font: 'Calibri',
                      size: 20,
                      bold: isHeader,
                    }),
                  ],
                }),
              ],
            }),
          ),
        })
      })

      return new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: Array.from({ length: colCount }, () => 100 / colCount),
      })
    }

    if (type === 'list') {
      const t = token as unknown as {
        ordered: boolean
        items: Array<{ tokens?: Array<{ text?: string; raw?: string }>; text?: string }>
      }
      return t.items.map((item, idx) => {
        let text = ''
        if (Array.isArray(item.tokens)) {
          for (const sub of item.tokens) {
            if (typeof sub.text === 'string') text += sub.text
            else if (typeof sub.raw === 'string') text += sub.raw
          }
        } else if (typeof item.text === 'string') {
          text = item.text
        }
        const prefix = t.ordered ? `${idx + 1}. ` : '\u2022 '
        return new Paragraph({
          spacing: { after: 40 },
          indent: { left: 720 },
          children: [new TextRun({ text: prefix + text, font: 'Calibri', size: 22 })],
        })
      })
    }

    if (type === 'hr') {
      return new Paragraph({
        spacing: { before: 120, after: 120 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: 'CCCCCC',
            space: 1,
          },
        },
        children: [],
      })
    }

    if (type === 'space') {
      return new Paragraph({ spacing: { after: 120 } })
    }

    if ('raw' in token && typeof token.raw === 'string') {
      return new Paragraph({
        children: [new TextRun({ text: token.raw as string, font: 'Calibri', size: 22 })],
      })
    }

    return null
  }

  for (const token of tokens) {
    const el = renderToken(token)
    if (el) {
      if (Array.isArray(el)) {
        children.push(...el)
      } else {
        children.push(el)
      }
    }
  }

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({ children: [] }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${REPORT_TITLE} \u00b7 ${dateStr} \u00b7 Page `,
                  font: 'Calibri',
                  size: 18,
                  color: '999999',
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: 'Calibri',
                  size: 18,
                  color: '999999',
                }),
                new TextRun({
                  text: ' of ',
                  font: 'Calibri',
                  size: 18,
                  color: '999999',
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: 'Calibri',
                  size: 18,
                  color: '999999',
                }),
              ],
            }),
          ],
        }),
      },
      children: children,
    }],
  })

  return Packer.toBlob(doc)
}