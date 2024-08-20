import {
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import queryString from "query-string";
import {
  ZodSchema,
  any,
  enum as enum_,
  input,
  output,
  string,
  union,
  ZodError,
  z,
} from "zod";
import { convertURLSearchParamsToObject } from "./utils";
import Link from "next/link";
import { ComponentProps } from "react";
import React from "react";
import {
  fromZodError,
  ValidationError as FormattedValidationError,
} from "zod-validation-error";
import { buildUrl, IQueryParams } from "build-url-ts";
import {
  NavigateOptions,
  PrefetchOptions,
  AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";

const trimSlashes = (str: string) =>
  str
    .split("/")
    .filter((v) => v !== "")
    .join("/");

const removeTrailingSlashes = (str: string) => str.replace(/\/+$/, "");

const urlSchema = union([
  string().url(),
  string().regex(/^\/(?!\/)([\w\-\/.%]+)?/),
]).transform((value) => {
  if (value.startsWith("/") && value.length > 1) {
    value = removeTrailingSlashes(value);
  }
  return value;
});

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
  /**
   * @name formattedValidationErrors
   * @type {boolean}
   * @description formattedValidationErrors is a boolean which is used to show the formatted validation errors. It is an optional field.
   */
  formattedValidationErrors?: boolean;
};

type BaseUrls<T extends {}> = keyof T | (string & {});

type RouteLink<TParams extends ZodSchema, TSearchParams extends ZodSchema> = (
  props: Omit<ComponentProps<typeof Link>, "href"> & {
    params: input<TParams>;
    searchParams?: input<TSearchParams>;
    searchParamsOptions?: queryString.StringifyOptions;
  }
) => JSX.Element;

type SafeParamsResult<T> =
  | {
      success: true;
      data: T;
    }
  | ({
      success: false;
    } & (
      | {
          isSchemaError: true;
          error: ZodError | FormattedValidationError;
        }
      | {
          isSchemaError: false;
          error: Error;
        }
    ));

/**
 * @name RouteConfig
 * @description RouteConfig is a function which takes an object with name, fn, paramsSchema, searchParamsSchema and options. It returns a function which takes params and options and returns the route with the search params. It also has useParams and useSearchParams functions which returns the params and search params of the route.
 */
export type RouteConfig<
  TParams extends ZodSchema,
  TSearchParams extends ZodSchema
> = {
  (
    p: input<TParams>,
    options?: {
      search?: input<TSearchParams>;
      searchParamsOptions?: queryString.StringifyOptions;
    }
  ): string;
  useParams: () => output<TParams>;
  useSearchParams: () => output<TSearchParams>;
  useSafeParams: () => SafeParamsResult<output<TParams>>;
  useSafeSearchParams: () => SafeParamsResult<output<TSearchParams>>;
  params: output<TParams>;
  searchParams: output<TSearchParams>;
  Link: RouteLink<TParams, TSearchParams>;
  useRouter: (useNextRouterInstance: () => AppRouterInstance) => Omit<
    AppRouterInstance,
    "push" | "replace" | "prefetch"
  > & {
    push: (
      routeConfig: {
        params: input<TParams>;
        searchParams?: input<TSearchParams>;
      },
      navigationOptions?: NavigateOptions,
      searchParamsOptions?: queryString.StringifyOptions
    ) => void;
    replace: (
      routeConfig: {
        params: input<TParams>;
        searchParams?: input<TSearchParams>;
      },
      navigationOptions?: NavigateOptions,
      searchParamsOptions?: queryString.StringifyOptions
    ) => void;
    prefetch: (
      routeConfig: {
        params: input<TParams>;
        searchParams?: input<TSearchParams>;
      },
      navigationOptions?: PrefetchOptions,
      searchParamsOptions?: queryString.StringifyOptions
    ) => void;
  };

  parseSearchParams: <
    TValue extends any = unknown,
    TSafe extends boolean = false
  >(
    value: TValue,
    safe?: TSafe
  ) => TSafe extends false
    ? output<TSearchParams>
    :
        | { success: false; error: Error }
        | { success: true; searchParams: output<TSearchParams> };

  parseParams: <TValue extends any = unknown, TSafe extends boolean = false>(
    value: TValue,
    safe?: TSafe
  ) => TSafe extends false
    ? output<TParams>
    :
        | { success: false; error: Error }
        | { success: true; params: output<TParams> };
};

/**
 * @name routeBuilder
 * @description routeBuilder is a function based on singleton pattern which returns a function called createRoute. createRoute is a function which takes an object with name, fn, paramsSchema, searchParamsSchema and options. It returns a function which takes params and options and returns the route with the search params. It also has useParams and useSearchParams functions which returns the params and search params of the route.
 * Make sure you call this function only once in your application as it tracks the routes internally for the search params and params. If you call it multiple times, You will loose the types on many places.
 * @returns {createRoute}
 * @example
 * const createRoute = routeBuilder();
 */

export const routeBuilder = (() => {
  // Private variable to store the single instance
  let instance: ReturnType<typeof buildRouteBuilder> | null = null;

  // Private function to create the instance

  const buildRouteBuilder = <TBaseUrls extends {}>(
    options?: RouteBuilderOptions<TBaseUrls>
  ) => {
    const routes: Record<string, RouteConfig<any, any>> = {};

    const parsedAdditionalBaseUrls =
      options?.additionalBaseUrls &&
      Object.entries(options.additionalBaseUrls).reduce((acc, [key, value]) => {
        const parsedUrls = urlSchema.safeParse(value);

        if (!parsedUrls.success) {
          throw fromZodError(parsedUrls.error, {
            prefix: `Invalid Base URL for ${key}`,
          });
        }

        acc[key] = parsedUrls.data;

        return acc;
      }, {} as Record<string, string>);

    const defaultBaseUrl = options?.defaultBaseUrl || "/";

    const formattedValidationErrors =
      options?.formattedValidationErrors || true;

    const createRoute = <
      TParams extends ZodSchema,
      TSearchParams extends ZodSchema
    >({
      /**
       * @name name
       * @description name of the route. It should be unique as internally this key is used to store the route, Will throw an error if the route with the same name already exists.
       */
      name,

      /**
       * @name fn
       * @param params
       * @returns {string}
       * @description function which takes params and returns the route. Once you give the paramSchema, it will automatically infer the type of the params.
       */
      fn,

      /**
       * @name searchParamsSchema
       * @type {ZodSchema}
       *
       * @description searchParamsSchema is the schema of the search params which the route takes. It is used to infer the type of the search params. It is also used to validate the search params. If the search params are not valid, it will throw an error. It is an optional field
       *
       * @optional
       */
      paramsSchema,

      /**
       * @name searchParamsSchema
       * @type {ZodSchema}
       *
       * @description searchParamsSchema is the schema of the search params which the route takes. It is used to infer the type of the search params. It is also used to validate the search params. If the search params are not valid, it will throw an error. It is an optional field
       *
       * @optional
       */
      searchParamsSchema,

      /**
       * @name baseUrl
       * @type string
       * @description baseUrl is the base url which will be appended to the route. It will take any route that you have defined during the instantiation of routeBuilder.
       */
      baseUrl,
    }: CreateRouteConfig<TParams, TSearchParams, TBaseUrls>) => {
      // check if the route already exists
      if (routes[name]) {
        throw new Error(`Route with name ${name} already exists`);
      }

      const getRoute = (pathname: string) => {
        // parsing the pathname to be a valid url schema. removed trailing slashes here
        const validPathname = urlSchema.safeParse(pathname);

        if (!validPathname.success) {
          throw formattedValidationErrors
            ? fromZodError(validPathname.error, {
                prefix: `Invalid pathname ${pathname} for route ${name}`,
              })
            : validPathname.error;
        }

        // routing logic starts here:
        // we will start with the pathname being our base url here and keep prepending the base url depending on the conditions met
        let route = validPathname.data;

        /**
         * LOGIC FOR ROUTING:
         * 1. Precedence of baseUrl given in createRoute over defaultBaseUrl || additionalBaseUrls
         */

        // when alternative route is given
        if (baseUrl) {
          if (parsedAdditionalBaseUrls && baseUrl in parsedAdditionalBaseUrls) {
            const parsedBase = parsedAdditionalBaseUrls[baseUrl as string];

            if (parsedBase.startsWith("/")) {
              route = removeTrailingSlashes(parsedBase)
                .concat("/")
                .concat(trimSlashes(route));
            } else {
              const pathnameFromBase = removeTrailingSlashes(
                route
                  .concat("/")
                  .concat(trimSlashes(new URL(parsedBase).pathname))
              );
              route = new URL(pathnameFromBase, parsedBase).toString();
            }
          } else {
            const parsedBase = urlSchema.safeParse(baseUrl);

            if (!parsedBase.success) {
              const err = formattedValidationErrors
                ? fromZodError(parsedBase.error, {
                    prefix: `Invalid Base URL ${
                      baseUrl as string
                    } for route ${name}`,
                  })
                : parsedBase.error;

              throw err;
            }

            if (parsedBase.data.startsWith("/")) {
              route = removeTrailingSlashes(parsedBase.data)
                .concat("/")
                .concat(trimSlashes(route));
            } else {
              const pathnameFromBase = removeTrailingSlashes(
                route
                  .concat("/")
                  .concat(trimSlashes(new URL(parsedBase.data).pathname))
              );
              route = new URL(pathnameFromBase, parsedBase.data).toString();
            }
          }
        } else {
          // default route logic
          // default url schema. removed trailing slashes here
          const parsedDefaultRoute = urlSchema.safeParse(defaultBaseUrl);

          if (!parsedDefaultRoute.success) {
            throw formattedValidationErrors
              ? fromZodError(parsedDefaultRoute.error, {
                  prefix: `Invalid Base URL ${
                    baseUrl as string
                  } for route ${name}`,
                })
              : parsedDefaultRoute.error;
          }

          if (parsedDefaultRoute.data.startsWith("/")) {
            route = removeTrailingSlashes(parsedDefaultRoute.data)
              .concat("/")
              .concat(trimSlashes(route));
          } else {
            const pathnameFromBase = removeTrailingSlashes(
              route
                .concat("/")
                .concat(trimSlashes(new URL(parsedDefaultRoute.data).pathname))
            );
            route = new URL(
              pathnameFromBase,
              parsedDefaultRoute.data
            ).toString();
          }
        }

        return route;
      };

      const route: RouteConfig<TParams, TSearchParams> = (params, options) => {
        // check if the params are parsed successfully.

        const parsedParams = paramsSchema.safeParse(params);

        if (!parsedParams.success) {
          throw formattedValidationErrors
            ? fromZodError(parsedParams.error, {
                prefix: `Invalid Params passed to route: `,
              })
            : parsedParams.error;
        }

        if (options?.search && searchParamsSchema) {
          const parsedSearchParams = searchParamsSchema.safeParse(
            options.search
          );

          if (!parsedSearchParams.success) {
            throw formattedValidationErrors
              ? fromZodError(parsedSearchParams.error, {
                  prefix: `Invalid Search Params passed to route: `,
                })
              : parsedParams.error;
          }
        }

        const route = getRoute(fn(params));

        const searchQuery =
          options?.search &&
          queryString.stringify(options.search, options.searchParamsOptions);

        const link = [route, searchQuery ? `?${searchQuery}` : ``].join(``);

        return link;
      };

      routes[name] = route;

      const useGetParams = () => {
        const routeName =
          Object.entries(routes).find(([key, value]) => value === route)?.[0] ||
          ("Invalid Route" as never);

        const result = paramsSchema.safeParse(useNextParams());

        if (!result.success) {
          throw formattedValidationErrors
            ? fromZodError(result.error, {
                prefix: `Invalid params for route ${routeName} `,
              })
            : result.error;
        }

        return result.data;
      };

      route.useParams = (): output<TParams> => {
        return useGetParams();
      };

      route.useSafeParams = (): SafeParamsResult<output<TParams>> => {
        try {
          const output = useGetParams();
          return { data: output, success: true };
        } catch (err) {
          if (
            err instanceof ZodError ||
            err instanceof FormattedValidationError
          ) {
            return { success: false, isSchemaError: true, error: err };
          } else if (err instanceof Error) {
            return { success: false, isSchemaError: false, error: err };
          } else {
            throw err;
          }
        }
      };

      const useGetSearchParams = () => {
        const routeName =
          Object.entries(routes).find(([key, value]) => value === route)?.[0] ||
          ("Invalid Route" as never);

        const searchParamsSchemaUpdated = searchParamsSchema || any();

        const result = searchParamsSchemaUpdated.safeParse(
          convertURLSearchParamsToObject(useNextSearchParams())
        );

        if (!result.success) {
          throw formattedValidationErrors
            ? fromZodError(result.error, {
                prefix: `Invalid search params for route ${routeName}`,
              })
            : result.error;
        }

        return result.data;
      };

      route.useSearchParams = (): output<TSearchParams> => {
        return useGetSearchParams();
      };

      route.useSafeSearchParams = (): SafeParamsResult<
        output<TSearchParams>
      > => {
        try {
          const output = useGetSearchParams();
          return { data: output, success: true };
        } catch (err) {
          if (
            err instanceof ZodError ||
            err instanceof FormattedValidationError
          ) {
            return { success: false, isSchemaError: true, error: err };
          } else if (err instanceof Error) {
            return { success: false, isSchemaError: false, error: err };
          } else {
            throw err;
          }
        }
      };

      route.params = undefined as output<TParams>;
      route.searchParams = undefined as output<TSearchParams>;

      route.Link = ({ children, params, searchParams, ...props }) => {
        const parsedParams = paramsSchema.safeParse(params);

        if (!parsedParams.success) {
          throw formattedValidationErrors
            ? fromZodError(parsedParams.error, {
                prefix: `Invalid Params passed to route: `,
              })
            : parsedParams.error;
        }

        if (searchParams && searchParamsSchema) {
          const parsedSearchParams = searchParamsSchema.safeParse(searchParams);

          if (!parsedSearchParams.success) {
            throw formattedValidationErrors
              ? fromZodError(parsedSearchParams.error, {
                  prefix: `Invalid Search Params passed to route: `,
                })
              : parsedSearchParams.error;
          }
        }

        const route = getRoute(fn(params));

        const searchQuery =
          searchParams &&
          queryString.stringify(searchParams, props.searchParamsOptions);

        const href = [route, searchQuery ? `?${searchQuery}` : ``].join(``);
        return (
          <Link {...props} href={href}>
            {children}
          </Link>
        );
      };

      route.parseParams = <
        TValue extends any = unknown,
        TSafe extends boolean = false
      >(
        value: TValue,
        safe?: TSafe
      ): TSafe extends false
        ? output<TParams>
        :
            | { success: false; error: Error }
            | { success: true; params: output<TParams> } => {
        if (!safe) {
          return paramsSchema.parse(value);
        } else {
          const params = paramsSchema.safeParse(value);
          if (params.success) {
            return {
              success: true as const,
              params: params.data as output<TParams>,
            };
          } else {
            return {
              success: false as const,
              error: formattedValidationErrors
                ? fromZodError(params.error, {
                    prefix: `Invalid Search Params passed to route: `,
                  })
                : params.error,
            };
          }
        }
      };

      route.parseSearchParams = <
        TValue extends any = unknown,
        TSafe extends boolean = false
      >(
        value: TValue,
        safe?: TSafe
      ): TSafe extends false
        ? output<TSearchParams>
        :
            | { success: false; error: Error }
            | { success: true; searchParams: output<TSearchParams> } => {
        if (!safe) {
          return (searchParamsSchema || any()).parse(value);
        } else {
          const searchParams = (searchParamsSchema || any()).safeParse(value);
          if (searchParams.success) {
            return {
              success: true as const,
              searchParams: searchParams.data as output<TSearchParams>,
            };
          } else {
            return {
              success: false as const,
              error: formattedValidationErrors
                ? fromZodError(searchParams.error, {
                    prefix: `Invalid Search Params passed to route: `,
                  })
                : searchParams.error,
            };
          }
        }
      };

      Object.defineProperty(route, "params", {
        get() {
          throw new Error(
            "Routes.[route].params is only for type usage, not runtime. Use it like `typeof Routes.[routes].params`"
          );
        },
      });

      Object.defineProperty(route, "searchParams", {
        get() {
          throw new Error(
            "Routes.[route].searchParams is only for type usage, not runtime. Use it like `typeof Routes.[routes].searchParams`"
          );
        },
      });

      route.useRouter = (useNextRouterInstance: () => AppRouterInstance) => {
        const router = useNextRouterInstance();

        const push = (
          routeConfig: {
            params: input<TParams>;
            searchParams?: input<TSearchParams>;
          },
          navigationOptions?: NavigateOptions,
          searchParamsOptions?: queryString.StringifyOptions
        ): void => {
          // check if params are valid.
          // check if the params are parsed successfully.

          const parsedParams = paramsSchema.safeParse(routeConfig.params);

          if (!parsedParams.success) {
            throw formattedValidationErrors
              ? fromZodError(parsedParams.error, {
                  prefix: `Invalid Params passed to route: `,
                })
              : parsedParams.error;
          }

          if (routeConfig.searchParams && searchParamsSchema) {
            const parsedSearchParams = searchParamsSchema.safeParse(
              routeConfig.searchParams
            );

            if (!parsedSearchParams.success) {
              throw formattedValidationErrors
                ? fromZodError(parsedSearchParams.error, {
                    prefix: `Invalid Search Params passed to route: `,
                  })
                : parsedParams.error;
            }
          }

          // we have successfully passed the check here

          const route = getRoute(fn(routeConfig.params));

          const searchQuery =
            routeConfig.searchParams &&
            queryString.stringify(
              routeConfig.searchParams,
              searchParamsOptions
            );

          const href = [route, searchQuery ? `?${searchQuery}` : ``].join(``);

          return router.push(href, navigationOptions);
        };

        const replace = (
          routeConfig: {
            params: input<TParams>;
            searchParams?: input<TSearchParams>;
          },
          navigationOptions?: NavigateOptions,
          searchParamsOptions?: queryString.StringifyOptions
        ): void => {
          // check if params are valid.
          // check if the params are parsed successfully.

          const parsedParams = paramsSchema.safeParse(routeConfig.params);

          if (!parsedParams.success) {
            throw formattedValidationErrors
              ? fromZodError(parsedParams.error, {
                  prefix: `Invalid Params passed to route: `,
                })
              : parsedParams.error;
          }

          if (routeConfig.searchParams && searchParamsSchema) {
            const parsedSearchParams = searchParamsSchema.safeParse(
              routeConfig.searchParams
            );

            if (!parsedSearchParams.success) {
              throw formattedValidationErrors
                ? fromZodError(parsedSearchParams.error, {
                    prefix: `Invalid Search Params passed to route: `,
                  })
                : parsedParams.error;
            }
          }

          // we have successfully passed the check here

          const route = getRoute(fn(routeConfig.params));

          const searchQuery =
            routeConfig.searchParams &&
            queryString.stringify(
              routeConfig.searchParams,
              searchParamsOptions
            );

          const href = [route, searchQuery ? `?${searchQuery}` : ``].join(``);

          return router.replace(href, navigationOptions);
        };

        const prefetch = (
          routeConfig: {
            params: input<TParams>;
            searchParams?: input<TSearchParams>;
          },
          prefetchOptions?: PrefetchOptions,
          searchParamsOptions?: queryString.StringifyOptions
        ): void => {
          // check if params are valid.
          // check if the params are parsed successfully.

          const parsedParams = paramsSchema.safeParse(routeConfig.params);

          if (!parsedParams.success) {
            throw formattedValidationErrors
              ? fromZodError(parsedParams.error, {
                  prefix: `Invalid Params passed to route: `,
                })
              : parsedParams.error;
          }

          if (routeConfig.searchParams && searchParamsSchema) {
            const parsedSearchParams = searchParamsSchema.safeParse(
              routeConfig.searchParams
            );

            if (!parsedSearchParams.success) {
              throw formattedValidationErrors
                ? fromZodError(parsedSearchParams.error, {
                    prefix: `Invalid Search Params passed to route: `,
                  })
                : parsedParams.error;
            }
          }

          // we have successfully passed the check here

          const route = getRoute(fn(routeConfig.params));

          const searchQuery =
            routeConfig.searchParams &&
            queryString.stringify(
              routeConfig.searchParams,
              searchParamsOptions
            );

          const href = [route, searchQuery ? `?${searchQuery}` : ``].join(``);

          return router.prefetch(href, prefetchOptions);
        };

        return { ...router, push, replace, prefetch };
      };

      return route;
    };

    const Navigate = ({
      base,
      path,
      queryParams,
      disableCSV,
      hash,
      children,
      lowerCase,
      ...props
    }: Omit<ComponentProps<typeof Link>, "href"> & {
      base: keyof TBaseUrls;
      path?: string;
      queryParams?: IQueryParams;
      disableCSV?: boolean;
      hash?: string;
      lowerCase?: boolean;
    }) => {
      if (!parsedAdditionalBaseUrls) {
        throw new Error(
          "No Additional Base URLs provided. You need to provide additional base URLs to use Navigate"
        );
      }

      const baseUrl = parsedAdditionalBaseUrls[base as string];

      if (!baseUrl) throw new Error("Invalid Base URL");

      const url = buildUrl(baseUrl, {
        path,
        queryParams,
        disableCSV,
        hash,
        lowerCase,
      });

      if (!url) throw new Error("Invalid URL for given " + baseUrl);

      return (
        <Link {...props} href={url}>
          {children}
        </Link>
      );
    };

    const useTempehRouter = (
      useNextRouterInstance: () => AppRouterInstance
    ) => {
      const router = useNextRouterInstance();

      const push = <TSearchParams extends {}>(
        urlOptions: {
          path: string;
          searchParams?: TSearchParams;
        },
        navigationOptions?: NavigateOptions,
        searchParamsOptions?: queryString.StringifyOptions
      ) => {
        const stringifiedQParams =
          urlOptions.searchParams &&
          queryString.stringify(urlOptions.searchParams, searchParamsOptions);

        const url = [
          urlOptions.path,
          stringifiedQParams ? `?${stringifiedQParams}` : ``,
        ].join(``);

        return router.push(url, navigationOptions);
      };

      const replace = <TSearchParams extends {}>(
        urlOptions: {
          path: string;
          searchParams?: TSearchParams;
        },
        navigationOptions?: NavigateOptions,
        searchParamsOptions?: queryString.StringifyOptions
      ) => {
        const stringifiedQParams =
          urlOptions.searchParams &&
          queryString.stringify(urlOptions.searchParams, searchParamsOptions);

        const url = [
          urlOptions.path,
          stringifiedQParams ? `?${stringifiedQParams}` : ``,
        ].join(``);

        return router.replace(url, navigationOptions);
      };

      const prefetch = <TSearchParams extends {}>(
        urlOptions: {
          path: string;
          searchParams?: TSearchParams;
        },
        prefetchOptions?: PrefetchOptions,
        searchParamsOptions?: queryString.StringifyOptions
      ) => {
        const stringifiedQParams =
          urlOptions.searchParams &&
          queryString.stringify(urlOptions.searchParams, searchParamsOptions);

        const url = [
          urlOptions.path,
          stringifiedQParams ? `?${stringifiedQParams}` : ``,
        ].join(``);

        return router.prefetch(url, prefetchOptions);
      };
      return { ...router, push, replace, prefetch };
    };

    return { createRoute, Navigate, useTempehRouter };
  };

  return {
    getInstance: <T extends {}>(options?: RouteBuilderOptions<T>) => {
      // If instance is null, create a new instance
      if (!instance) {
        instance = buildRouteBuilder(options);
      } else {
        throw new Error(
          "RouteBuilder instance already exists. You can only create one instance of RouteBuilder per application"
        );
      }
      // Return the instance
      return instance as ReturnType<typeof buildRouteBuilder<T>>;
    },
  };
})();

/**
 * @name createRoute
 * @description
 * It creates a route with the given name, function, paramsSchema, searchParamsSchema and options. here options can be internal or external. If it is internal, it will not append the base url to the route. If it is external, it will append the base url to the route which you will have to provide. It returns a function which takes params and options and returns the route with the search params. It also has useParams and useSearchParams functions which returns the params and search params of the route.
 *
 * @returns {RouteConfig}
 *
 * @example
 *  export const WorkspaceRoute = createRoute({
 *    fn: ({ workspaceId }) => `/workspace/${workspaceId}`,
 *     name: "WorkspaceRoute",
 *    paramsSchema: object({
 *      workspaceId: string(),
 *     }),
 *     options: { internal: true },
 *   searchParamsSchema: object({
 *       withOwner: boolean(),
 *     }),
 *  });
 *
 * WorkspaceRoute({ workspaceId: "123" }, { search: { withOwner: true } });
 * result => /workspace/123?withOwner=true
 *
 */

export type CreateRouteConfig<
  UrlParams extends ZodSchema,
  SearchParams extends ZodSchema,
  TBaseUrls extends {}
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
  fn: (params: input<UrlParams>) => string;

  /**
   * @name paramsSchema
   * @type {ZodSchema}
   *
   * @description paramsSchema is the schema of the params which the route takes. It is used to infer the type of the params. It is also used to validate the params. If the params are not valid, it will throw an error.
   */
  paramsSchema: UrlParams;

  /**
   * @name searchParamsSchema
   * @type {ZodSchema}
   *
   * @description searchParamsSchema is the schema of the search params which the route takes. It is used to infer the type of the search params. It is also used to validate the search params. If the search params are not valid, it will throw an error. It is an optional field
   *
   * @optional
   */
  searchParamsSchema?: SearchParams;

  /**
   * @name baseUrl
   * @type string
   * @description baseUrl is the base url which will be appended to the route. It will take any route that you have defined during the instantiation of routeBuilder.
   */
  baseUrl?: BaseUrls<TBaseUrls>;
};
