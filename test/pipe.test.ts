import test, {ExecutionContext} from "ava";
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import createEvent from "@serverless/event-mocks";
import {Handler} from "../types";
import {pipe} from "../lib/pipe";

type ev = APIGatewayProxyEvent;
type rs = APIGatewayProxyResult;

test("Pipes functions in the correct order", async (t: ExecutionContext) => {
  const fn1 = (val: string) => `fn1(${val})`;
  const fn2 = (val: string) => `fn2(${val})`;
  const fn3 = (val: string) => `fn3(${val})`;

  const pipedFunction = pipe(fn1, fn2, fn3);
  t.is(pipedFunction("inner"), "fn3(fn2(fn1(inner)))");
});

const middleware1 = (handler: Handler) => async (event: ev): Promise<rs> => {
  event.headers.middlewares = `${event.headers.middlewares}middleware1`;
  return handler(event);
};
const middleware2 = (handler: Handler) => async (event: ev): Promise<rs> => {
  event.headers.middlewares = `${event.headers.middlewares}middleware2`;
  return handler(event);
};
const middleware3 = (handler: Handler) => async (event: ev): Promise<rs> => {
  event.headers.middlewares = `${event.headers.middlewares}middleware3`;
  return handler(event);
};
const handler = async ({headers}: ev): Promise<rs> => {
  return {headers, statusCode: 200, body: "handler"};
};

const composedHandlers = pipe(middleware1, middleware2, middleware3);

test("Pipes middlewares correctly", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", null as any);
  event.headers.middlewares = "";
  const {headers} = await composedHandlers(handler)(event);
  t.is(headers?.middlewares, "middleware3middleware2middleware1");
});
