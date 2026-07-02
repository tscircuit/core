import { test, expect } from "bun:test"
import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"

test("preprocessSelector escapes '+' inside pin/class tokens", () => {
  // A '+' following identifier characters would otherwise be treated by
  // css-select as an adjacent-sibling combinator, so ".PUL+" could never match
  // a port literally named "PUL+" (common on stepper drivers: PUL+, DIR+, ENA+).
  expect(preprocessSelector(".DRIVER > .PUL+")).toBe(".DRIVER > .PUL\\+")

  // Shorthand "Name.pin+" is normalized and the '+' is preserved + escaped.
  expect(preprocessSelector("DRIVER.PUL+")).toBe(".DRIVER > .PUL\\+")
  expect(preprocessSelector("SERVO2.V+")).toBe(".SERVO2 > .V\\+")

  // A leading '+' already parses as part of the identifier, so it is left as-is.
  expect(preprocessSelector(".U13 > .+INA")).toBe(".U13 > .+INA")

  // '-' is a valid CSS identifier character and needs no escaping.
  expect(preprocessSelector(".PUL-")).toBe(".PUL-")

  // Selectors without '+' are untouched.
  expect(preprocessSelector(".DRIVER > .PUL")).toBe(".DRIVER > .PUL")
  expect(preprocessSelector("R1.pin1")).toBe(".R1 > .pin1")
})
