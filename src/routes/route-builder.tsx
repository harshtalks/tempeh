// route builder insance creator
import * as React from "react";
import { ZodSchema, any, output } from "zod";
import { urlOrRelativeUrlSchema, validPathNameSchema } from "./schema";
import {
  RouteConfig,
  RouteBuilderOptions,
  CreateRouteConfig,
  BaseUrls,
  SafeParamsResult,
  NavigateLink,
  TempehGlobalRouterInstance,
} from "./types";
import queryString from "query-string";
import {
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import { buildUrl, convertURLSearchParamsToObject } from "./utils";
import { zodParse } from "./utils";
import { fromZodError } from "zod-validation-error";
import Link from "next/link";
import { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
@description Singleton factory to create a route builder instance. This is the main function to create a route builder instance. It will return a frw utilities that can be used to create routes.
*/
const routeBuilder = <TBaseUrls extends {}>(
  options: RouteBuilderOptions<TBaseUrls>
) => {
  let routeInstance = null as ReturnType<typeof routeBuilder> | null;
  // create route builder instance
  const routeBuilder = <TBaseUrls extends {}>(
    options: RouteBuilderOptions<TBaseUrls>
  ) => {
    // this will hold all our base urls and their respective accessors
    const parsedAdditionalBaseUrls =
      options.additionalBaseUrls &&
      Object.entries(options.additionalBaseUrls).reduce((acc, [key, value]) => {
        // parse the url
        acc[key] = zodParse(urlOrRelativeUrlSchema, value);
        // return the accumulator
        return acc;
      }, {} as Record<string, string>);

    // setting our default base url
    const defaultBaseUrl = zodParse(
      urlOrRelativeUrlSchema,
      options.defaultBaseUrl || "/"
    );

    // Here comes the function to create the full route
    const getFullRoute = (path: string, baseUrl?: BaseUrls<any>) => {
      // will throw if the path is not a valid path
      const validPath = zodParse(validPathNameSchema, path);

      // will hold the base url
      let base = defaultBaseUrl;

      // check conditions
      if (baseUrl) {
        if (parsedAdditionalBaseUrls && baseUrl in parsedAdditionalBaseUrls) {
          const validBase = zodParse(
            urlOrRelativeUrlSchema,
            parsedAdditionalBaseUrls[baseUrl as string]
          );
          // if the base url is valid, then set it
          base = validBase;
        } else {
          // check if the base url is a valid url
          const validBase = zodParse(urlOrRelativeUrlSchema, baseUrl);
          base = validBase;
        }
      }

      // create the full route
      const fullRoute = buildUrl({
        base: base,
        path: validPath,
      });

      return fullRoute;
    };

    // Here comes the function to create the route object
    const createRoute = <
      TParams extends ZodSchema,
      TSearchParams extends ZodSchema
    >(
      options: CreateRouteConfig<TParams, TSearchParams, TBaseUrls>
    ) => {
      const {
        fn,
        name,
        paramsSchema,
        baseUrl: routeBaseUrl,
        searchParamsSchema,
      } = options;

      const route = {} as RouteConfig<TParams, TSearchParams, TBaseUrls>;

      const useGetParams = <TSafe extends boolean = false>(safe: TSafe) => {
        if (safe) {
          const safeResult = paramsSchema.safeParse(useNextParams());
          if (safeResult.success) {
            return {
              success: true,
              data: safeResult.data,
            } as SafeParamsResult<any>;
          } else {
            return {
              success: false,
              error: fromZodError(safeResult.error, {
                prefix: `Error in route "${name}" params`,
              }),
            } as SafeParamsResult<any>;
          }
        } else {
          const result = zodParse(paramsSchema, useNextParams(), {
            prefix: `Error in route "${name}" params`,
          });
          return result;
        }
      };

      const useGetSearchParmas = <TSafe extends boolean = false>(
        safe: TSafe
      ) => {
        const searchParamsSchemaUpdated = searchParamsSchema || any();

        if (safe) {
          const safeResult = searchParamsSchemaUpdated.safeParse(
            convertURLSearchParamsToObject(useNextSearchParams())
          );
          if (safeResult.success) {
            return {
              success: true,
              data: safeResult.data,
            } as SafeParamsResult<any>;
          } else {
            return {
              success: false,
              error: fromZodError(safeResult.error, {
                prefix: `Error in route "${name}" search params`,
              }),
            } as SafeParamsResult<any>;
          }
        } else {
          const result = zodParse(
            searchParamsSchemaUpdated,
            convertURLSearchParamsToObject(useNextSearchParams()),
            {
              prefix: `Error in route "${name}" search params`,
            }
          );

          return result;
        }
      };

      // navigate function
      route.navigate = (params, options) => {
        // parse the params
        const parsedParams = zodParse(paramsSchema, params);
        // we have got the full route here.
        const fullRoute = getFullRoute(
          fn(parsedParams),
          options?.baseUrl ?? routeBaseUrl
        );

        let searchParams = "";
        if (options?.searchParams) {
          const validSearchParams = zodParse(
            searchParamsSchema ?? any(),
            options.searchParams
          );

          searchParams = queryString.stringify(
            validSearchParams,
            options.searchParamsOptions
          );
        }

        // This is the returning full route
        return [
          fullRoute,
          !!searchParams ? `?${searchParams}` : ``,
          options?.hash ? `#${options.hash}` : ``,
        ].join(``);
      };

      route.useParams = <TSafe extends boolean = false>(options?: {
        safe?: TSafe;
      }): TSafe extends true
        ? SafeParamsResult<output<TParams>>
        : output<TParams> => {
        const output = useGetParams(options?.safe || false);
        return output;
      };

      route.useSearchParams = <TSafe extends boolean = false>(options?: {
        safe?: TSafe;
      }): TSafe extends true
        ? SafeParamsResult<output<TSearchParams>>
        : output<TSearchParams> => {
        const output = useGetSearchParmas(options?.safe || false);
        return output;
      };

      route.Link = ({
        children,
        params,
        searchParams,
        searchParamsOptions,
        baseUrl,
        hash,
        ...props
      }) => {
        const parsedParams = zodParse(paramsSchema, params);

        const fullRoute = getFullRoute(
          fn(parsedParams),
          baseUrl ?? routeBaseUrl
        );

        let parsedSearchParams = "";
        if (searchParams) {
          const validSearchParams = zodParse(
            searchParamsSchema ?? any(),
            searchParams
          );

          parsedSearchParams = queryString.stringify(
            validSearchParams,
            searchParamsOptions
          );
        }

        const href = [
          fullRoute,
          !!parsedSearchParams ? `?${parsedSearchParams}` : ``,
          hash ? `#${hash}` : ``,
        ].join(``);

        return (
          <Link {...props} href={href}>
            {children}
          </Link>
        );
      };

      route.useRouter = (useRouter) => {
        const router = useRouter();

        return {
          push: ({
            params,
            searchParams,
            navigationOptions,
            searchParamsOptions,
            baseUrl,
            hash,
          }) => {
            const parsedParams = zodParse(paramsSchema, params);
            let parsedSearchParams = "";
            if (searchParams) {
              const validSearchParams = zodParse(
                searchParamsSchema ?? any(),
                searchParams
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams,
                searchParamsOptions
              );
            }
            const fullRoute = getFullRoute(
              fn(parsedParams),
              baseUrl ?? routeBaseUrl
            );
            const href = [
              fullRoute,
              !!parsedSearchParams ? `?${parsedSearchParams}` : ``,
              hash ? `#${hash}` : ``,
            ].join(``);

            router.push(href, navigationOptions);
          },
          replace: ({
            params,
            searchParams,
            navigationOptions,
            searchParamsOptions,
            baseUrl,
            hash,
          }) => {
            const parsedParams = zodParse(
              paramsSchema,
              baseUrl ?? routeBaseUrl
            );
            let parsedSearchParams = "";
            if (searchParams) {
              const validSearchParams = zodParse(
                searchParamsSchema ?? any(),
                searchParams
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams,
                searchParamsOptions
              );
            }
            const fullRoute = getFullRoute(
              fn(parsedParams),
              baseUrl ?? routeBaseUrl
            );
            const href = [
              fullRoute,
              !!parsedSearchParams ? `?${parsedSearchParams}` : ``,
              hash ? `#${hash}` : ``,
            ].join(``);

            router.replace(href, navigationOptions);
          },
          prefetch: ({
            params,
            searchParams,
            prefetchOptions,
            baseUrl,
            searchParamsOptions,
            hash,
          }) => {
            const parsedParams = zodParse(paramsSchema, params);
            let parsedSearchParams = "";
            if (searchParams) {
              const validSearchParams = zodParse(
                searchParamsSchema ?? any(),
                searchParams
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams,
                searchParamsOptions
              );
            }
            const fullRoute = getFullRoute(
              fn(parsedParams),
              baseUrl ?? routeBaseUrl
            );
            const href = [
              fullRoute,
              !!parsedSearchParams ? `?${parsedSearchParams}` : ``,
              hash ? `#${hash}` : ``,
            ].join(``);

            router.prefetch(href, prefetchOptions);
          },
        };
      };

      route.parseParams = <
        TValue extends unknown = unknown,
        TSafe extends boolean = false
      >(
        value: TValue,
        safe?: TSafe
      ): TSafe extends true
        ? SafeParamsResult<output<TParams>>
        : output<TParams> => {
        if (safe) {
          const safeResult = paramsSchema.safeParse(value);
          if (safeResult.success) {
            return {
              success: true,
              data: safeResult.data,
            } as SafeParamsResult<output<TParams>>;
          } else {
            return {
              success: false,
              error: fromZodError(safeResult.error, {
                prefix: `Error in route "${name}" params`,
              }),
            } as SafeParamsResult<output<TParams>>;
          }
        } else {
          return zodParse(paramsSchema, value) as output<TParams>;
        }
      };

      route.parseSearchParams = <
        TValue extends unknown = unknown,
        TSafe extends boolean = false
      >(
        value: TValue,
        safe?: TSafe
      ): TSafe extends true
        ? SafeParamsResult<output<TSearchParams>>
        : output<TSearchParams> => {
        const schema = searchParamsSchema ?? any();
        if (safe) {
          const safeResult = schema.safeParse(value);
          if (safeResult.success) {
            return {
              success: true,
              data: safeResult.data,
            } as SafeParamsResult<output<TSearchParams>>;
          } else {
            return {
              success: false,
              error: fromZodError(safeResult.error, {
                prefix: `Error in route "${name}" searchParams`,
              }),
            } as SafeParamsResult<output<TSearchParams>>;
          }
        } else {
          return zodParse(schema, value) as output<TSearchParams>;
        }
      };

      return route;
    };

    // Global Navigate
    const Navigate: NavigateLink<TBaseUrls> = ({
      path,
      searchParams,
      children,
      searchParamsOptions,
      baseUrl,
      hash,
      ...props
    }) => {
      const fullRoute = getFullRoute(path, baseUrl);
      const href = [
        fullRoute,
        searchParams
          ? `?${queryString.stringify(searchParams, searchParamsOptions)}`
          : ``,
        hash ? `#${hash}` : ``,
      ].join(``);

      return (
        <Link {...props} href={href}>
          {children}
        </Link>
      );
    };

    // Global tempeh router
    const useTempehRouter: TempehGlobalRouterInstance<TBaseUrls> = (
      useRouter
    ) => {
      const router = useRouter();
      return {
        push: ({
          path,
          searchParams,
          searchParamsOptions,
          baseUrl,
          hash,
          navigationOptions,
        }) => {
          const fullRoute = getFullRoute(path, baseUrl);
          const href = [
            fullRoute,
            searchParams
              ? `?${queryString.stringify(searchParams, searchParamsOptions)}`
              : ``,
            hash ? `#${hash}` : ``,
          ].join(``);

          router.push(href, navigationOptions);
        },
        replace: ({
          path,
          searchParams,
          searchParamsOptions,
          baseUrl,
          hash,
          navigationOptions,
        }: {
          path: string;
          baseUrl?: BaseUrls<TBaseUrls>;
          searchParams?: Record<string, any>;
          searchParamsOptions?: queryString.StringifyOptions;
          hash?: string;
          navigationOptions?: NavigateOptions;
        }) => {
          const fullRoute = getFullRoute(path, baseUrl);
          const href = [
            fullRoute,
            searchParams
              ? `?${queryString.stringify(searchParams, searchParamsOptions)}`
              : ``,
            hash ? `#${hash}` : ``,
          ].join(``);

          router.replace(href, navigationOptions);
        },
        prefetch: ({
          path,
          searchParams,
          searchParamsOptions,
          baseUrl,
          hash,
          prefetchOptions,
        }) => {
          const fullRoute = getFullRoute(path, baseUrl);
          const href = [
            fullRoute,
            searchParams
              ? `?${queryString.stringify(searchParams, searchParamsOptions)}`
              : ``,
            hash ? `#${hash}` : ``,
          ].join(``);

          router.prefetch(href, prefetchOptions);
        },
      };
    };

    return { createRoute, Navigate, useTempehRouter };
  };

  const getInstance = () => {
    if (!routeInstance) {
      routeInstance = routeBuilder(options);
    }
    return routeInstance as ReturnType<typeof routeBuilder<TBaseUrls>>;
  };

  return { getInstance };
};

export default routeBuilder;
