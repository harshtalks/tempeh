import {
  NavigateOptions,
  PrefetchOptions,
  AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import Link from "next/link";
import queryString from "query-string";
import { ComponentProps } from "react";
import { StandardSchemaV1 } from "../standard-schema";

export type QueryParams = Record<
  string,
  null | undefined | string | number | string[] | (string | number)[]
>;

export type RouteBuilderOptions<TBaseUrls extends {}> = {
  /**
   * @name additionalBaseUrls
   * @type {Object}
   * @description additionalBaseUrls is an object which contains the base urls which can be used in the routes. It is used to append the base url to the route. It is an optional field.
   */
  additionalBaseUrls?: TBaseUrls;
  /**
   * @name defaultBaseUrl
   * @type {string}
   * @description defaultBaseUrl is the base url which will be appended to the route if the route does not have any base url. It will take any route that you have defined during the instantiation of routeBuilder. It is an optional field.
   */
  defaultBaseUrl?: string;
};

export type BaseUrls<T extends {}> = keyof T | (string & {});

export type RouteLink<
  TParams extends StandardSchemaV1,
  TSearchParams extends StandardSchemaV1,
  TBaseUrls extends {} = {}
> = (
  props: Omit<ComponentProps<typeof Link>, "href"> & {
    /**
     * @name params
     * @type {object}
     * @description params is an object which contains the parameters that are required to build the route. It is a required field.
     */
    params: StandardSchemaV1.InferInput<TParams>;
    /**
     * @name searchParams
     * @type {object}
     * @description searchParams is an object which contains the search parameters that are required to build the route. It is an optional field.
     */
    searchParams?: StandardSchemaV1.InferInput<TSearchParams>;
    /**
     * @name searchParamsOptions
     * @type {queryString.StringifyOptions}
     * @description Options for stringifying search parameters. Controls how the query string is formatted.
     */
    searchParamsOptions?: queryString.StringifyOptions;
    /**
     * @name baseUrl
     * @type {BaseUrls<TBaseUrls>}
     * @description The base URL to be used for the route. Can be a key from the provided base URLs or a string.
     */
    baseUrl?: BaseUrls<TBaseUrls>;
    /**
     * @name hash
     * @type {string}
     * @description URL fragment identifier (the part after #) to append to the URL.
     */
    hash?: string;
  }
) => JSX.Element;

export type NavigateLink<TBaseUrls extends {} = {}> = (
  props: Omit<ComponentProps<typeof Link>, "href"> & {
    /**
     * @name searchParams
     * @type {QueryParams}
     * @description The search parameters to include in the URL query string.
     */
    searchParams?: QueryParams;
    /**
     * @name baseUrl
     * @type {BaseUrls<TBaseUrls>}
     * @description The base URL to be used for the route. Can be a key from the provided base URLs or a string.
     */
    baseUrl: BaseUrls<TBaseUrls>;
    /**
     * @name path
     * @type {string}
     * @description The URL path to navigate to.
     */
    path: string;
    /**
     * @name searchParamsOptions
     * @type {queryString.StringifyOptions}
     * @description Options for stringifying search parameters. Controls how the query string is formatted.
     */
    searchParamsOptions?: queryString.StringifyOptions;
    /**
     * @name hash
     * @type {string}
     * @description URL fragment identifier (the part after #) to append to the URL.
     */
    hash?: string;
  }
) => JSX.Element;

export type SafeParamsResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: StandardSchemaV1.FailureResult;
    };

export type TypedRouterPushConfig<
  TParams extends StandardSchemaV1,
  TSearchParams extends StandardSchemaV1,
  TBaseUrls extends {}
> = {
  /**
   * @name params
   * @type {object}
   * @description The parameters required to build the route.
   */
  params: StandardSchemaV1.InferInput<TParams>;
  /**
   * @name searchParams
   * @type {object}
   * @description Optional search parameters to include in the URL query string.
   */
  searchParams?: StandardSchemaV1.InferInput<TSearchParams>;
  /**
   * @name searchParamsOptions
   * @type {queryString.StringifyOptions}
   * @description Options for stringifying search parameters. Controls how the query string is formatted.
   */
  searchParamsOptions?: queryString.StringifyOptions;
  /**
   * @name navigationOptions
   * @type {NavigateOptions}
   * @description Options to configure the navigation behavior.
   */
  navigationOptions?: NavigateOptions;
  /**
   * @name baseUrl
   * @type {BaseUrls<TBaseUrls>}
   * @description The base URL to be used for the route. Can be a key from the provided base URLs or a string.
   */
  baseUrl?: BaseUrls<TBaseUrls>;
  /**
   * @name hash
   * @type {string}
   * @description URL fragment identifier (the part after #) to append to the URL.
   */
  hash?: string;
};

