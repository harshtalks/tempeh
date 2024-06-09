import { ServerActionError } from "../../dist";

export * from "./action";
export * from "./types";
export * from "./errors";

throw new ServerActionError({
  message: "hi",
  code: "CONFLICT",
});
