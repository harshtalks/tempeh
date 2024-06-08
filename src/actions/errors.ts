// export error

import { ActionErrorCode, ErrorInferenceObject } from "./types";
import * as z from "zod";
import { codeToStatusMap, statusToCodeMap } from "./utils";

export class ServerActionError<
  T extends ErrorInferenceObject = ErrorInferenceObject
> extends Error {
  // states
  type = "SERVER_ACTION_ERROR";
  status = 500;
  code: ActionErrorCode = "INTERNAL_SERVER_ERROR";
  public constructor(params: {
    message?: string;
    code: ActionErrorCode;
    stack?: string;
  }) {
    super(params.message);
    this.code = params.code;
    this.status = ServerActionError.codeToStatus(params.code);
    if (params.stack) this.stack = params.stack;
  }

  static codeToStatus(code: ActionErrorCode): number {
    return codeToStatusMap[code];
  }

  static statusToCode(status: number): ActionErrorCode {
    return statusToCodeMap[status] ?? "INTERNAL_SERVER_ERROR";
  }
}

export class ServerActionInputError<
  T extends ErrorInferenceObject = ErrorInferenceObject
> extends ServerActionError {
  type: "SERVER_ACTION_INPUT_ERROR" = "SERVER_ACTION_INPUT_ERROR";
  issues: z.ZodIssue[];
  fields: z.ZodError<T>["formErrors"]["fieldErrors"];

  constructor(issues: z.ZodIssue[]) {
    super({
      message: `Failed to validate: ${JSON.stringify(issues, null, 2)}`,
      code: "BAD_REQUEST",
    });
    this.issues = issues;
    this.fields = {};

    for (const issue of issues) {
      if (issue.path.length > 0) {
        const key = issue.path[0].toString() as keyof typeof this.fields;
        this.fields[key] ??= [];
        this.fields[key]?.push(issue.message);
      }
    }
  }
}

export const isInputError = <T extends ErrorInferenceObject>(
  error?: ServerActionError<T>
): error is ServerActionInputError<T> => {
  return error instanceof ServerActionInputError;
};
