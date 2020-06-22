import test, {ExecutionContext} from "ava";
import {APIGatewayProxyEvent} from "aws-lambda";
import createEvent from "@serverless/event-mocks";
import {withCors} from "../lib/with-cors";

type ev = APIGatewayProxyEvent;

test("Passes through with correct Origin header", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    httpMethod: "POST",
    body: `message=${encodeURIComponent("Message")}`,
    headers: {origin: "https://www.example.com"},
  } as any);

  const handler = withCors({allowOrigin: "https://www.example.com"})(
    async (_: ev) => ({
      statusCode: 200,
      body: "Success",
    }),
  );

  const {statusCode, body, headers} = await handler(event);
  t.is(statusCode, 200);
  t.is(body, "Success");
  t.is(headers?.["Access-Control-Allow-Origin"], "https://www.example.com");
  t.is(headers?.Vary, "Origin");
});

test("Invalid Origin header", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    httpMethod: "POST",
    body: `message=${encodeURIComponent("Message")}`,
    headers: {origin: "https://www.wrong.com"},
  } as any);

  const handler = withCors({allowOrigin: "https://www.example.com"})(
    async (_: ev) => ({
      statusCode: 200,
      body: "Success",
    }),
  );

  const {statusCode, body, headers} = await handler(event);
  t.is(statusCode, 200);
  t.is(body, "Success");
  t.is(headers?.["Access-Control-Allow-Origin"], false);
  t.is(headers?.Vary, "Origin");
});

test("Accepts function as origin option", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    httpMethod: "POST",
    body: `message=${encodeURIComponent("Message")}`,
    headers: {origin: "https://www.example.com"},
  } as any);

  const handler = withCors({allowOrigin: (origin, event) => true})(
    async (_: ev) => ({
      statusCode: 200,
      body: "Success",
    }),
  );

  const {statusCode, body, headers} = await handler(event);
  t.is(statusCode, 200);
  t.is(body, "Success");
  t.is(headers?.["Access-Control-Allow-Origin"], "https://www.example.com");
  t.is(headers?.Vary, "Origin");
});

test("Accepts array as origin option", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    httpMethod: "POST",
    body: `message=${encodeURIComponent("Message")}`,
    headers: {origin: "https://www.example.com"},
  } as any);

  const handler = withCors({
    allowOrigin: ["https://www.example.com", "https://www.sample.com"],
  })(async (_: ev) => ({
    statusCode: 200,
    body: "Success",
  }));

  const {statusCode, body, headers} = await handler(event);
  t.is(statusCode, 200);
  t.is(body, "Success");
  t.is(headers?.["Access-Control-Allow-Origin"], "https://www.example.com");
  t.is(headers?.Vary, "Origin");
});

test("Array of invalid origins", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    httpMethod: "POST",
    body: `message=${encodeURIComponent("Message")}`,
    headers: {origin: "https://www.wrong.com"},
  } as any);

  const handler = withCors({
    allowOrigin: ["https://www.example.com", "https://www.sample.com"],
  })(async (_: ev) => ({
    statusCode: 200,
    body: "Success",
  }));

  const {statusCode, body, headers} = await handler(event);
  t.is(statusCode, 200);
  t.is(body, "Success");
  t.is(headers?.["Access-Control-Allow-Origin"], false);
  t.is(headers?.Vary, "Origin");
});

test("Accepts regex as origin option", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    httpMethod: "POST",
    body: `message=${encodeURIComponent("Message")}`,
    headers: {origin: "https://www.example.com"},
  } as any);

  const handler = withCors({allowOrigin: /example.com$/})(async (_: ev) => ({
    statusCode: 200,
    body: "Success",
  }));

  const {statusCode, body, headers} = await handler(event);
  t.is(statusCode, 200);
  t.is(body, "Success");
  t.is(headers?.["Access-Control-Allow-Origin"], "https://www.example.com");
  t.is(headers?.Vary, "Origin");
});

test("Successful OPTIONS request", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    httpMethod: "OPTIONS",
    body: `message=${encodeURIComponent("Message")}`,
    headers: {origin: "https://www.example.com"},
  } as any);

  const handler = withCors({allowOrigin: "https://www.example.com"})(
    async (_: ev) => ({
      statusCode: 200,
      body: "Success",
    }),
  );

  const {statusCode, body, headers} = await handler(event);
  t.is(statusCode, 200);
  t.is(body, "");
  t.is(headers?.["Access-Control-Allow-Origin"], "https://www.example.com");
  t.is(headers?.["Content-Length"], "0");
  t.is(headers?.Vary, "Origin");
});

// don't block based on origin
// test("Fails if no Origin header", async (t: ExecutionContext) => {
//   const event = createEvent("aws:apiGateway", {
//     httpMethod: "POST",
//     body: `message=${encodeURIComponent("Message")}`,
//   } as any);
//   console.log(event.headers);

//   const handler = withCors({allowOrigin: "https://www.example.com"})(
//     async (_: ev) => ({
//       statusCode: 200,
//       body: "Who wins?",
//     }),
//   );

//   const {statusCode, headers, body} = await handler(event);
//   t.is(statusCode, 400);
//   t.is(headers?.Vary, "Origin");
//   t.is(body, "");
// });
