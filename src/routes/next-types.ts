// Next js types
// May break so we need to be sure of breaking changes.
export declare enum PrefetchKind {
  AUTO = "auto",
  FULL = "full",
  TEMPORARY = "temporary",
}

export interface NavigateOptions {
  scroll?: boolean;
}
export interface PrefetchOptions {
  kind: PrefetchKind;
}

export interface AppRouterInstance {
  /**
   * Navigate to the previous history entry.
   */
  back(): void;
  /**
   * Navigate to the next history entry.
   */
  forward(): void;
  /**
   * Refresh the current page.
   */
  refresh(): void;
  /**
   * Navigate to the provided href.
   * Pushes a new history entry.
   */
  push(href: string, options?: NavigateOptions): void;
  /**
   * Navigate to the provided href.
   * Replaces the current history entry.
   */
  replace(href: string, options?: NavigateOptions): void;
  /**
   * Prefetch the provided href.
   */
  prefetch(href: string, options?: PrefetchOptions): void;
}

interface Params {
  [key: string]: string | string[];
}
/**
 * Get the current parameters. For example useParams() on /dashboard/[team]
 * where pathname is /dashboard/nextjs would return { team: 'nextjs' }
 */
export type UseParams<T extends Params = Params> = () => T;

interface ReadonlyURLSearchParams {}
/**
 * Get a read-only URLSearchParams object. For example searchParams.get('foo') would return 'bar' when ?foo=bar
 * Learn more about URLSearchParams here: https://developer.mozilla.org/docs/Web/API/URLSearchParams
 */
export type UseSearchParams = () => ReadonlyURLSearchParams;