export type TypedRouterPrefetchConfig<
  TParams extends StandardSchemaV1,
  TSearchParams extends StandardSchemaV1,
  TBaseUrls extends {}
> = Omit<
  TypedRouterPushConfig<TParams, TSearchParams, TBaseUrls>,
  "navigationOptions"
> & {
  /**
   * @name prefetchOptions
   * @type {PrefetchOptions}
   * @description Options to configure the prefetch behavior.
   */
  prefetchOptions?: PrefetchOptions;
};

export type TempehRouterInstance<
  TParams extends StandardSchemaV1,
  TSearchParams extends StandardSchemaV1,
  TBaseUrls extends {}
> = {
  /**
   * @name push
   * @description useful for navigating to a new route. It will push the new route to the history stack.
   */
  push: (
    routeConfig: TypedRouterPushConfig<TParams, TSearchParams, TBaseUrls>
  ) => void;

  /**
   * @name replace
   * @description useful for replacing the current route with a new route. It will replace the current route in the history stack.
   */
  replace: (
    routeConfig: TypedRouterPushConfig<TParams, TSearchParams, TBaseUrls>
  ) => void;

  /**
   * @name prefetch
   * @description useful for prefetching the route. It will prefetch the route and store it in the cache.
   */
  prefetch: (
    routeConfig: TypedRouterPrefetchConfig<TParams, TSearchParams, TBaseUrls>
  ) => void;
};

export type GlobalRouterPushConfig<TBaseUrls extends {}> = {
  /**
   * @name path
   * @type {string}
   * @description The URL path to navigate to.
   */
  path: string;
  /**
   * @name searchParams
   * @type {QueryParams}
   * @description The search parameters to include in the URL query string.
   */
  searchParams?: QueryParams;
  /**
   * @name searchParamsOptions
   * @type {queryString.StringifyOptions}
   * @description Options for stringifying search parameters. Controls how the query string is formatted.
   */
  searchParamsOptions?: queryString.StringifyOptions;
  /**
   * @name navigationOptions
   * @type {NavigateOptions}
   * @description Options to configure the navigation behavior.
   */
  navigationOptions?: NavigateOptions;
  /**
   * @name baseUrl
   * @type {BaseUrls<TBaseUrls>}
   * @description The base URL to be used for the route. Can be a key from the provided base URLs or a string.
   */
  baseUrl?: BaseUrls<TBaseUrls>;
  /**
   * @name hash
   * @type {string}
   * @description URL fragment identifier (the part after #) to append to the URL.
   */
  hash?: string;
};

export type GlobalRouterPrefetchConfig<TBaseUrls extends {}> = Omit<
  GlobalRouterPushConfig<TBaseUrls>,
  "navigationOptions"
> & {
  /**
   * @name prefetchOptions
   * @type {PrefetchOptions}
   * @description Options to configure the prefetch behavior.
   */
  prefetchOptions?: PrefetchOptions;
};

export type TempehGlobalRouterInstance<TBaseUrls extends {}> = (
  useRouter: () => AppRouterInstance
) => {
  /**
   * @name push
   * @description useful for navigating to a new route. It will push the new route to the history stack.
   */
  push: (routeConfig: GlobalRouterPushConfig<TBaseUrls>) => void;
  /**
   * @name replace
   * @description useful for replacing the current route with a new route. It will replace the current route in the history stack.
   */
  replace: (routeConfig: GlobalRouterPushConfig<TBaseUrls>) => void;
  /**
   * @name prefetch
   * @description useful for prefetching the route. It will prefetch the route and store it in the cache.
   */
  prefetch: (routeConfig: GlobalRouterPrefetchConfig<TBaseUrls>) => void;
};

/**
 * @name RouteConfig
 * @description RouteConfig is a function which takes an object with name, fn, paramsSchema, searchParamsSchema and options. It returns a function which takes params and options and returns the route with the search params. It also has useParams and useSearchParams functions which returns the params and search params of the route.
 */
export type RouteConfig<
  TParams extends StandardSchemaV1,
  TSearchParams extends StandardSchemaV1,
  TBaseUrls extends {} = {}
