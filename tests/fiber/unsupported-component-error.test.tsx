import { it, expect } from "bun:test"
import "lib/register-catalogue"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"

it("throws a helpful error for unknown components", () => {
  expect(() => createInstanceFromReactElement(<header />)).toThrow(
    /built-in-elements/,
  )
})
