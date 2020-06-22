import test, {ExecutionContext} from "ava";
import createEvent from "@serverless/event-mocks";
import * as topUA from "top-user-agents/index.json";
import * as crawler from "crawler-user-agents";
import {normalizeLambdaEvent} from "../lib/normalize-lambda-event";
import {blockBots} from "../lib/block-bots";

const handler = async ({headers}: any) => ({
  headers,
  statusCode: 200,
  body: "Ok!",
});

const func = normalizeLambdaEvent(blockBots(handler));
const bots = getRandom(crawler, 10);
const goodUA = getRandom(topUA, 10);

test("Block bots", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {body: ""} as any);
  for (const bot of bots) {
    event.headers["User-Agent"] = bot;
    await t.throwsAsync(() => func(event));
  }
});

test("Don't block good UA", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {body: ""} as any);
  for (const ua of goodUA) {
    event.headers["User-Agent"] = ua;
    await t.notThrowsAsync(() => func(event));
  }
});

// from https://stackoverflow.com/a/19270021/3484824
function getRandom(arr: unknown[], n: number) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}
