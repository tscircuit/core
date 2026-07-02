import { it, expect } from "bun:test"
import React from "react"
import "lib/register-catalogue"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"

it("resolves casing-typo component names via a lowercased fallback", () => {
  // A camelCase tag like <powerSource> reaches the reconciler as the string
  // "powerSource", which matches neither the "PowerSource" class key nor the
  // "powersource" alias in the catalogue. It should fall back to a lowercased
  // lookup and resolve to the same component instead of throwing
  // "Unsupported component type".
  const props = { name: "V1", voltage: "5V" }
  const camel = createInstanceFromReactElement(
    React.createElement("powerSource", props),
  )
  const pascal = createInstanceFromReactElement(
    React.createElement("PowerSource", props),
  )
  const lower = createInstanceFromReactElement(
    React.createElement("powersource", props),
  )

  expect(camel.constructor).toBe(lower.constructor)
  expect(pascal.constructor).toBe(lower.constructor)
})
