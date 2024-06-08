// json server handler

import { ServerActionError, ServerActionInputError } from "./errors";
import { ActionHandler, InputSchema } from "./types";
import * as z from "zod";

export const jsonServerHandler = <
  TOutput,
  TInputSchema extends InputSchema<"json">
>(
  handler: ActionHandler<TInputSchema, TOutput>,
  inputSchema?: TInputSchema
) => {
  return async (unParsedInput: unknown): Promise<Awaited<TOutput>> => {
    // if input is type of FormData

    if (unParsedInput instanceof FormData) {
      throw new ServerActionError({
        message: "You can only pass JSON data to this server action",
        code: "UNSUPPORTED_MEDIA_TYPE",
      });
    }

    if (!inputSchema) {
      return await handler(unParsedInput);
    }

    const parsedInput = await inputSchema.safeParseAsync(unParsedInput);

    if (!parsedInput.success) {
      throw new ServerActionInputError(parsedInput.error.issues);
    }

    return await handler(parsedInput.data);
  };
};

export const formServerHandler = <
  TOutput,
  TInputSchema extends InputSchema<"form">
>(
  handler: ActionHandler<TInputSchema, TOutput>,
  inputSchema?: TInputSchema
) => {
  return async (unParsedInput: unknown): Promise<Awaited<TOutput>> => {
    if (!(unParsedInput instanceof FormData)) {
      throw new ServerActionError({
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "you can only pass form data to this server action",
      });
    }

    if (!(inputSchema instanceof z.ZodObject))
      return await handler(unParsedInput);

    const parsed = await inputSchema.safeParseAsync(
      formDataToObject(unParsedInput, inputSchema)
    );

    if (!parsed.success) {
      throw new ServerActionInputError(parsed.error.issues);
    }

    return await handler(parsed.data);
  };
};

/** Transform form data to an object based on a Zod schema. */
export const formDataToObject = <T extends z.AnyZodObject>(
  formData: FormData,
  schema: T
): Record<string, unknown> => {
  const obj: Record<string, unknown> = {};
  for (const [key, baseValidator] of Object.entries(schema.shape)) {
    let validator = baseValidator;
    if (
      baseValidator instanceof z.ZodOptional ||
      baseValidator instanceof z.ZodNullable
    ) {
      validator = baseValidator._def.innerType;
    }
    if (validator instanceof z.ZodBoolean) {
      obj[key] = formData.has(key);
    } else if (validator instanceof z.ZodArray) {
      obj[key] = handleFormDataGetAll(key, formData, validator);
    } else {
      obj[key] = handleFormDataGet(key, formData, validator, baseValidator);
    }
  }
  return obj;
};

const handleFormDataGetAll = (
  key: string,
  formData: FormData,
  validator: z.ZodArray<z.ZodUnknown>
) => {
  const entries = Array.from(formData.getAll(key));
  const elementValidator = validator._def.type;
  if (elementValidator instanceof z.ZodNumber) {
    return entries.map(Number);
  } else if (elementValidator instanceof z.ZodBoolean) {
    return entries.map(Boolean);
  }
  return entries;
};

const handleFormDataGet = (
  key: string,
  formData: FormData,
  validator: unknown,
  baseValidator: unknown
) => {
  const value = formData.get(key);
  if (!value) {
    return baseValidator instanceof z.ZodOptional ? undefined : null;
  }
  return validator instanceof z.ZodNumber ? Number(value) : value;
};
