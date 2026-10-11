import { expect, test } from "bun:test"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent/PrimitiveComponent"
import { z } from "zod"

const fixtureSchema = z.object({ setting: z.unknown().optional() })
class InheritanceFixture extends PrimitiveComponent {
  get config() {
    return { componentName: "inheritancefixture", zodProps: fixtureSchema }
  }
}

test("undefined properties inherit without losing explicit falsy overrides", () => {
  const parent = new InheritanceFixture({ setting: "parent" })
  const middle = new InheritanceFixture({ setting: undefined })
  middle.parent = parent
  const child = new InheritanceFixture({ setting: undefined })
  child.parent = middle
  expect(child.getInheritedProperty("setting")).toBe("parent")
  expect(
    new InheritanceFixture({}).getInheritedProperty("missing"),
  ).toBeUndefined()
  for (const setting of [false, 0, "", null, "child"]) {
    const override = new InheritanceFixture({ setting })
    override.parent = middle
    expect(override.getInheritedProperty("setting")).toBe(setting)
  }
  expect(child._parsedProps).toEqual({ setting: undefined })
  expect(middle._parsedProps).toEqual({ setting: undefined })
})
