import { expect, test } from "bun:test"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { runCoreSync } from "lib/effect/core-error"
import { z } from "zod"

test("native tree operations preserve extension overrides, selectors and deferred removal", () => {
  const schema = z.object({ name: z.string().optional() })
  const attachments: string[] = []
  class TestPrimitive extends PrimitiveComponent<typeof schema> {
    get config() {
      return { componentName: "Test", zodProps: schema }
    }
    onAddToParent(parent: PrimitiveComponent) {
      attachments.push(`${parent.name}:${this.name}`)
      super.onAddToParent(parent)
    }
  }
  class CustomContainer extends TestPrimitive {
    add(child: PrimitiveComponent) {
      attachments.push("custom_sync_add")
      super.add(child)
    }
  }
  const parent = new CustomContainer({ name: "parent" })
  const first = new TestPrimitive({ name: "first" })
  expect(parent.selectAll(".first")).toEqual([])
  const addition = parent.addAllEffect([first])
  expect(parent.children).toEqual([])
  runCoreSync(addition)
  expect(attachments).toEqual(["custom_sync_add", "parent:first"])
  const selected = parent.selectOne<TestPrimitive>(".first")
  expect(selected).toBe(first)
  expect(parent.selectAll(".first")).toEqual([first])
  runCoreSync(parent.removeEffect(first))
  expect(parent.selectOne(".first")).toBeNull()
  expect(parent.childrenPendingRemoval).toEqual([first])
  expect(first.shouldBeRemoved).toBe(true)
  const whitespace = Object.assign(new TestPrimitive({}), { __text: "  " })
  runCoreSync(parent.addEffect(whitespace))
  expect(parent.children).toEqual([])
  const stray = Object.assign(new TestPrimitive({}), { __text: "NaNp" })
  expect(() => runCoreSync(parent.addEffect(stray))).toThrow(/evaluated to NaN/)
})
