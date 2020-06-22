import test, {ExecutionContext} from "ava";
import createEvent from "@serverless/event-mocks";
import {normalizeLambdaEvent} from "../lib/normalize-lambda-event";

const handler = async ({headers}: any) => ({
  headers,
  statusCode: 200,
  body: "Ok!",
});

const func = normalizeLambdaEvent(handler);

test("Normalized Request", async (t: ExecutionContext) => {
  const validEvent = createEvent("aws:apiGateway", null as any);
  validEvent.headers = {"Content-Type": "application/x-www-form-urlencoded"};
  const {headers} = await func(validEvent);
  t.is(headers?.["content-type"], "application/x-www-form-urlencoded");
});
