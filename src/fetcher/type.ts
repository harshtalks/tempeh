// types for our fetcher function

import { ZodSchema } from "zod";
import { RouteConfig } from "../route";
import {
  HttpErrorStatusCodeLabels,
  HttpErrorStatusCodes,
} from "./status-codes";
import HttpResponseError from "./http-errror";

export type HttpMethodsWithoutBody = "TRACE";

export type HttpMethodsWithBody =
  | "GET"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "CONNECT"
  | "GET"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "CONNECT"
  | "POST"
  | "PUT"
  | "PATCH";

export type ArbitraryHttpMethods = string & {};

export type HttpMethods =
  | HttpMethodsWithBody
  | HttpMethodsWithoutBody
  | ArbitraryHttpMethods;

export type TempehFetcherConfig = {
  requestConfig?: Omit<RequestInit, "body" | "method">;
  formattedValidationErrors?: boolean;
  handleHttpErrors?: {
    [key in HttpErrorStatusCodeLabels]?: (error: HttpResponseError) => unknown;
  };
  onRequestError?: (error: unknown) => unknown;
};

export type EndPoint<
  TParamSchema extends ZodSchema,
  TSearchParams extends ZodSchema,
  TRequestBodySchema extends ZodSchema,
  TResponseSchema extends ZodSchema,
  TSafeResponse extends boolean = true,
  TMethods extends HttpMethods = HttpMethods
> = {
  path: RouteConfig<TParamSchema, TSearchParams>;
  requestConfig?: Omit<RequestInit, "body" | "method">;
  httpMethod: TMethods;
  typeSafeResponse?: TSafeResponse;
} & (TMethods extends HttpMethodsWithBody
  ? {
      bodySchema?: TRequestBodySchema;
    }
  : {
      bodySchema?: never;
    }) &
  (TSafeResponse extends true
    ? {
        responseSchema: TResponseSchema;
      }
    : {
        responseSchema?: never;
      });

export type EndPointConfig<
  TParamSchema extends ZodSchema,
  TSearchParamSchema extends ZodSchema,
  TRequestBodySchema extends ZodSchema,
  HttpMethod extends HttpMethods = HttpMethods
> = {
  params: TParamSchema;
  searchParams?: TSearchParamSchema;
} & (HttpMethod extends HttpMethodsWithBody
  ? {
      body: TRequestBodySchema;
    }
  : {
      body?: never;
    });
