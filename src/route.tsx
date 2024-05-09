import {
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import queryString from "query-string";
import {
  ZodSchema,
  boolean,
  enum as enum_,
  input,
  object,
  output,
  string,
} from "zod";
import { convertURLSearchParamsToObject } from "./utils";
import Link from "next/link";
import { ComponentProps } from "react";
import React from "react";
import { fromError } from "zod-validation-error";

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

const urlSchema = string().min(1).url();

export type RouteConfig<
  TParams extends ZodSchema,
  TSearchParams extends ZodSchema
> = {
  (p: input<TParams>, options?: { search?: input<TSearchParams> }): string;
  useParams: () => output<TParams>;
  useSearchParams: () => output<TSearchParams>;
  params: output<TParams>;
  searchParams: output<TSearchParams>;
  Link: (
    props: Omit<ComponentProps<typeof Link>, "href"> & {
      params: input<TParams>;
      searchParams?: input<TSearchParams>;
    }
  ) => JSX.Element;
};

/**
 * @name routeBuilder
 * @description routeBuilder is a function based on singleton pattern which returns a function called createRoute. createRoute is a function which takes an object with name, fn, paramsSchema, searchParamsSchema and options. It returns a function which takes params and options and returns the route with the search params. It also has useParams and useSearchParams functions which returns the params and search params of the route.
 * Make sure you call this function only once in your application as it tracks the routes internally for the search params and params. If you call it multiple times, You will loose the types on many places.
 * @returns {createRoute}
 * @example
 * // file name: global.route.ts
 * const createRoute = routeBuilder();
 */

export const routeBuilder = (() => {
  // Private variable to store the single instance
  let instance: ReturnType<typeof buildRouteBuilder> | null = null;

  // Private function to create the instance

  const buildRouteBuilder = <TBaseUrls extends {}>(
    options?: RouteBuilderOptions<TBaseUrls>
  ) => {
    const x: (x: keyof TBaseUrls) => void = (x) => {};

    const routes: Record<string, RouteConfig<any, any>> = {};

    const parsedAdditionalBaseUrls =
      options?.additionalBaseUrls &&
      Object.entries(options.additionalBaseUrls).reduce((acc, [key, value]) => {
        const parsedUrls = urlSchema.safeParse(value);

        if (!parsedUrls.success) {
          throw new Error(
            `Invalid URL for ${key}: ${fromError(parsedUrls.error).message}`
          );
        }

        acc[key] = parsedUrls.data;

        return acc;
      }, {} as Record<string, string>);

    const defaultBaseUrl = options?.defaultBaseUrl || "/";

    const formattedValidationErrors =
      options?.formattedValidationErrors || true;

    const buildRoute = <
      TParams extends ZodSchema,
      TSearchParams extends ZodSchema
    >(
      name: string,
      fn: (params: input<TParams>) => string,
      paramSchema: TParams = {} as TParams,
      searchSchema: TSearchParams = {} as TSearchParams,
      baseUrl?: keyof TBaseUrls | (string & {})
    ): RouteConfig<TParams, TSearchParams> => {
      // check if the route already exists
      if (routes[name]) {
        throw new Error(`Route with name ${name} already exists`);
      }

      const route: RouteConfig<TParams, TSearchParams> = (params, options) => {
        const parsedDefaultRoute = urlSchema.safeParse(defaultBaseUrl);

        const removeTrailingSlashes = (str: string) => str.replace(/\/+$/, "");

        let route = removeTrailingSlashes(fn(params));

        // default route logic
        if (!parsedDefaultRoute.success) {
          if (defaultBaseUrl.startsWith("/")) {
            route = removeTrailingSlashes(defaultBaseUrl).concat(route);
          } else {
            throw new Error(
              "Invalid default base url. It should be a valid url or a relative path starting with /"
            );
          }
        } else {
          route = new URL(route, parsedDefaultRoute.data).toString();
        }

        // when alternative route is given
        if (baseUrl) {
          if (parsedAdditionalBaseUrls && baseUrl in parsedAdditionalBaseUrls) {
            const parsedBase = urlSchema.safeParse(
              parsedAdditionalBaseUrls[baseUrl as string]
            );

            if (!parsedBase.success) {
              throw new Error(
                `Invalid URL for ${baseUrl as string}: ${
                  formattedValidationErrors
                    ? fromError(parsedBase.error).message
                    : parsedBase.error
                }`
              );
            }

            route = new URL(route, parsedBase.data).toString();
          } else {
            const parsedBase = urlSchema.safeParse(baseUrl);

            if (!parsedBase.success) {
              throw new Error(
                `Invalid URL for ${baseUrl as string}: ${
                  formattedValidationErrors
                    ? fromError(parsedBase.error).message
                    : parsedBase.error
                }`
              );
            }
            route = new URL(route, parsedBase.data).toString();
          }
        }

        const searchQuery =
          options?.search && queryString.stringify(options.search);

        return [route, searchQuery ? `?${searchQuery}` : ``].join(``);
      };

      routes[name] = route;

      route.useParams = (): output<TParams> => {
        const routeName =
          Object.entries(routes).find(([key, value]) => value === route)?.[0] ||
          ("Invalid Route" as never);

        const result = paramSchema.safeParse(useNextParams());

        if (!result.success) {
          throw new Error(
            `Invalid params for route ${routeName}: ${
              formattedValidationErrors
                ? fromError(formattedValidationErrors).message
                : result.error
            }`
          );
        }

        return result.data;
      };

      route.useSearchParams = (): output<TSearchParams> => {
        const routeName =
          Object.entries(routes).find(([key, value]) => value === route)?.[0] ||
          ("Invalid Route" as never);

        const result = searchSchema.safeParse(
          convertURLSearchParamsToObject(useNextSearchParams())
        );

        if (!result.success) {
          throw new Error(
            `Invalid search params for route ${routeName}: ${
              formattedValidationErrors
                ? fromError(formattedValidationErrors).message
                : result.error
            }`
          );
        }

        return result.data;
      };

      route.params = undefined as output<TParams>;
      route.searchParams = undefined as output<TSearchParams>;

      route.Link = ({ children, params, searchParams, ...props }) => {
        let route = fn(params);

        if (baseUrl) {
          const base = new URL(urlSchema.parse(baseUrl));
          route = new URL(route, base).toString();
        }

        const searchQuery = searchParams && queryString.stringify(searchParams);

        const href = [route, searchQuery ? `?${searchQuery}` : ``].join(``);
        return (
          <Link {...props} href={href}>
            {children}
          </Link>
        );
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

      return route;
    };

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
      return buildRoute(name, fn, paramsSchema, searchParamsSchema, baseUrl);
    };

    return { createRoute };
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
  baseUrl?: keyof TBaseUrls | (string & {});
};

const { createRoute } = routeBuilder.getInstance({});
