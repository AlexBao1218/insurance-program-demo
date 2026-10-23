/**
 * Local replacement for `@lark-apaas/client-toolkit`.
 *
 * The original app ran inside Feishu Spark (妙搭), whose runtime injected
 * logging, user identity, storage buckets and Bitable "capabilities".
 * This shim provides the same surface with plain-browser behaviour so the
 * app can run as a standalone portfolio demo. Aliased in vite.config.ts.
 */
import React, { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

// ---- logger ----
const tag = '[demo]'
export const logger = {
  info: (...a: unknown[]) => console.info(tag, ...a),
  warn: (...a: unknown[]) => console.warn(tag, ...a),
  error: (...a: unknown[]) => console.error(tag, ...a),
  debug: (...a: unknown[]) => console.debug(tag, ...a),
}

// ---- capabilities (Bitable readers) ----
// Always unavailable outside Feishu; data-source.ts catches this and falls
// back to the bundled mock dataset.
export const capabilityClient = {
  load(id: string) {
    return {
      call<T>(_method: string, _input?: unknown): Promise<T> {
        return Promise.reject(new Error(`Capability "${id}" is not available in the standalone demo`))
      },
    }
  },
}

// ---- current user ----
export interface IUserProfile {
  user_id?: string
  name?: string
  email?: string
  avatar?: string
}
export const DEMO_USER: IUserProfile = {
  user_id: 'demo-user',
  name: 'Alex Bao',
}
export const useCurrentUserProfile = (): Partial<IUserProfile> => DEMO_USER
export const getCurrentUserProfile = async () => DEMO_USER

// ---- scoped storage ----
const PREFIX = 'demo:'
export const scopedStorage = {
  getItem: (k: string) => localStorage.getItem(PREFIX + k),
  setItem: (k: string, v: string) => localStorage.setItem(PREFIX + k, v),
  removeItem: (k: string) => localStorage.removeItem(PREFIX + k),
}

// ---- links ----
export interface UniversalLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
}
export const UniversalLink = forwardRef<HTMLAnchorElement, UniversalLinkProps>(
  function UniversalLink({ to, children, ...rest }, ref) {
    if (/^https?:\/\//.test(to)) {
      return (
        <a ref={ref} href={to} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      )
    }
    if (to.startsWith('#')) {
      return (
        <a ref={ref} href={to} {...rest}>
          {children}
        </a>
      )
    }
    return (
      <Link ref={ref} to={to} {...rest}>
        {children}
      </Link>
    )
  },
)

// ---- app shell ----
export const AppContainer: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    {children}
    <Toaster />
  </>
)

export const ErrorRender: React.FC<{
  error: unknown
  resetErrorBoundary?: (...args: unknown[]) => void
}> = ({ error, resetErrorBoundary }) => (
  <div style={{ padding: 32, fontFamily: 'system-ui' }}>
    <h2>Something went wrong</h2>
    <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.7 }}>
      {error instanceof Error ? error.message : String(error)}
    </pre>
    {resetErrorBoundary && <button onClick={() => {
      if (error instanceof Error && /dynamically imported module|module script|Loading chunk|Importing a module/i.test(error.message)) window.location.reload();
      else resetErrorBoundary();
    }}>Retry</button>}
  </div>
)

// ---- backend axios ----
// The NestJS backend is not part of the standalone demo. Any call is rejected
// so callers surface their own mock/fallback paths.
export const axiosForBackend = {
  post: <T,>(url: string): Promise<{ data: T }> =>
    Promise.reject(new Error(`Backend endpoint ${url} is not available in the standalone demo`)),
  get: <T,>(url: string): Promise<{ data: T }> =>
    Promise.reject(new Error(`Backend endpoint ${url} is not available in the standalone demo`)),
}

export const isMobile = () => /Mobi|Android/i.test(navigator.userAgent)
