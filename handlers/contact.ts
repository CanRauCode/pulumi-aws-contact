import {SESV2} from "aws-sdk";
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import isEmail from "validator/lib/isEmail";
import {Body, ContactHandlerConfig} from "../types";
import {sanitizeHtml} from "../lib/sanitize-html";
import {stripHtml} from "../lib/strip-html";
import {makeResponse} from "../lib/make-response";
import {bodyParse} from "../lib/body-parse";
import {withCors} from "../lib/with-cors";
import {throwError} from "../lib/errors";
import {pipe} from "../lib/pipe";
import {normalizeLambdaEvent} from "../lib/normalize-lambda-event";
import {emailBlocklist} from "../blocklist-email";

const isTest = process?.env?.NODE_ENV === "test";

export const strings: {[languageCode: string]: {subject: string}} = {
  en: {subject: "Contact request"},
  de: {subject: "Kontaktanfrage"},
};

type rq = APIGatewayProxyEvent;
type rp = APIGatewayProxyResult;
type eq = SESV2.SendEmailRequest;

const contactHandler = ({contactEmail}: ContactHandlerConfig) => async (
  event: rq,
): Promise<rp> => {
  try {
    await send({contactEmail, body: parseAndSanitizeRequest(event)});
    return makeResponse(200, "Ok!");
  } catch (error) {
    if (!isTest) console.log(error);
    return makeResponse(error.statusCode ?? 500, error.message);
  }
};

export const parseAndSanitizeRequest = (event: rq): Body => {
  return validate(sanitize(bodyParse(event)));
};

export const checkMessage = (body: Body) => {
  if (!body.message) throwError("MISSING_MESSAGE", 400, body);
};

export const checkEmail = (body: Body) => {
  if (!isEmail(body.email) || emailBlocklist.includes(body.email)) {
    throwError("INVALID_EMAIL", 400, body);
  }
};

export const sanitize = (body: Body): Body => {
  const lang = body.lang ? `${body.lang}`.trim() : "en";
  return {
    email: body.email ? `${body.email}`.trim() : "",
    message: body.message ? sanitizeHtml(`${body.message}`) : "",
    lang,
    subject: body.subject
      ? sanitizeHtml(`${body.subject}`)
      : strings[lang].subject,
  };
};

type SendConfig = {body: Body; contactEmail: string};

const send = ({body, contactEmail}: SendConfig) => {
  if (isTest) return;
  return new SESV2({apiVersion: "2019-09-27"})
    .sendEmail(asRequest({body, contactEmail}))
    .promise();
};

export const asRequest = ({body, contactEmail}: SendConfig): eq => {
  return {
    FromEmailAddress: contactEmail,
    Destination: {
      ToAddresses: [contactEmail],
    },
    ReplyToAddresses: [body.email],
    Content: {
      Simple: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: body.message,
          },
          Text: {
            Charset: "UTF-8",
            Data: stripHtml(body.message),
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: body.subject,
        },
      },
    },
  };
};

const validate = (body: Body): Body => {
  checkMessage(body);
  checkEmail(body);
  return body;
};

export const contactHandlerFactory = ({
  origin,
  ...config
}: {origin: string} & ContactHandlerConfig) => {
  const middlewares = pipe(
    withCors({allowOrigin: origin, allowMethods: ["OPTIONS", "POST"]}),
    normalizeLambdaEvent,
  );
  return middlewares(contactHandler(config));
};
