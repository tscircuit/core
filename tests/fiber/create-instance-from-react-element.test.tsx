import { it, expect } from "bun:test"
import { Resistor } from "lib/components"
import "lib/register-catalogue"

import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"

it("should be able to get ports from react footprint definition", () => {
  const subtree = createInstanceFromReactElement(
    <resistor resistance="10k" name="R1" />,
  )

  expect(subtree).toBeInstanceOf(Resistor)
})
