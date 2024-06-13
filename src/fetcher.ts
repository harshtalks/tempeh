import { ZodError, ZodSchema, input, object, output, string } from "zod";
import { RouteConfig, routeBuilder } from "./route.js";
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
    requestConfig,
  }: EndPointConfig<Params, Body, typeof endPoint.httpMethod>) => {
    try {
      const fetchToUse = options?.customFetchSignature || fetch;

      const endPointRequestConfig = {
        ...endPoint.requestConfig,
        ...requestConfig,
      };

      const response = await fetchToUse(endPoint.path(params), {
        method: endPoint.httpMethod,
        ...(isHttpMethodWithBody(endPoint) && body
          ? { body: JSON.stringify(endPoint.bodySchema.parse(body)) }
          : {}),
        ...endPointRequestConfig,
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
        throw options?.prettierValidationError ? fromError(err) : err;
      else if (err instanceof Error) {
        throw err;
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
  requestConfig?: Omit<RequestInit, "body" | "method">;
} & (HttpMethod extends HttpMethodsWithBody
  ? {
      /**
       * @name body
       * The body for the endpoint
       */

      body: input<Body>;
    }
  : {
      body?: never;
    });
