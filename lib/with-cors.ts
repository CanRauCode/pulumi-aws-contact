//Inspired by https://github.com/expressjs/cors
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";

type CustomOrigin = (origin: string, event: APIGatewayProxyEvent) => boolean;
type AllowOrigin = string | RegExp | (string | RegExp)[] | CustomOrigin;

export type CorsOptions = {
  allowOrigin: AllowOrigin;
  allowMethods?: string[];
  allowHeaders?: string[];
};

type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

const defaultHeaders = {
  "Content-Type": "application/json",
  // always set Vary header
  // https://github.com/rs/cors/issues/10
  // found in https://github.com/koajs/cors/blob/master/index.js#L53
  Vary: "Origin",
};

const isString = (s: any): boolean => typeof s === "string";

const isOriginAllowed = (
  event: APIGatewayProxyEvent,
  origin: string,
  allowOrigin: AllowOrigin,
): boolean => {
  if (Array.isArray(allowOrigin)) {
    const length = allowOrigin.length;
    for (var i = 0; i < length; ++i) {
      if (isOriginAllowed(event, origin, allowOrigin[i])) {
        return true;
      }
    }
    return false;
  }
  if (typeof allowOrigin === "function") {
    return allowOrigin(origin, event);
  } else if (isString(allowOrigin)) {
    return origin === allowOrigin;
  } else if (allowOrigin instanceof RegExp) {
    return allowOrigin.test(origin);
  }
  return false;
};

const configureMethods = (allowMethods?: string | string[]) =>
  Array.isArray(allowMethods)
    ? allowMethods.join(",")
    : !allowMethods
    ? "GET,HEAD,PUT,PATCH,POST,DELETE"
    : allowMethods;

const configureHeaders = (allowHeader?: string | string[]) =>
  Array.isArray(allowHeader)
    ? allowHeader.join(",")
    : !allowHeader
    ? "Content-Type,Accept,Referer,User-Agent,DNT"
    : allowHeader;

export const withCors = (options: CorsOptions) => (handler: Handler) => async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const origin = event.headers.origin;
  const isAllowed = isOriginAllowed(event, origin, options.allowOrigin);

  const headers = {
    ...defaultHeaders,
    "Access-Control-Allow-Origin": isAllowed ? origin : false,
    "Access-Control-Allow-Methods": configureMethods(options.allowMethods),
    "Access-Control-Allow-Headers": configureHeaders(options.allowHeaders),
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      isBase64Encoded: false,
      headers: {
        ...headers,
        "Content-Length": "0",
      },
      // changed back from 204 to 200 based on the info in
      // https://stackoverflow.com/a/46028619/3484824
      // and the comment from Lukas Kalbertodt below
      statusCode: 200,
      body: "",
    };
  }

  const response = await handler(event);
  response.headers = {
    ...headers,
    ...response.headers,
  };
  return response;
};