> = {
  /**
   * @name navigate
   * @description Think of navigate as a function which takes params and options and returns the route with the search params. First argument is for params which is a required field.
   * @example navigate({ id: 1 }, { searchParams: { page: 1 } }) -> /user/1?page=1
   */
  navigate: (
    params: StandardSchemaV1.InferInput<TParams>,
    options?: {
      searchParams?: StandardSchemaV1.InferInput<TSearchParams>;
      searchParamsOptions?: queryString.StringifyOptions;
      baseUrl?: BaseUrls<TBaseUrls>;
      hash?: string;
    }
  ) => string;

  /**
   * @name useParams
   * @description It is a route specific drop in replacement of useParams provided by Next.js. It returns the params of the route.
   * @example RouteInfo.useParams() -> { id: 1 }
   * @example RouteInfo.useParams({
   safe:true) -> { success: true, data: { id: 1 } | { success: false, error: ZodError | Error }
   */
  useParams: <TSafe extends boolean = false>(options?: {
    safe?: TSafe;
  }) => TSafe extends true
    ? SafeParamsResult<StandardSchemaV1.InferOutput<TParams>>
    : StandardSchemaV1.InferOutput<TParams>;

  /**
   * @name useParams
   * @description It is a route specific drop in replacement of useSearchParams provided by Next.js. It returns the searchParams of the route.
   * @example RouteInfo.useParams() -> { id: 1 }
   * @example RouteInfo.useSearchParams({
   safe:true) -> { success: true, data: { id: 1 } | { success: false, error: ZodError | Error }
   */
  useSearchParams: <TSafe extends boolean = false>(options?: {
    safe?: TSafe;
  }) => TSafe extends true
    ? SafeParamsResult<StandardSchemaV1.InferOutput<TParams>>
    : StandardSchemaV1.InferOutput<TParams>;

  /**
   * @name Link
   * @description Drop in replacement for Next.js Link component. It takes params and searchParams as props and returns a Link component. It is also route specific.
   * @example <RouteInfo.Link params={{ id: 1 }} searchParams={{ page: 1 }} />
   */
  Link: RouteLink<TParams, TSearchParams, TBaseUrls>;

  /**
   * @name useRouter
   * @description Drop in replacement for Next.js useRouter hook. It is route specific, which means that each route has its own useRouter instance.
   * @example RouteInfo.useRouter() -> {push,replace,prefetch}
   * @param useRouter - Next.js useRouter hook
   */
  useRouter: (
    useRouter: () => AppRouterInstance
  ) => TempehRouterInstance<TParams, TSearchParams, TBaseUrls>;

  /**
   * @name parseSearchParams
   * @description used to parse search params returned by the page component or the generateStaticParams. It is route specific.
   * @example parseSearchParams({ page: 1 }) -> { page: 1 }
   * @example parseSearchParams({ page: 1 }, true) -> {success: true, data: { page: 1 } | { success: false, error: ZodError | Error }
   */
  parseSearchParams: <
    TValue extends any = unknown,
    TSafe extends boolean = false
  >(
    value: TValue,
    safe?: TSafe
  ) => TSafe extends false
    ? StandardSchemaV1.InferOutput<TSearchParams>
    : SafeParamsResult<StandardSchemaV1.InferOutput<TSearchParams>>;

  /**
   * @name parseParams
   * @description used to parse params returned by the page component or the generateStaticParams. It is route specific.
   * @example parseParams({ page: 1 }) -> { page: 1 }
   * @example parseParams({ page: 1 }, true) -> {success: true, data: { page: 1 } | { success: false, error: ZodError | Error }
   */
  parseParams: <TValue extends any = unknown, TSafe extends boolean = false>(
    value: TValue,
    safe?: TSafe
  ) => TSafe extends false
    ? StandardSchemaV1.InferOutput<TParams>
    : SafeParamsResult<StandardSchemaV1.InferOutput<TParams>>;
};

export type CreateRouteConfig<
  TParams extends StandardSchemaV1,
  TSearchParams extends StandardSchemaV1,
  TBaseUrls extends {}
> = {
  /**
   * @name name
   * @description name of the route. If you provide unique name for each of your routes, it will be reflected in the generated route specific errors.
   */
  name: string;
  /**
   * @name fn
   * @param params
   * @returns {string}
   * @description function which takes params and returns the route. Once you give the paramSchema, it will automatically infer the type of the params.
   */
  fn: (params: StandardSchemaV1.InferInput<TParams>) => string;
  /**
   * @name paramsSchema
   * @type {ZodSchema}
   *
   * @description paramsSchema is the schema of the params which the route takes. It is used to infer the type of the params. It is also used to validate the params. If the params are not valid, it will throw an error.
   */
  paramsSchema: TParams;
  /**
   * @name searchParamsSchema
   * @type {ZodSchema}
   *
   * @description searchParamsSchema is the schema of the search params which the route takes. It is used to infer the type of the search params. It is also used to validate the search params. If the search params are not valid, it will throw an error. It is an optional field
   *
   * @optional
   */
  searchParamsSchema?: TSearchParams;
  /**
   * @name baseUrl
   * @type string
   * @description baseUrl is the base url which will be appended to the route. It will take any route that you have defined during the instantiation of routeBuilder.
   */
  baseUrl?: BaseUrls<TBaseUrls>;
};
