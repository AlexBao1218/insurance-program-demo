import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, ChevronLeft, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { CURRENT_YEAR } from '@/lib/analytics'
import { NOT_AVAILABLE_LABEL } from '@/lib/brand'
import { Redacted } from '@/components/Redacted'
import { cn } from '@/lib/utils'
import type { IClassWithRelations } from '@/data/programme'

interface ClassTableSectionProps {
  classes: IClassWithRelations[]
  loading: boolean
}

const COLUMN_COUNT = 4

/** Fixed pin order at the top of the list; all other classes follow by Item_No asc */
const PINNED_ORDER = ['PARMBBI', 'PPL', 'EC', 'Motor']

/** Classes per page. Public demo: only the first page is included */
const PAGE_SIZE = 12

const PAGE_NOTICE_TEXT =
  'Only the first page of insurance classes is included in this demo for privacy reasons.'
const SEARCH_SCOPE_HINT = 'Search covers the first page only'

/** Centred notice standing in for the rows of pages 2+ */
function PageNotice() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <Info className="size-8 text-muted-foreground/60 mb-3" />
      <p className="text-sm font-semibold text-foreground">{NOT_AVAILABLE_LABEL}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{PAGE_NOTICE_TEXT}</p>
    </div>
  )
}

/**
 * Class list. Public demo: Premium, Insurer and Broker are withheld for every class
 * (the Redacted bar in every row, never a dash); only the first page of classes is
 * rendered, later pages show a notice; the search box covers the first page only.
 */
export default function ClassTableSection({
  classes,
  loading,
}: ClassTableSectionProps) {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  // Pinned classes first (fixed order), everything else by Item_No ascending
  const sorted = useMemo(() => {
    const pinIndex = (cls: IClassWithRelations) => PINNED_ORDER.indexOf(cls.classCode)
    return [...classes].sort((a, b) => {
      const pa = pinIndex(a)
      const pb = pinIndex(b)
      if (pa !== -1 || pb !== -1) {
        if (pa !== -1 && pb !== -1) return pa - pb
        return pa !== -1 ? -1 : 1
      }
      return a.itemNo - b.itemNo
    })
  }, [classes])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const isFirstPage = page === 1


  // Only the first page's classes are ever rendered or searched
  const rows = useMemo(() => {
    if (!isFirstPage) return []
    const firstPage = sorted.slice(0, PAGE_SIZE)
    const kw = keyword.trim().toLowerCase()
    if (!kw) return firstPage
    return firstPage.filter(
      (cls) =>
        cls.classCode.toLowerCase().includes(kw) ||
        cls.fullName.toLowerCase().includes(kw)
    )
  }, [sorted, keyword, isFirstPage])

  const goToPage = (next: number) => {
    setPage(Math.min(pageCount, Math.max(1, next)))
  }

  const pagination = !loading && pageCount > 1 && (
    <div className="mt-auto flex flex-col items-center gap-2 pt-1 sm:flex-row sm:justify-between">
      <span className="text-xs text-muted-foreground">
        Page {page} of {pageCount} · {sorted.length} classes
      </span>
      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              aria-label="Go to previous page"
              className="gap-1 max-md:h-11"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
          </PaginationItem>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <PaginationItem key={n}>
              <Button
                variant={n === page ? 'outline' : 'ghost'}
                size="icon"
                onClick={() => goToPage(n)}
                aria-current={n === page ? 'page' : undefined}
                aria-label={`Go to page ${n}`}
                className="max-md:size-11"
              >
                {n}
              </Button>
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page === pageCount}
              aria-label="Go to next page"
              className="gap-1 max-md:h-11"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )


  return (
    <Card className="flex h-[calc(100vh-12rem)] min-h-[420px] flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 px-5 pb-4 pt-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="relative w-full sm:max-w-xs"
            title={isFirstPage ? undefined : SEARCH_SCOPE_HINT}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={!isFirstPage}
              placeholder="Search class code or name..."
              aria-label="Search classes on the first page"
              className="bg-background pl-9 max-md:h-11"
            />
          </div>
        </div>

        {keyword && isFirstPage && (
          <Badge variant="secondary" className="w-fit gap-1">
            Results: {rows.length} classes
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="-m-2 ml-1 p-2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              ×
            </button>
          </Badge>
        )}

        {/* Mobile: list */}
        <div className="md:hidden flex min-h-0 w-full flex-1 flex-col overflow-auto rounded-md border border-border">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <Skeleton className="h-5 w-3/4" />
                </div>
              ))}
            </div>
          ) : !isFirstPage ? (
            <PageNotice />
          ) : rows.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No classes found
            </div>
          ) : (
            <ul className="flex flex-1 flex-col divide-y divide-border">
              {rows.map((cls) => (
                <li key={cls.id} className="flex flex-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/data/class/${cls.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-sm font-medium"
                      title={cls.fullName}
                    >
                      {cls.fullName}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Desktop: table — fixed layout so column widths never change between pages;
            the three withheld columns share one width and alignment */}
        <div className="hidden md:flex min-h-0 w-full flex-1 flex-col overflow-auto rounded-md border border-border [&_[data-slot=table-container]]:flex [&_[data-slot=table-container]]:min-h-0 [&_[data-slot=table-container]]:flex-col [&_[data-slot=table-container]]:flex-1">
          <Table className={cn("w-full table-fixed", isFirstPage && !keyword && rows.length > 0 && "h-full")}>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  Class of Insurance
                </TableHead>
                <TableHead className="whitespace-nowrap md:w-[7.5rem]">
                  Premium {CURRENT_YEAR}
                </TableHead>
                <TableHead className="whitespace-nowrap md:w-[7.5rem]">Insurer</TableHead>
                <TableHead className="whitespace-nowrap md:w-[7.5rem]">Broker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: COLUMN_COUNT }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !isFirstPage ? null : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMN_COUNT}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No classes found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((cls) => (
                  <TableRow
                    key={cls.id}
                    className="group cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/data/class/${cls.id}`)}
                  >
                    <TableCell className="py-1.5">
                      <span
                        className="block truncate text-sm font-medium"
                        title={cls.fullName}
                      >
                        {cls.fullName}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5 text-sm whitespace-nowrap">
                      <Redacted short />
                    </TableCell>
                    <TableCell className="py-1.5 text-sm whitespace-nowrap">
                      <Redacted short />
                    </TableCell>
                    <TableCell className="py-1.5 text-sm whitespace-nowrap">
                      <Redacted short />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && !isFirstPage && <PageNotice />}
        </div>

        {pagination}
      </CardContent>
    </Card>
  )
}
