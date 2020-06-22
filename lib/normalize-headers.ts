import {Headers} from "../types";

// from https://stackoverflow.com/a/50483093/3484824
export const normalizeHeaders = (headers: Headers): Headers => {
  let head: Headers = {};
  for (const key in headers) {
    if (headers.hasOwnProperty(key)) {
      head[key.toLowerCase()] = headers[key].toLowerCase();
    }
  }
  return head;
};
