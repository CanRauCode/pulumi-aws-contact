import {APIGatewayProxyResult} from "aws-lambda";

// alternative https://github.com/c-bandy/lambda-response-template
export const makeResponse = (
  statusCode: number,
  body: string,
  headers: {[key: string]: any} = {},
): APIGatewayProxyResult => ({
  isBase64Encoded: false,
  headers: {
    "content-type": "application/json",
    ...headers,
  },
  statusCode,
  body,
});
