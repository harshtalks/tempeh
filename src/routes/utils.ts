import { ZodSchema, number, object } from "zod";
import { FromZodErrorOptions, fromZodError } from "zod-validation-error";
import { ReadonlyURLSearchParams } from "next/navigation";
import routeBuilder from "./route-builder";

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

export const zodParse = <T extends ZodSchema>(
  zodSchema: T,
  value: unknown,
  options?: FromZodErrorOptions
) => {
  const safeParsed = zodSchema.safeParse(value);
  console.log(safeParsed, value);

  if (!safeParsed.success) {
    throw fromZodError(safeParsed.error, {
      ...options,
    });
  }

  return safeParsed.data;
};

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

  if (base.startsWith(".")) {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/";
    const absoluteBase = new URL(base, `http://domain.com${currentPath}`)
      .pathname;
    return `${absoluteBase}${cleanPath}`;
  }

  if (base.startsWith("/")) {
    return `${cleanBase}${cleanPath}`;
  }

  return `/${cleanBase}${cleanPath}`;
}
