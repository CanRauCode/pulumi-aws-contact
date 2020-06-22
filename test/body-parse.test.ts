import test, {ExecutionContext} from "ava";
import createEvent from "@serverless/event-mocks";
import {bodyParse} from "../lib/body-parse";

test("Parse json non-base64 Request", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    isBase64Encoded: false,
    body: JSON.stringify({
      email: "mail@example.com",
      message: "Non-encoded Message",
    }),
  } as any);
  event.headers["content-type"] = "application/json";
  const nonEncoded = bodyParse(event);
  t.is(nonEncoded.email, "mail@example.com");
  t.is(nonEncoded.message, "Non-encoded Message");
});

test("Parse json base64 Request", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    isBase64Encoded: true,
    body: Buffer.from(
      JSON.stringify({email: "mail@example.com", message: "Encoded Message"}),
    ).toString("base64"),
  } as any);
  event.headers["content-type"] = "application/json";
  const nonEncoded = bodyParse(event);
  t.is(nonEncoded.email, "mail@example.com");
  t.is(nonEncoded.message, "Encoded Message");
});

test("Parse encoded non-base64 Request", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    isBase64Encoded: false,
    body: `email=${encodeURIComponent(
      "mail@example.com",
    )}&message=${encodeURIComponent("Non-encoded Message")}`,
  } as any);
  event.headers["content-type"] = "application/x-www-form-urlencoded";
  const nonEncoded = bodyParse(event);
  t.is(nonEncoded.email, "mail@example.com");
  t.is(nonEncoded.message, "Non-encoded Message");
});

test("Parse encoded base64 Request", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    isBase64Encoded: true,
    body: Buffer.from(
      `email=${encodeURIComponent(
        "mail@example.com",
      )}&message=${encodeURIComponent("Encoded Message")}`,
      "ascii",
    ).toString("base64"),
  } as any);
  event.headers["content-type"] = "application/x-www-form-urlencoded";
  const encoded = bodyParse(event);
  t.is(encoded.email, "mail@example.com");
  t.is(encoded.message, "Encoded Message");
});
