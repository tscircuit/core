import { test, expect } from "bun:test"
import { Circuit } from "lib"

// Construct a fake React element from an older React version
const foreignElm = {
  $$typeof: Symbol.for("react.element"),
  type: "group",
  key: null,
  props: {},
  _owner: null,
  _store: {},
} as any

test("throws error when React element version mismatches", () => {
  const circuit = new Circuit()
  expect(() => circuit.add(foreignElm)).toThrowError(
    /Multiple versions of React detected/,
  )
})
