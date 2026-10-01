import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

test("bulk native attachment retains atomic writes beyond the Effect yield budget", async () => {
  class TestPrimitive extends PrimitiveComponent {}
  const parent = new TestPrimitive({})
  const children = Array.from(
    { length: 300 },
    (_, childNumber) => new TestPrimitive({ name: `child_${childNumber}` }),
  )
  let succeeded = false
  const completed = new Promise<void>((resolve) => {
    Effect.runCallback(parent.addAllEffect(children), {
      onExit(exit) {
        succeeded = Exit.isSuccess(exit)
        resolve()
      },
    })
  })
  // Completion notification may yield after context restoration; writes may not.
  expect(parent.children).toEqual(children)
  expect(children.every((child) => child.parent === parent)).toBe(true)
  await completed
  expect(succeeded).toBe(true)
  const synchronousParent = new TestPrimitive({})
  synchronousParent.addAll(children)
  expect(synchronousParent.children).toEqual(children)
  expect(children.every((child) => child.parent === synchronousParent)).toBe(
    true,
  )
})
