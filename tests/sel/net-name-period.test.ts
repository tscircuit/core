import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector";
import { test, expect } from "bun:test";

test("preprocessSelector - dot after net prefix throws", () => {
  expect(() => preprocessSelector("net.VCC.extra")).toThrow(
    'Net names cannot contain a period, try using "sel.net..." to autocomplete with conventional net names, e.g. V3_3',
  );
});
