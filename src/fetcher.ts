import {
  TypeOf,
  ZodError,
  ZodSchema,
  boolean,
  input,
  number,
  object,
  output,
  string,
} from "zod";
import { RouteConfig, createRoute } from "./route.js";
import { fromError } from "zod-validation-error";
import {
  StatusCodes,
  httpStatusCodes,
  validStatusCode,
} from "./httpStatusCodes.js";

export type HttpMethods = HttpMethodsWithBody | HttpMethodsWithoutBody;

export type HttpMethodsWithBody = "POST" | "PUT" | "PATCH";

export type HttpMethodsWithoutBody =
  | "GET"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "CONNECT"
  | "TRACE"
  | "GET"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "CONNECT"
  | "TRACE";

export type EndPoint<
  Params extends ZodSchema,
  RequestBody extends ZodSchema,
  SearchParams extends ZodSchema,
  Response extends ZodSchema,
  SafeResponse extends boolean,
  Methods extends HttpMethods = HttpMethods
> = {
  path: RouteConfig<Params, SearchParams>;
  /**
   * @name requestConfig
   * The request init object for the fetch call
   */
  requestConfig?: Omit<RequestInit, "body" | "method">;
} & (Methods extends HttpMethodsWithBody
  ? {
      httpMethod: HttpMethodsWithBody;
      bodySchema: RequestBody;
    }
  : {
      httpMethod: HttpMethodsWithoutBody;
    }) &
  (SafeResponse extends true
    ? {
        SafeResponse: true;
        responseSchema: Response;
      }
    : {
        SafeResponse: false;
        responseSchema?: never;
      });
/**
 * @name isHttpMethodWithBody
 * @description checks if the endpoint has a body, currently we only check for the POST, PUT and PATCH methods
 * @param endPoint
 * @returns
 */

export const isHttpMethodWithBody = <
  Params extends ZodSchema,
  RequestBody extends ZodSchema,
  SearchParams extends ZodSchema,
  Response extends ZodSchema,
  SafeResponse extends boolean
>(
  endPoint: EndPoint<Params, RequestBody, SearchParams, Response, SafeResponse>
): endPoint is EndPoint<
  Params,
  RequestBody,
  SearchParams,
  Response,
  SafeResponse,
  HttpMethodsWithBody
> => {
  return (
    endPoint.httpMethod === "POST" ||
    endPoint.httpMethod === "PUT" ||
    endPoint.httpMethod === "PATCH"
  );
};

/**
 * @param endPoint
 * @description creates an endpoint for the fetcher
 * @returns a function that takes in the request config and the parameters for the endpoint
 */

export const createEndPoint = <
  Params extends ZodSchema,
  Body extends ZodSchema,
  SearchParams extends ZodSchema,
  Response extends ZodSchema,
  SafeResponse extends boolean
>(
  endPoint: EndPoint<Params, Body, SearchParams, Response, SafeResponse>,
  options?: {
    prettierValidationError?: boolean;
    customFetchSignature?: typeof fetch;
    overrideStatusCodeErrors?: {
      [key in StatusCodes]?: ({}: {
        code: StatusCodes;
        defaultErrorMessage: string;
      }) => string;
    };
  }
) => {
  return async ({
    params,
    body,
  }: EndPointConfig<Params, Body, typeof endPoint.httpMethod>) => {
    try {
      const fetchToUse = options?.customFetchSignature || fetch;
      const response = await fetchToUse(endPoint.path(params), {
        method: endPoint.httpMethod,
        ...(isHttpMethodWithBody(endPoint) && body
          ? { body: JSON.stringify(endPoint.bodySchema.parse(body)) }
          : {}),
        ...(endPoint.requestConfig ? endPoint.requestConfig : {}),
      });

      const statusCode = response.status;

      // account for the other errors as well,
      if (statusCode >= 400 && statusCode < 599) {
        const errorMessage =
          validStatusCode(statusCode) &&
          options?.overrideStatusCodeErrors?.[statusCode as StatusCodes]
            ? options.overrideStatusCodeErrors[statusCode]!({
                defaultErrorMessage: httpStatusCodes[statusCode],
                code: statusCode,
              })
            : `Request failed with ${
                statusCode < 500 ? "client" : "server"
              } error: ${response.statusText}`;

        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      if (endPoint.SafeResponse) {
        const parsedResponseData = endPoint.responseSchema.parse(
          responseData
        ) as output<Response>;

        return parsedResponseData;
      }

      return responseData as unknown as output<Response>;
    } catch (err) {
      if (err instanceof ZodError)
        throw new Error(
          options?.prettierValidationError
            ? fromError(err).message
            : err.message
        );
      else if (err instanceof Error) {
        throw new Error(err.message);
      } else {
        throw new Error("An unknown error occurred. Please try again later.");
      }
    }
  };
};

export type EndPointConfig<
  Params extends ZodSchema,
  Body extends ZodSchema,
  HttpMethod extends HttpMethods = HttpMethods
> = {
  /**
   * @name params
   * The parameters for the endpoint
   */
  params: input<Params>;
} & (HttpMethod extends HttpMethodsWithBody
  ? { body: input<Body> }
  : {
      body?: never;
    });

export type CustomHandlerEndPointConfig<
  Params extends ZodSchema,
  Body extends ZodSchema,
  HttpMethod extends HttpMethods = HttpMethods
> = Omit<EndPointConfig<Params, Body, HttpMethod>, "requestConfig"> & {
  httpMethod: HttpMethod;
};

// const jsonApiTesting = createEndPoint(
//   {
//     httpMethod: "GET",
//     path: createRoute({
//       name: "/",
//       fn: () => "/api/auth/demo",
//       options: {
//         internal: false,
//         baseUrl: "http://localhost:3000",
//       },
//       paramsSchema: object({}),
//     }),
//     SafeResponse: false,
//   },
//   {
//     overrideStatusCodeErrors: {
//       404: ({ code, defaultErrorMessage }) =>
//         "lol the error happened here with " + code + " " + defaultErrorMessage,
//     },
//   }
// );

// (async () => {
//   const output = jsonApiTesting({ params: {} });
// })();
