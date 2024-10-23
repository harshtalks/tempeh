import { ZodErrorMap, type ZodIssueCode, z } from "zod";

// Utility function
const makeErrorMap = (messages: {
  [Code in ZodIssueCode]?: (value: unknown) => string;
}): { errorMap: ZodErrorMap } => {
  return {
    errorMap: (issue, ctx) => {
      return {
        message: messages[issue.code]?.(ctx.data) || ctx.defaultError,
      };
    },
  };
};

const urlSchema = z
  .string(
    makeErrorMap({
      invalid_string: (value) =>
        `Oops! It looks like that given "${value}" not a valid URL. Please make sure you've entered a complete web address (like https://example.com).`,
    })
  )
  .url();

const relativeSchema = z
  .string(
    makeErrorMap({
      invalid_string: (value) =>
        `"${value}" is not a valid pathname. It should start with a forward slash (/) and contain only allowed characters.`,
    })
  )
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
