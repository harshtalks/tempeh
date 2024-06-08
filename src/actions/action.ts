// I want to create a function that will return an object that will return

import { ServerActionError } from "./errors";
import { formServerHandler, jsonServerHandler } from "./handlers";
import {
  ActionHandler,
  DefinedSeverAction,
  InputSchema,
  MaybePromise,
  SafeResult,
  ServerActionAccept,
} from "./types";
import * as z from "zod";
// type for action client

export const createAction = <
  TAccept extends ServerActionAccept,
  TOutput,
  TInputSchema extends InputSchema<TAccept> | undefined = TAccept extends "form"
    ? // If `input` is omitted, default to `FormData` for forms and `any` for JSON.
      z.ZodType<FormData>
    : undefined
>({
  inputSchema,
  accept,
  handler,
}: {
  inputSchema?: TInputSchema;
  accept?: TAccept;
  handler: ActionHandler<TInputSchema, TOutput>;
}): DefinedSeverAction<TAccept, TInputSchema, TOutput> => {
  const serverHandler =
    accept === "form"
      ? formServerHandler(handler, inputSchema)
      : jsonServerHandler(handler, inputSchema);

  Object.assign(serverHandler, {
    safe: async (unParsedInput: unknown) => {
      return callSafely(() => serverHandler(unParsedInput));
    },
  });
  return serverHandler as DefinedSeverAction<TAccept, TInputSchema, TOutput>;
};

export const callSafely = async <TOutput>(
  handler: () => MaybePromise<TOutput>
): Promise<SafeResult<z.ZodType, Awaited<TOutput>>> => {
  try {
    const data = await handler();
    return { data, error: undefined };
  } catch (e) {
    if (e instanceof ServerActionError) {
      return { data: undefined, error: e };
    }
    return {
      data: undefined,
      error: new ServerActionError({
        message: e instanceof Error ? e.message : "Unknown error",
        code: "INTERNAL_SERVER_ERROR",
      }),
    };
  }
};
