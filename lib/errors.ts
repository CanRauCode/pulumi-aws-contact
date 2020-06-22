export const throwError = (
  reason: string,
  statusCode: number = 500,
  eventBody?: {[field: string]: string},
): HttpError => {
  throw new HttpError(reason, statusCode, eventBody);
};

// from https://stackoverflow.com/a/60323233/3484824
export class HttpError {
  constructor(
    message: string,
    statusCode: number = 500,
    eventBody?: {[key: string]: string},
  ) {
    const error = Error(message);

    // set immutable object properties
    Object.defineProperty(error, "name", {
      get() {
        return "HttpError";
      },
    });
    Object.defineProperty(error, "message", {
      get() {
        return message;
      },
    });
    Object.defineProperty(error, "statusCode", {
      get() {
        return statusCode;
      },
    });
    Object.defineProperty(error, "eventBody", {
      get() {
        return eventBody;
      },
    });
    // capture where error occured
    Error.captureStackTrace(error, HttpError);
    return error;
  }
}
