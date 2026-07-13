import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"
import { parse } from "css-what"
import { test, expect } from "bun:test"

// The active-low "!" prefix must be escaped so it survives the css-select /
// css-what parser instead of throwing "Unmatched selector".
test("preprocessSelector escapes active-low '!' so it stays parseable", () => {
  for (const raw of [".U1 > .!OE", "net.!OE", ".U1 !.OE", "U1!.OE"]) {
    const processed = preprocessSelector(raw)
    expect(processed).toContain("\\!")
    // css-what (used by css-select) must be able to parse the result.
    expect(() => parse(processed)).not.toThrow()
  }
})
