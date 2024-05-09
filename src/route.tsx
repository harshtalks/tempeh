import {
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import queryString from "query-string";
import {
  ZodSchema,
  any,
  boolean,
  enum as enum_,
  input,
  object,
  output,
  string,
  union,
} from "zod";
import { convertURLSearchParamsToObject } from "./utils";
import Link from "next/link";
import { ComponentProps } from "react";
import React from "react";
import { fromError } from "zod-validation-error";

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
    const routes: Record<string, RouteConfig<any, any>> = {};

    const parsedAdditionalBaseUrls =
      options?.additionalBaseUrls &&
      Object.entries(options.additionalBaseUrls).reduce((acc, [key, value]) => {
        const parsedUrls = urlSchema.safeParse(value);

        if (!parsedUrls.success) {
          throw new Error(
            `Invalid Base URL for ${key}: ${
              fromError(parsedUrls.error).message
            }`
          );
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
          throw new Error(
            `Invalid pathname ${pathname} for route ${name}: ${
              formattedValidationErrors
                ? fromError(validPathname.error).message
                : validPathname.error
            }`
          );
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
              throw new Error(
                `Invalid Base URL ${baseUrl as string} for route ${name}: ${
                  formattedValidationErrors
                    ? fromError(parsedBase.error).message
                    : parsedBase.error
                }`
              );
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
            throw new Error(
              `Invalid Base URL ${baseUrl as string} for route ${name}: ${
                formattedValidationErrors
                  ? fromError(parsedDefaultRoute.error).message
                  : parsedDefaultRoute.error
              }`
            );
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
        const route = getRoute(fn(params));

        const searchQuery =
          options?.search && queryString.stringify(options.search);

        const link = [route, searchQuery ? `?${searchQuery}` : ``].join(``);

        return link;
      };

      routes[name] = route;

      route.useParams = (): output<TParams> => {
        const routeName =
          Object.entries(routes).find(([key, value]) => value === route)?.[0] ||
          ("Invalid Route" as never);

        const result = paramsSchema.safeParse(useNextParams());

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

        const searchParamsSchemaUpdated = searchParamsSchema || any();

        const result = searchParamsSchemaUpdated.safeParse(
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
        const route = getRoute(fn(params));

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
