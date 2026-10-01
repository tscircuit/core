import { expect, test } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"
import { isActiveRoutingDescendant } from "lib/effect/routing-owner-active"

class RoutingOwner extends Renderable {
  constructor() {
    super({})
  }
}

test("shared batches reject pours below a removed ancestor and detached owners", () => {
  const subcircuit = new RoutingOwner()
  const group = new RoutingOwner()
  const pour = new RoutingOwner()
  group.parent = subcircuit
  pour.parent = group
  expect(
    isActiveRoutingDescendant({ descendant: pour, ancestor: subcircuit }),
  ).toBe(true)
  group.shouldBeRemoved = true
  expect(
    isActiveRoutingDescendant({ descendant: pour, ancestor: subcircuit }),
  ).toBe(false)
  group.shouldBeRemoved = false
  pour.parent = null
  expect(
    isActiveRoutingDescendant({ descendant: pour, ancestor: subcircuit }),
  ).toBe(false)
})
