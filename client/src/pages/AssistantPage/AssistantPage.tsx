import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  Bot,
  ChevronDown,
  CirclePlus,
  Info,
  MessageCircleQuestion,
  Mic,
  RefreshCw,
  SquarePen,
} from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ASSISTANT_TITLE, NOT_AVAILABLE_LABEL } from '@/lib/brand'
import { DATA_PERIOD } from '@/lib/data-period'
import { NOTICE_TEXT, SUGGESTED_QUESTIONS, WELCOME_MESSAGE, WRITEUP_URL } from '@/data/ai'

/**
 * Visual replica of the Feishu Aily agent panel that the production app
 * embedded in an iframe. No answers are generated: every user message is
 * followed by an explicit "not available in public demo" notice.
 */

/** Pause before the notice card appears, so the exchange reads as a reply */
const NOTICE_DELAY_MS = 500

type ChatEntry =
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'notice' }

let entrySeq = 0
const nextId = () => ++entrySeq

function DisabledIconButton({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-disabled="true"
          className={cn(
            'inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            className,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{NOT_AVAILABLE_LABEL}</TooltipContent>
    </Tooltip>
  )
}

function NoticeCard() {
  return (
    <div className="max-w-[92%] rounded-lg border border-border/60 bg-background px-4 py-3 sm:max-w-[80%]">
      <div className="flex items-center gap-2">
        <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">{NOT_AVAILABLE_LABEL}</p>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{NOTICE_TEXT}</p>
      <a
        href={WRITEUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        How it worked →
      </a>
    </div>
  )
}

export default function AssistantPage() {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const timerRef = useRef<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  // Keep the newest entry in view
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  const reset = useCallback(() => {
    clearTimer()
    setEntries([])
    setInput('')
  }, [clearTimer])

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text) return
      clearTimer()
      setEntries((prev) => [...prev, { id: nextId(), kind: 'user', text }])
      setInput('')
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        setEntries((prev) => [...prev, { id: nextId(), kind: 'notice' }])
      }, NOTICE_DELAY_MS)
    },
    [clearTimer],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  const canSend = input.trim().length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-foreground">{ASSISTANT_TITLE}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{DATA_PERIOD}</p>
      </div>

      <div className="flex h-[calc(100vh-12rem)] min-h-[420px] flex-col rounded-xl border border-border/40 bg-card shadow-xs overflow-hidden">
        {/* Connection strip */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border/30 px-4 py-2">
          <span
            className="size-2 rounded-full bg-muted-foreground/40"
            aria-hidden="true"
          />
          <span
            className="text-[13px] text-muted-foreground"
            title={`${NOT_AVAILABLE_LABEL} · the production panel connected to a Feishu Aily agent`}
          >
            Demo mode · AI disconnected
          </span>
          <button
            type="button"
            onClick={reset}
            aria-label="Refresh conversation"
            className="ml-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>

        {/* Agent header */}
        <div className="flex shrink-0 items-center gap-3 px-4 py-3 sm:px-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bot className="size-5" aria-hidden="true" />
          </div>
          <p className="min-w-0 flex-1 truncate text-[17px] font-medium text-foreground">
            {ASSISTANT_TITLE}
          </p>
          <button
            type="button"
            onClick={reset}
            aria-label="New conversation"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <SquarePen className="size-[18px]" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-1 sm:px-5">
          <div className="space-y-6 sm:pl-[52px]">
            <p className="max-w-2xl text-[15px] leading-relaxed text-foreground">{WELCOME_MESSAGE}</p>

            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <MessageCircleQuestion className="size-3.5" aria-hidden="true" />
                <span>Try asking</span>
              </div>
              <div className="flex flex-col items-start gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="w-fit max-w-full rounded-lg bg-muted px-3.5 py-2 text-left text-[15px] leading-snug text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {entries.map((entry) =>
              entry.kind === 'user' ? (
                <div key={entry.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-muted px-3.5 py-2.5 text-[15px] leading-relaxed text-foreground sm:max-w-[75%]">
                    {entry.text}
                  </p>
                </div>
              ) : (
                <div key={entry.id} className="flex justify-start">
                  <NoticeCard />
                </div>
              ),
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-4">
          <div className="mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-disabled="true"
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span>/ Quick commands</span>
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{NOT_AVAILABLE_LABEL}</TooltipContent>
            </Tooltip>
          </div>

          <form
            className="flex items-end gap-2 rounded-2xl border border-border/40 bg-background px-3 py-2 shadow-sm focus-within:border-border"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <DisabledIconButton label="Voice input" className="mb-0.5 size-8 shrink-0">
              <Mic className="size-[18px]" />
            </DisabledIconButton>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="please enter your question"
              rows={1}
              aria-label="Message"
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!canSend}
              className="mb-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors enabled:hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <CirclePlus className="size-6" />
            </button>
          </form>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI-generated content may contain errors. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
