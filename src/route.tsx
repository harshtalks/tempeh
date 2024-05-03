import {
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import queryString from "query-string";
import { ZodSchema, enum as enum_, input, object, output, string } from "zod";
import { convertURLSearchParamsToObject } from "./utils";
import Link from "next/link";
import { ComponentProps } from "react";
import React from "react";

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

const routeBuilder = () => {
  const routes: Record<string, RouteConfig<any, any>> = {};

  const urlSchema = string().min(1).url();

  const buildRoute = <
    TParams extends ZodSchema,
    TSearchParams extends ZodSchema
  >(
    name: string,
    fn: (params: input<TParams>) => string,
    paramSchema: TParams = {} as TParams,
    searchSchema: TSearchParams = {} as TSearchParams,
    urlOptions:
      | {
          internal: true;
        }
      | {
          internal: false;
          baseUrl: string;
        }
  ): RouteConfig<TParams, TSearchParams> => {
    // check if the route already exists
    if (routes[name]) {
      throw new Error(`Route with name ${name} already exists`);
    }

    const route: RouteConfig<TParams, TSearchParams> = (params, options) => {
      let route = fn(params);

      if (!urlOptions.internal) {
        const baseUrl = new URL(urlSchema.parse(urlOptions.baseUrl));
        route = new URL(route, baseUrl).toString();
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
          `Invalid params for route ${routeName}: ${result.error}`
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
          `Invalid search params for route ${routeName}: ${result.error}`
        );
      }

      return result.data;
    };

    route.params = undefined as output<TParams>;
    route.searchParams = undefined as output<TSearchParams>;

    route.Link = ({ children, params, searchParams, ...props }) => {
      let route = fn(params);

      if (!urlOptions.internal) {
        const baseUrl = new URL(urlSchema.parse(urlOptions.baseUrl));
        route = new URL(route, baseUrl).toString();
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

  return buildRoute;
};

const buildRoute = routeBuilder();

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

export const createRoute = <
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
   * @name options
   * @type {Object}
   * @description options is an object which can be internal or external. If it is internal, it will not append the base url to the route. If it is external, it will append the base url to the route which you will have to provide. baseUrl needs to follow basic url format otherwise it will throw an error.
   */
  options,
}: CreateRouteConfig<TParams, TSearchParams>) => {
  return buildRoute(name, fn, paramsSchema, searchParamsSchema, options);
};

export type CreateRouteConfig<
  UrlParams extends ZodSchema,
  SearchParams extends ZodSchema
> = {
  // give jsdoc

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
   * @name options
   * @type {Object}
   * @description options is an object which can be internal or external. If it is internal, it will not append the base url to the route. If it is external, it will append the base url to the route which you will have to provide. baseUrl needs to follow basic url format otherwise it will throw an error.
   */
  options:
    | {
        internal: true;
      }
    | {
        internal: false;
        baseUrl: string;
      };
};

// example

const x = createRoute({
  fn: () => "/",
  paramsSchema: object({}),
  name: "home",
  options: {
    internal: true,
  },
});
