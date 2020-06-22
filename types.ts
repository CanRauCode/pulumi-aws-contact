import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";

export type Handler = (
  event: APIGatewayProxyEvent,
) => Promise<APIGatewayProxyResult>;

export type Headers = {[key: string]: string};

export type ContactHandlerConfig = {contactEmail: string};

export type Body = {
  email: string;
  subject: string;
  message: string;
  lang: string;
};
