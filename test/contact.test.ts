import test, {ExecutionContext} from "ava";
import createEvent from "@serverless/event-mocks";
import {
  contactHandlerFactory,
  sanitize,
  asRequest,
  strings,
  parseAndSanitizeRequest,
  checkEmail,
  checkMessage,
} from "../handlers/contact";

const validContentType = "application/x-www-form-urlencoded";
const invalidContentType = "unsupported";
const responseContentType = "application/json";
const validPayload = [
  `email=${encodeURIComponent("mail@example.com")}`,
  `message=${encodeURIComponent("My Message")}`,
].join("&");

const contactHandler = contactHandlerFactory({
  origin: "www.example.com",
  contactEmail: "contact@domain.com",
});

test("parseAndSanitizeRequest", async (t: ExecutionContext) => {
  const event = {
    headers: {"content-type": validContentType},
    isBase64Encoded: false,
    body: validPayload,
  } as any;
  const body = parseAndSanitizeRequest(event as any);
  t.is(body.subject, strings?.en?.subject);
});

test("asRequest", async (t: ExecutionContext) => {
  const request = asRequest({
    contactEmail: "contact@domain.com",
    body: sanitize({
      email: "example@test.com",
      message: "Test Message",
    } as any),
  });
  t.is(request?.Content?.Simple?.Subject?.Data, strings?.en?.subject);
});

test("sanitize", async (t: ExecutionContext) => {
  t.deepEqual(sanitize({email: "mail"} as any), {
    email: "mail",
    lang: "en",
    subject: strings?.en.subject,
    message: "",
  });
  t.deepEqual(sanitize({} as any), {
    email: "",
    lang: "en",
    subject: strings?.en.subject,
    message: "",
  });
  t.deepEqual(sanitize({message: "message"} as any), {
    email: "",
    lang: "en",
    subject: strings?.en.subject,
    message: "message",
  });
  t.deepEqual(sanitize({subject: "subject"} as any), {
    email: "",
    lang: "en",
    subject: "subject",
    message: "",
  });
});

test("Missing argument email", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    body: `message=${encodeURIComponent("Message")}`,
  } as any);
  event.headers = {"Content-Type": validContentType, Origin: "www.example.com"};
  const response = await contactHandler(event);
  t.is(response.statusCode, 400);
  t.is(response.isBase64Encoded, false);
  t.is(response.headers?.["Content-Type"], responseContentType);
  t.is(response.body, "INVALID_EMAIL");
});

test("Missing argument message", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    body: `email=${encodeURIComponent("mail@example.com")}`,
  } as any);
  event.headers = {"Content-Type": validContentType, Origin: "www.example.com"};
  const request = await contactHandler(event);
  t.is(request.statusCode, 400);
  t.is(request.isBase64Encoded, false);
  t.is(request.headers?.["Content-Type"], responseContentType);
  t.is(request.body, "MISSING_MESSAGE");
});

test("Invalid Request", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    body: validPayload,
  } as any);
  event.headers = {
    "Content-Type": invalidContentType,
    Origin: "www.example.com",
  };
  const response = await t.throwsAsync(() => contactHandler(event));
  t.is(response.message, "UNSUPPORTED_CONTENT_TYPE");
});

test("Valid Request", async (t: ExecutionContext) => {
  const event = createEvent("aws:apiGateway", {
    body: validPayload,
  } as any);
  event.headers = {"Content-Type": validContentType, Origin: "www.example.com"};
  const response = await contactHandler(event);
  t.is(response?.headers?.["Content-Type"], responseContentType);
  t.is(response?.body, "Ok!");
  t.is(response?.statusCode, 200);
  t.is(response?.isBase64Encoded, false);
});

test("Check Message", async (t: ExecutionContext) => {
  t.notThrows(() => checkMessage({message: "Non empty"} as any));
  t.throws(() => checkMessage({message: ""} as any));
  t.throws(() => checkMessage({} as any));
  try {
    checkMessage({} as any);
  } catch (error) {
    t.is(error.statusCode, 400);
    t.is(error.message, "MISSING_MESSAGE");
  }
});

test("Check Mail", async (t: ExecutionContext) => {
  t.notThrows(() => checkEmail({email: "mail@example.com"} as any));
  t.throws(() => checkEmail({email: "Non e-mail"} as any));
  t.throws(() => checkEmail({email: ""} as any));
  t.throws(() => checkEmail({} as any));
  try {
    checkEmail({email: "Non e-mail"} as any);
  } catch (error) {
    t.is(error.statusCode, 400);
    t.is(error.message, "INVALID_EMAIL");
  }
});
