import * as z from "zod";
import { ServerActionError } from "./errors";
// our server action can take input schema as either "form" or "json"
export type ServerActionAccept = "form" | "json";

// error
export type ErrorInferenceObject = Record<string, any>;

// api context store
export type APIContextStore = {};

// promise or not a promise
export type MaybePromise<T> = T | Promise<T>;

/**
 * from trpc
 */

export type ActionErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "UNPROCESSABLE_CONTENT"
  | "TOO_MANY_REQUESTS"
  | "CLIENT_CLOSED_REQUEST"
  | "INTERNAL_SERVER_ERROR";

// Input Schema for actions
export type InputSchema<TAccept extends ServerActionAccept> =
  TAccept extends "form" ? z.AnyZodObject | z.ZodType<FormData> : z.ZodType;

// Output Schema for actions
export type SafeResult<TInput extends ErrorInferenceObject, TOutput> =
  | {
      data: TOutput;
      error: undefined;
    }
  | {
      data: undefined;
      error: ServerActionError<TInput>;
    };

// Action type
export type DefinedSeverAction<
  TAccept extends ServerActionAccept,
  TInputSchema extends InputSchema<TAccept> | undefined,
  TOutput
> = TInputSchema extends z.ZodType
  ? (
      input: TAccept extends "form" ? FormData : z.input<TInputSchema>
    ) => Promise<Awaited<TOutput>> & {
      safe: (
        input: TAccept extends "form" ? FormData : z.input<TInputSchema>
      ) => Promise<
        SafeResult<
          z.input<TInputSchema> extends ErrorInferenceObject
            ? z.input<TInputSchema>
            : ErrorInferenceObject,
          Awaited<TOutput>
        >
      >;
    }
  : () => Promise<SafeResult<never, Awaited<TOutput>>>;

// handler
export type ActionHandler<TInputSchema, TOutput> =
  TInputSchema extends z.ZodType
    ? (
        input: z.input<TInputSchema>,
        context: APIContextStore
      ) => MaybePromise<TOutput>
    : (input: any, context: APIContextStore) => MaybePromise<TOutput>;
