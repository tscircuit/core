import { sel } from "lib/sel";
import { test, expect } from "bun:test";

test("sel-net-generic - custom net names via generics", () => {
  const customSel = sel.net<"CUSTOM1" | "CUSTOM2">();

  expect(customSel.CUSTOM1).toBe("net.CUSTOM1");
  expect(customSel.CUSTOM2).toBe("net.CUSTOM2");

  // @ts-expect-error
  customSel.DOES_NOT_EXIST;
});
