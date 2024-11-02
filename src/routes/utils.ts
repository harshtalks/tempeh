import { ZodSchema } from "zod";
import { FromZodErrorOptions, fromError } from "zod-validation-error";
import { ReadonlyURLSearchParams } from "next/navigation";

// Convert URLSearchParams to object
export function convertURLSearchParamsToObject(
  params: ReadonlyURLSearchParams | null
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

// Parse a value using a Zod schema
export const zodParse = <T extends ZodSchema>(
  zodSchema: T,
  value: unknown,
  options?: FromZodErrorOptions
) => {
  const safeParsed = zodSchema.safeParse(value);
  console.log(safeParsed, value);

  if (!safeParsed.success) {
    throw fromError(safeParsed.error, {
      ...options,
    });
  }

  return safeParsed.data;
};

// Very simple buildUrl function
export function buildUrl({
  base,
  path,
}: {
  base: string;
  path: string;
}): string {
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (base === "/") {
    return cleanPath;
  }

  if (base.startsWith("http") || base.startsWith("//")) {
    return `${cleanBase}${cleanPath}`;
  }

  if (base.startsWith("/")) {
    return `${cleanBase}${cleanPath}`;
  }

  return `/${cleanBase}${cleanPath}`;
}
