import test, {ExecutionContext} from "ava";
import {sanitizeHtml} from "../lib/sanitize-html";

test("sanitizeHtml", (t: ExecutionContext) => {
  t.is(sanitizeHtml(""), "");
  t.is(
    sanitizeHtml("   My Message  "),
    "My Message",
    "Strips surrounding whitespace",
  );
  t.is(sanitizeHtml(" <3 My Message  "), "♡ My Message", "Turns <3 into ♡");
  t.is(
    sanitizeHtml(" My     Message  "),
    "My Message",
    "Compresses multiple spaces",
  );
  t.is(
    sanitizeHtml("My <strong>Message</strong>"),
    "My <strong>Message</strong>",
  );
});
