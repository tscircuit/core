import { expect, test } from "bun:test"
import { sel } from "lib/sel"

test("group selectors preserve the group, component and pin names", () => {
  expect(sel.group.G1.R1.pin1).toBe("group.G1 > .R1 > .pin1")
  expect(sel.group.G2.U1.VCC).toBe("group.G2 > .U1 > .VCC")
  expect(sel.subcircuit.S1.U1.pin1).toBe("subcircuit.S1 > .U1 > .pin1")
})
