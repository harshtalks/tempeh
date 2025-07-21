import { FromZodErrorOptions, fromError } from "zod-validation-error";
import { ReadonlyURLSearchParams } from "next/navigation";
import { StandardSchemaV1 } from "../standard-schema";
import { ZodSchema } from "zod";

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

export const parseWithPromiseFiltering = <
  T,
  Schema extends StandardSchemaV1<T>
>(
  schema: Schema,
  value: unknown
) => {
  const safeParsed = schema["~standard"].validate(value);

  if (safeParsed instanceof Promise) {
    throw new Error("Promise returned from schema validation");
  }

  return safeParsed;
};

export const zodParse = <T extends ZodSchema>(zodSchema: T, value: unknown) => {
  return zodSchema.parse(value);
};

// Parse a value using a Zod schema
export const schemaParse = <T extends StandardSchemaV1>(
  schema: T,
  value: unknown
) => {
  const safeParsed = parseWithPromiseFiltering(schema, value);

  if (safeParsed.issues) {
    throw safeParsed;
  }

  return safeParsed.value;
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
