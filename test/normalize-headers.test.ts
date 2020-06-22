import test, {ExecutionContext} from "ava";
import {normalizeHeaders} from "../lib/normalize-headers";

test("Pipes in the correct order", async (t: ExecutionContext) => {
  const headers = normalizeHeaders({"Content-Type": "Application/Json"});
  t.is(headers["content-type"], "application/json");
});
