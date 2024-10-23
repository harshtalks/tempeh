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
import { buildUrl } from "build-url-ts";
import queryString from "query-string";
import { convertURLSearchParamsToObject } from "./utils";
import { zodParse } from "./utils";
import { fromZodError } from "zod-validation-error";
/**
@description Singleton factory to create a route builder instance. This is the main function to create a route builder instance. It will return a frw utilities that can be used to create routes.
*/
const routeBuilder = <TBaseUrls extends {}>(
  options: RouteBuilderOptions<TBaseUrls>,
) => {
  let routeInstance = null as ReturnType<typeof routeBuilder> | null;
  // create route builder instance
  const routeBuilder = <TBaseUrls extends {}>(
    options: RouteBuilderOptions<TBaseUrls>,
  ) => {
    // this will hold all our routes
    const routes: Record<string, RouteConfig<any, any>> = {};

    // this will hold all our base urls and their respective accessors
    const parsedAdditionalBaseUrls =
      options.additionalBaseUrls &&
      Object.entries(options.additionalBaseUrls).reduce(
        (acc, [key, value]) => {
          // parse the url
          acc[key] = zodParse(urlOrRelativeUrlSchema, value);
          // return the accumulator
          return acc;
        },
        {} as Record<string, string>,
      );

    // setting our default base url
    const defaultBaseUrl = zodParse(
      urlOrRelativeUrlSchema,
      options.defaultBaseUrl || "/",
    );

    // this will hold the router instance
    const {
      routerInstance: routerGetter,
      Link,
      useParams: useNextParams,
      useSearchParams: useNextSearchParams,
    } = options.navigation;

    // Here comes the function to create the full route
    const getFullRoute = (
      path: string,
      baseUrl?: BaseUrls<any>,
      hash?: string,
    ) => {
      // will throw if the path is not a valid path
      const validPath = zodParse(validPathNameSchema, path);

      // will hold the base url
      let base = defaultBaseUrl;

      // check conditions
      if (baseUrl) {
        if (parsedAdditionalBaseUrls && baseUrl in parsedAdditionalBaseUrls) {
          const validBase = zodParse(
            urlOrRelativeUrlSchema,
            parsedAdditionalBaseUrls[baseUrl as string],
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
      const fullRoute = buildUrl(base, {
        path: validPath,
        hash,
      });

      return fullRoute;
    };

    // Here comes the function to create the route object
    const createRoute = <
      TParams extends ZodSchema,
      TSearchParams extends ZodSchema,
    >(
      options: CreateRouteConfig<TParams, TSearchParams, TBaseUrls>,
    ) => {
      const {
        fn,
        name,
        paramsSchema,
        baseUrl: routeBaseUrl,
        searchParamsSchema,
      } = options;

      if (routes[name]) {
        throw new Error(`Route with name ${name} already exists`);
      }

      const route = {} as RouteConfig<TParams, TSearchParams, TBaseUrls>;
      routes[name] = route;

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
          const result = zodParse(paramsSchema, useNextParams());
          return result;
        }
      };

      const useGetSearchParmas = <TSafe extends boolean = false>(
        safe: TSafe,
      ) => {
        const searchParamsSchemaUpdated = searchParamsSchema || any();

        if (safe) {
          const safeResult = searchParamsSchemaUpdated.safeParse(
            convertURLSearchParamsToObject(useNextSearchParams()),
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
          options?.baseUrl ?? routeBaseUrl,
          options?.hash,
        );

        let searchParams = "";
        if (options?.searchParams) {
          const validSearchParams = zodParse(
            searchParamsSchema ?? any(),
            options.searchParams,
          );

          searchParams = queryString.stringify(
            validSearchParams,
            options.searchParamsOptions,
          );
        }

        // This is the returning full route
        return [fullRoute, !!searchParams ? `?${searchParams}` : ``].join(``);
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
          baseUrl ?? routeBaseUrl,
          hash,
        );

        let parsedSearchParams = "";
        if (searchParams) {
          const validSearchParams = zodParse(
            searchParamsSchema ?? any(),
            searchParams,
          );

          parsedSearchParams = queryString.stringify(
            validSearchParams,
            searchParamsOptions,
          );
        }

        const href = [
          fullRoute,
          !!parsedSearchParams ? `?${parsedSearchParams}` : ``,
        ].join(``);

        return (
          <Link {...props} href={href}>
            {children}
          </Link>
        );
      };

      route.useRouter = () => {
        if (!routerGetter) {
          throw new Error("Router instance is not provided");
        }
        const router = routerGetter();

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
                searchParams,
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams,
                searchParamsOptions,
              );
            }
            const fullRoute = getFullRoute(
              fn(parsedParams),
              baseUrl ?? routeBaseUrl,
              hash,
            );
            const href = [
              fullRoute,
              !!parsedSearchParams ? `?${parsedSearchParams}` : ``,
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
              baseUrl ?? routeBaseUrl,
            );
            let parsedSearchParams = "";
            if (searchParams) {
              const validSearchParams = zodParse(
                searchParamsSchema ?? any(),
                searchParams,
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams,
                searchParamsOptions,
              );
            }
            const fullRoute = getFullRoute(
              fn(parsedParams),
              baseUrl ?? routeBaseUrl,
              hash,
            );
            const href = [
              fullRoute,
              !!parsedSearchParams ? `?${parsedSearchParams}` : ``,
            ].join(``);

            router.replace(href, navigationOptions);
          },
          prefetch: ({
            params,
            searchParams,
            navigationOptions,
            baseUrl,
            searchParamsOptions,
            hash,
          }) => {
            const parsedParams = zodParse(paramsSchema, params);
            let parsedSearchParams = "";
            if (searchParams) {
              const validSearchParams = zodParse(
                searchParamsSchema ?? any(),
                searchParams,
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams,
                searchParamsOptions,
              );
            }
            const fullRoute = getFullRoute(
              fn(parsedParams),
              baseUrl ?? routeBaseUrl,
              hash,
            );
            const href = [
              fullRoute,
              !!parsedSearchParams ? `?${parsedSearchParams}` : ``,
            ].join(``);

            router.prefetch(href, navigationOptions);
          },
        };
      };

      route.parseParams = <
        TValue extends unknown = unknown,
        TSafe extends boolean = false,
      >(
        value: TValue,
        safe?: TSafe,
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
        TSafe extends boolean = false,
      >(
        value: TValue,
        safe?: TSafe,
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
    const useTempehRouter = (): TempehGlobalRouterInstance<TBaseUrls> => {
      const router = routerGetter();
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

          router.prefetch(href, navigationOptions);
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
