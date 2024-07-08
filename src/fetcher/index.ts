import { output, ZodSchema } from "zod";
import HttpResponseError from "./http-errror";
import { EndPoint, HttpMethodsWithBody, TempehFetcherConfig } from "./type";
import { HttpMethods } from "./type";
import {
  HttpErrorStatusCodeLabels,
  httpErrorStatusCodes,
  validErrorStatusCode,
} from "./status-codes";
import { EndPointConfig } from "./type";

export const isHttpMethodWithBody = <
  Params extends ZodSchema,
  RequestBody extends ZodSchema,
  SearchParams extends ZodSchema,
  Response extends ZodSchema,
  SafeResponse extends boolean
>(
  endPoint: EndPoint<Params, SearchParams, RequestBody, Response, SafeResponse>
): endPoint is EndPoint<
  Params,
  SearchParams,
  RequestBody,
  Response,
  SafeResponse,
  HttpMethodsWithBody
> => {
  return endPoint.httpMethod !== "GET";
};

class tempehFetcher {
  static getInstance(params: TempehFetcherConfig) {
    const createEndPoint = <
      TParamSchema extends ZodSchema,
      TSearchParamSchema extends ZodSchema,
      TRequestBodySchema extends ZodSchema,
      TResponseSchema extends ZodSchema,
      TSafeResponse extends boolean = true,
      TMethods extends HttpMethods = HttpMethods
    >(
      fnLevelParams: EndPoint<
        TParamSchema,
        TSearchParamSchema,
        TRequestBodySchema,
        TResponseSchema,
        TSafeResponse,
        TMethods
      > & {
        handleHttpErrors?: {
          [key in HttpErrorStatusCodeLabels]?: <T>(
            error: HttpResponseError
          ) => T;
        };
        onRequestError?: <T>(error: unknown) => T;
        formattedValidationErrors?: boolean;
        requestConfig?: Omit<RequestInit, "body" | "method">;
      }
    ) => {
      // Merge the requestConfig from the function level and the global level
      const requestConfig = {
        ...params.requestConfig,
        ...fnLevelParams.requestConfig,
      };

      // Merge the handleErrors from the function level and the global level
      const handleErrors = {
        ...params.handleHttpErrors,
        ...fnLevelParams.handleHttpErrors,
      };

      // Merge the onError from the function level and the global level
      const onError = fnLevelParams.onRequestError ?? params.onRequestError;

      // Merge the formattedValidationErrors from the function level and the global level
      const formattedValidationErrors =
        fnLevelParams.formattedValidationErrors ??
        params.formattedValidationErrors;

      return async <TResponse extends {} = output<TResponseSchema>>(
        args: EndPointConfig<
          TParamSchema,
          TSearchParamSchema,
          TRequestBodySchema,
          typeof fnLevelParams.httpMethod
        >
      ) => {
        const url = fnLevelParams.path(args.params, {
          search: args.searchParams,
        });
        try {
          const typeCastParams = {
            httpMethod: fnLevelParams.httpMethod,
            path: fnLevelParams.path,
            bodySchema: fnLevelParams.bodySchema,
            requestConfig: fnLevelParams.requestConfig,
            responseSchema: fnLevelParams.responseSchema,
          };
          const response = await fetch(url, {
            ...requestConfig,
            method: fnLevelParams.httpMethod,
            ...(isHttpMethodWithBody(typeCastParams) &&
            args.body &&
            fnLevelParams.bodySchema
              ? {
                  body: JSON.stringify(
                    fnLevelParams.bodySchema.parse(args.body)
                  ),
                }
              : {}),
          });

          if (!response.ok) {
            const statusCode = response.status;

            if (!validErrorStatusCode(statusCode)) {
              throw new Error("Invalid status code: " + statusCode);
            }

            const statusMetadata = httpErrorStatusCodes[statusCode];

            const ErrorClass = new HttpResponseError(
              response.statusText,
              response,
              statusMetadata
            );

            if (
              handleErrors &&
              validErrorStatusCode(statusCode) &&
              handleErrors[statusMetadata.label]
            ) {
              const errorFn = handleErrors[statusMetadata.label];

              if (!errorFn) {
                throw ErrorClass;
              }

              return errorFn(ErrorClass);
            } else {
              throw ErrorClass;
            }
          } else {
            const responseData = await response.json();
            if (
              fnLevelParams.typeSafeResponse &&
              fnLevelParams.responseSchema
            ) {
              return fnLevelParams.responseSchema.parse(
                responseData
              ) as output<TResponseSchema>;
            } else {
              return responseData as TResponse;
            }
          }

          return;
        } catch (error) {
          if (!onError) {
            throw error;
          } else {
            return onError(error);
          }
        }
      };
    };

    return {
      createEndPoint,
    };
  }
}

export default tempehFetcher;
