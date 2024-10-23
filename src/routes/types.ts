import {
  NavigateOptions,
  PrefetchOptions,
  AppRouterInstance,
  UseParams,
  UseSearchParams,
} from "./next-types";
import queryString from "query-string";
import { ComponentProps } from "react";
import type { ZodError, ZodSchema, input, output } from "zod";
import { type IQueryParams } from "build-url-ts";
import Link from "./link-type";

export type RouteBuilderOptions<TBaseUrls extends {}> = {
  /**
   * @name additionalBaseUrls
   * @type {Object}
   * @description additionalBaseUrls is an object which contains the base urls which can be used in the routes. It is used to append the base url to the route. It is an optional field.
   */
  additionalBaseUrls: TBaseUrls;
  /**
   * @name defaultBaseUrl
   * @type {string}
   * @description defaultBaseUrl is the base url which will be appended to the route if the route does not have any base url. It will take any route that you have defined during the instantiation of routeBuilder. It is an optional field.
   */
  defaultBaseUrl?: string;
  /**
   * @name navigation
   * @type {Object}
   * @description We need to pass facades for navigation. These are all the bridging functions that we need to pass to the route builder.
   */
  navigation: {
    useParams: UseParams;
    useSearchParams: UseSearchParams;
    Link: Link;
    routerInstance: () => AppRouterInstance;
  };
};

export type BaseUrls<T extends {}> = keyof T | (string & {});

export type RouteLink<
  TParams extends ZodSchema,
  TSearchParams extends ZodSchema,
  TBaseUrls extends {} = {},
> = (
  props: Omit<ComponentProps<Link>, "href"> & {
    params: input<TParams>;
    searchParams?: input<TSearchParams>;
    searchParamsOptions?: queryString.StringifyOptions;
    baseUrl?: BaseUrls<TBaseUrls>;
    hash?: string;
  },
) => JSX.Element;

export type NavigateLink<TBaseUrls extends {} = {}> = (
  props: Omit<ComponentProps<Link>, "href"> & {
    searchParams: IQueryParams;
    baseUrl: BaseUrls<TBaseUrls>;
    path: string;
    searchParamsOptions?: queryString.StringifyOptions;
    hash?: string;
  },
) => JSX.Element;

export type SafeParamsResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ZodError | Error;
    };

export type TempehRouterInstance<
  TParams extends ZodSchema,
  TSearchParams extends ZodSchema,
  TBaseUrls extends {},
> = {
  /**
   * @name push
   * @description useful for navigating to a new route. It will push the new route to the history stack.
   */
  push: (routeConfig: {
    params: input<TParams>;
    searchParams?: input<TSearchParams>;
    searchParamsOptions?: queryString.StringifyOptions;
    navigationOptions?: NavigateOptions;
    baseUrl?: BaseUrls<TBaseUrls>;
    hash?: string;
  }) => void;

  /**
   * @name replace
   * @description useful for replacing the current route with a new route. It will replace the current route in the history stack.
   */
  replace: (routeConfig: {
    params: input<TParams>;
    searchParams?: input<TSearchParams>;
    searchParamsOptions?: queryString.StringifyOptions;
    navigationOptions?: NavigateOptions;
    baseUrl?: BaseUrls<TBaseUrls>;
    hash?: string;
  }) => void;

  /**
   * @name prefetch
   * @description useful for prefetching the route. It will prefetch the route and store it in the cache.
   */
  prefetch: (routeConfig: {
    params: input<TParams>;
    searchParams?: input<TSearchParams>;
    searchParamsOptions?: queryString.StringifyOptions;
    navigationOptions?: PrefetchOptions;
    baseUrl?: BaseUrls<TBaseUrls>;
    hash?: string;
  }) => void;
};

