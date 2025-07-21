// route builder insance creator
import * as React from "react";
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
import {
  buildUrl,
  convertURLSearchParamsToObject,
  parseWithPromiseFiltering,
  schemaParse,
  zodParse,
} from "./utils";
import Link from "next/link";
import { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { StandardSchemaV1 } from "../standard-schema";

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
      TParams extends StandardSchemaV1,
      TSearchParams extends StandardSchemaV1
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
          const safeResult = parseWithPromiseFiltering(
            paramsSchema,
            useNextParams()
          );

          if (!safeResult.issues) {
            return {
              success: true,
              data: safeResult.value,
            } as SafeParamsResult<any>;
          } else {
            return {
              success: false,
              error: safeResult,
            } as SafeParamsResult<any>;
          }
        } else {
          const result = schemaParse(paramsSchema, useNextParams());
          return result;
        }
      };

      const useGetSearchParmas = <TSafe extends boolean = false>(
        safe: TSafe
      ) => {
        const searchParamsSchemaUpdated = searchParamsSchema;

        if (!searchParamsSchemaUpdated) {
          throw new Error("Search params schema is not defined");
        }

        if (safe) {
          const safeResult = parseWithPromiseFiltering(
            searchParamsSchemaUpdated,
            convertURLSearchParamsToObject(useNextSearchParams())
          );
          if (!safeResult.issues) {
            return {
              success: true,
              data: safeResult.value,
            } as SafeParamsResult<any>;
          } else {
            return {
              success: false,
              error: safeResult,
            } as SafeParamsResult<any>;
          }
        } else {
          const result = schemaParse(
            searchParamsSchemaUpdated,
            convertURLSearchParamsToObject(useNextSearchParams())
          );

          return result;
        }
      };

      // navigate function
      route.navigate = (params, options) => {
        // parse the params
        const parsedParams = schemaParse(paramsSchema, params);
        // we have got the full route here.
        const fullRoute = getFullRoute(
          fn(parsedParams),
          options?.baseUrl ?? routeBaseUrl
        );

        let searchParams = "";
        if (options?.searchParams && searchParamsSchema) {
          const validSearchParams = schemaParse(
            searchParamsSchema,
            options.searchParams
          );

          searchParams = queryString.stringify(
            validSearchParams as {},
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
        ? SafeParamsResult<StandardSchemaV1.InferOutput<TParams>>
        : StandardSchemaV1.InferOutput<TParams> => {
        const output = useGetParams(options?.safe || false);
        // @ts-expect-error
        return output;
      };

      route.useSearchParams = <TSafe extends boolean = false>(options?: {
        safe?: TSafe;
      }): TSafe extends true
        ? SafeParamsResult<StandardSchemaV1.InferOutput<TSearchParams>>
        : StandardSchemaV1.InferOutput<TSearchParams> => {
        const output = useGetSearchParmas(options?.safe || false);
        // @ts-expect-error
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
        const parsedParams = schemaParse(paramsSchema, params);

        const fullRoute = getFullRoute(
          fn(parsedParams),
          baseUrl ?? routeBaseUrl
        );

        let parsedSearchParams = "";
        if (searchParams && searchParamsSchema) {
          const validSearchParams = schemaParse(
            searchParamsSchema,
            searchParams
          );

          parsedSearchParams = queryString.stringify(
            validSearchParams as {},
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
            const parsedParams = schemaParse(paramsSchema, params);
            let parsedSearchParams = "";
            if (searchParams && searchParamsSchema) {
              const validSearchParams = schemaParse(
                searchParamsSchema,
                searchParams
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams as {},
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
            const parsedParams = schemaParse(
              paramsSchema,
              baseUrl ?? routeBaseUrl
            );
            let parsedSearchParams = "";
            if (searchParams && searchParamsSchema) {
              const validSearchParams = schemaParse(
                searchParamsSchema,
                searchParams
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams as {},
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
            const parsedParams = schemaParse(paramsSchema, params);
            let parsedSearchParams = "";
            if (searchParams && searchParamsSchema) {
              const validSearchParams = schemaParse(
                searchParamsSchema,
                searchParams
              );

              parsedSearchParams = queryString.stringify(
                validSearchParams as {},
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

      // @ts-expect-error
      route.parseParams = <
        TValue extends unknown = unknown,
        TSafe extends boolean = false
      >(
        value: TValue,
        safe?: TSafe
      ): TSafe extends true
        ? SafeParamsResult<StandardSchemaV1.InferOutput<TParams>>
        : StandardSchemaV1.InferOutput<TParams> => {
        if (safe) {
          const safeResult = parseWithPromiseFiltering(paramsSchema, value);
          if (!safeResult.issues) {
            return {
              success: true,
              data: safeResult.value,
            } as SafeParamsResult<StandardSchemaV1.InferOutput<TParams>>;
          } else {
            return {
              success: false,
              error: safeResult,
            } as SafeParamsResult<StandardSchemaV1.InferOutput<TParams>>;
          }
        } else {
          // @ts-expect-error
          return schemaParse(
            paramsSchema,
            value
          ) as StandardSchemaV1.InferOutput<TParams>;
        }
      };

      // @ts-expect-error
      route.parseSearchParams = <
        TValue extends unknown = unknown,
        TSafe extends boolean = false
      >(
        value: TValue,
        safe?: TSafe
      ): TSafe extends true
        ? SafeParamsResult<StandardSchemaV1.InferOutput<TSearchParams>>
        : StandardSchemaV1.InferOutput<TSearchParams> => {
        const schema = searchParamsSchema;
        if (!schema) {
          throw new Error("No searchParamsSchema provided");
        }

        if (safe) {
          const safeResult = parseWithPromiseFiltering(schema, value);
          if (!safeResult.issues) {
            return {
              success: true,
              data: safeResult.value,
            } as SafeParamsResult<StandardSchemaV1.InferOutput<TSearchParams>>;
          } else {
            return {
              success: false,
              error: safeResult,
            } as SafeParamsResult<StandardSchemaV1.InferOutput<TSearchParams>>;
          }
        } else {
          //@ts-expect-error
          return schemaParse(
            schema,
            value
          ) as StandardSchemaV1.InferOutput<TSearchParams>;
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
