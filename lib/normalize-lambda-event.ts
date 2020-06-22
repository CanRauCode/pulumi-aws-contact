import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {Handler} from "../types";
import {normalizeHeaders} from "./normalize-headers";

export const normalizeLambdaEvent = (handler: Handler) => async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const normalizedEvent = {...event};
  normalizedEvent.headers = normalizeHeaders(event.headers);
  return handler(normalizedEvent);
};
