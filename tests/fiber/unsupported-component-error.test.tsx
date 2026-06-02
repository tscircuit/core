import { it, expect } from "bun:test"
import "lib/register-catalogue"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"

it("throws a helpful error for unknown components", () => {
  // @ts-expect-error intentionally exercising unsupported DOM/component tags
  const unsupportedHeader = <header />

  expect(() => createInstanceFromReactElement(unsupportedHeader)).toThrow(
    /built-in-elements/,
  )
})
