import test, {ExecutionContext} from "ava";
import {stripHtml} from "../lib/strip-html";

test("stripHtml", (t: ExecutionContext) => {
  t.is(stripHtml(""), "");
  t.is(stripHtml("My <strong>Message</strong>"), "My Message");
});
