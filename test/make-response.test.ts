import test, {ExecutionContext} from "ava";
import {makeResponse} from "../lib/make-response";

test("Successful response with default headers", async (t: ExecutionContext) => {
  const {statusCode, body, headers} = makeResponse(200, "My Body");
  t.is(statusCode, 200);
  t.is(body, "My Body");
  t.is(headers?.["content-type"], "application/json");
});

test("Successful response with custom headers", async (t: ExecutionContext) => {
  const {statusCode, body, headers} = makeResponse(200, "My Body", {
    "content-type": "application/x-www-form-urlencoded",
    vary: "Origin",
  });
  t.is(statusCode, 200);
  t.is(body, "My Body");
  t.is(headers?.["content-type"], "application/x-www-form-urlencoded");
  t.is(headers?.vary, "Origin");
});
