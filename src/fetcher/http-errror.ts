import { httpErrorStatusCodes } from "./status-codes";

export default class HttpResponseError extends Error {
  response: Response;
  metadata: (typeof httpErrorStatusCodes)[keyof typeof httpErrorStatusCodes];

  constructor(
    message: string,
    response: Response,
    metadata: (typeof httpErrorStatusCodes)[keyof typeof httpErrorStatusCodes]
  ) {
    super(message);
    this.response = response;
    this.metadata = metadata;
  }
}
