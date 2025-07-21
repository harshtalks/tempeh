import z from "zod";

const urlSchema = z.url({
  error: (value) => ({
    message: `Oops! It looks like that given "${value}" not a valid URL. Please make sure you've entered a complete web address (like https://example.com).`,
  }),
});

const relativeSchema = z
  .string({
    error: (value) =>
      `"${value}" is not a valid pathname. It should start with a forward slash (/) and contain only allowed characters.`,
  })
  .regex(
    /^\/(?:[a-zA-Z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[a-zA-Z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*\/?$/
  );

// Examples of valid URL: "/"
const slashSchema = z.literal("/");

export const urlOrRelativeUrlSchema = z.union([
  slashSchema,
  relativeSchema,
  urlSchema,
]);

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
export const validPathNameSchema = z.union([slashSchema, relativeSchema]);
