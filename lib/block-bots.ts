import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import * as isbot from "isbot";
import {Handler} from "../types";
import {throwError} from "./errors";

export const blockBots = (handler: Handler) => async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const ua = event.headers?.["user-agent"];
  if (isbot(ua)) throwError("NO_BOTS_ALLOWED", 401);
  return handler(event);
};
