import { ZodSchema } from "zod";
import { FromZodErrorOptions, fromZodError } from "zod-validation-error";
import { ReadonlyURLSearchParams } from "./next-types";

export function convertURLSearchParamsToObject(
  params: ReadonlyURLSearchParams | null,
): Record<string, string | string[]> {
  if (!params) {
    return {};
  }

  const obj: Record<string, string | string[]> = {};
  for (const [key, value] of params.entries()) {
    if (params.getAll(key).length > 1) {
      obj[key] = params.getAll(key);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

export const zodParse = <T extends ZodSchema>(
  zodSchema: T,
  value: unknown,
  options?: FromZodErrorOptions,
) => {
  const safeParsed = zodSchema.safeParse(value);

  if (!safeParsed.success) {
    throw fromZodError(safeParsed.error, options);
  }

  return safeParsed.data;
};
