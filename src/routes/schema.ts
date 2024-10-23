import { z } from "zod";

const urlSchema = z.union([
  z
    .string()
    .url()
    .refine(
      (val) => true,
      (value) => ({
        message: `Oops! It looks like that given "${value}" not a valid URL. Please make sure you've entered a complete web address (like https://example.com).`,
      }),
    ),
  z
    .string()
    .regex(/^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*$/)
    .refine(
      (val) => true,
      (value) => ({
        message: `Hmm, "${value}" doesn't seem to be a valid relative URL. Make sure it starts with a forward slash (/) and only contains allowed characters.`,
      }),
    ),
]);

export const urlOrRelativeUrlSchema = urlSchema;

// Examples of valid pathnames:
// "/path/to/resource"
// "/users/123"
// "/search?q=example"
// "/products/electronics/phones"
// "/api/v1/data.json"

// Examples of invalid pathnames:
// "invalid" (doesn't start with /)
// "/invalid?" (ends with a lone ?)
// "/invalid#fragment" (contains #)
// "http://example.com/path" (full URL, not just pathname)

export const validPathNameSchema = z
  .string()
  .regex(
    /^\/(?:[a-zA-Z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[a-zA-Z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*\/?$/,
  )
  .refine(
    (val) => true,
    (value) => ({
      message: `"${value}" is not a valid pathname. It should start with a forward slash (/) and contain only allowed characters.`,
    }),
  );