export type TempehGlobalRouterInstance<TBaseUrls extends {}> = {
  /**
   * @name push
   * @description useful for navigating to a new route. It will push the new route to the history stack.
   */
  push: (routeConfig: {
    path: string;
    searchParams?: IQueryParams;
    searchParamsOptions?: queryString.StringifyOptions;
    navigationOptions?: NavigateOptions;
    baseUrl?: BaseUrls<TBaseUrls>;
    hash?: string;
  }) => void;
  /**
   * @name replace
   * @description useful for replacing the current route with a new route. It will replace the current route in the history stack.
   */
  replace: (routeConfig: {
    path: string;
    searchParams?: IQueryParams;
    searchParamsOptions?: queryString.StringifyOptions;
    navigationOptions?: NavigateOptions;
    baseUrl?: BaseUrls<TBaseUrls>;
    hash?: string;
  }) => void;
  /**
   * @name prefetch
   * @description useful for prefetching the route. It will prefetch the route and store it in the cache.
   */
  prefetch: (routeConfig: {
    path: string;
    searchParams?: IQueryParams;
    searchParamsOptions?: queryString.StringifyOptions;
    navigationOptions?: PrefetchOptions;
    baseUrl?: BaseUrls<TBaseUrls>;
    hash?: string;
  }) => void;
};

/**
 * @name RouteConfig
 * @description RouteConfig is a function which takes an object with name, fn, paramsSchema, searchParamsSchema and options. It returns a function which takes params and options and returns the route with the search params. It also has useParams and useSearchParams functions which returns the params and search params of the route.
 */
export type RouteConfig<
  TParams extends ZodSchema,
  TSearchParams extends ZodSchema,
  TBaseUrls extends {} = {},
> = {
  /**
   * @name navigate
   * @description Think of navigate as a function which takes params and options and returns the route with the search params. First argument is for params which is a required field.
   * @example navigate({ id: 1 }, { searchParams: { page: 1 } }) -> /user/1?page=1
   */
  navigate: (
    params: input<TParams>,
    options?: {
      searchParams?: input<TSearchParams>;
      searchParamsOptions?: queryString.StringifyOptions;
      baseUrl?: BaseUrls<TBaseUrls>;
      hash?: string;
    },
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
    ? SafeParamsResult<output<TParams>>
    : output<TParams>;

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
    ? SafeParamsResult<output<TSearchParams>>
    : output<TSearchParams>;

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
   */
  useRouter: () => TempehRouterInstance<TParams, TSearchParams, TBaseUrls>;

  /**
   * @name parseSearchParams
   * @description used to parse search params returned by the page component or the generateStaticParams. It is route specific.
   * @example parseSearchParams({ page: 1 }) -> { page: 1 }
   * @example parseSearchParams({ page: 1 }, true) -> {success: true, data: { page: 1 } | { success: false, error: ZodError | Error }
   */
  parseSearchParams: <
    TValue extends any = unknown,
    TSafe extends boolean = false,
  >(
    value: TValue,
    safe?: TSafe,
  ) => TSafe extends false
    ? output<TSearchParams>
    : SafeParamsResult<output<TSearchParams>>;

  /**
   * @name parseParams
   * @description used to parse params returned by the page component or the generateStaticParams. It is route specific.
   * @example parseParams({ page: 1 }) -> { page: 1 }
   * @example parseParams({ page: 1 }, true) -> {success: true, data: { page: 1 } | { success: false, error: ZodError | Error }
   */
  parseParams: <TValue extends any = unknown, TSafe extends boolean = false>(
    value: TValue,
    safe?: TSafe,
  ) => TSafe extends false
    ? output<TParams>
    : SafeParamsResult<output<TParams>>;
};

export type CreateRouteConfig<
  TParams extends ZodSchema,
  TSearchParams extends ZodSchema,
  TBaseUrls extends {},
> = {
  /**
   * @name name
   * @description name of the route. It should be unique as internally this key is used to store the route, Will throw an error if the route with the same name already exists.
   */
  name: string;
  /**
   * @name fn
   * @param params
   * @returns {string}
   * @description function which takes params and returns the route. Once you give the paramSchema, it will automatically infer the type of the params.
   */
  fn: (params: input<TParams>) => string;
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
