import * as qs from "querystring";
import * as awsx from "@pulumi/awsx";
import {Body} from "../types";
import {throwError} from "./errors";

type KV = {[key: string]: string};

export const bodyParse = (event: awsx.apigateway.Request) => {
  const contentType = event.headers["content-type"];
  if (contentType === "application/json") {
    return JSON.parse(
      event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64").toString("utf-8")
        : event.body ?? "{}",
    );
  } else if (contentType === "application/x-www-form-urlencoded") {
    const body: string = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf-8")
      : event.body ?? "";
    const encodedBody: KV = qs.parse(body) as KV;
    return encodedBody as Body;
  }

  throwError("UNSUPPORTED_CONTENT_TYPE", 400);
};
