import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblySubassembly } from "lib/components"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import "lib/register-catalogue"

test("both assembly spellings instantiate the same canonical class", () => {
  for (const Component of [assembly.subassembly, assembly.cadassembly]) {
    const instance = createInstanceFromReactElement(
      // @ts-expect-error Subassemblies do not support attachment targets.
      <Component name="module" connectsTo=".ignored" />,
    )
    expect(instance).toBeInstanceOf(AssemblySubassembly)
    expect(instance._parsedProps).not.toHaveProperty("connectsTo")
    expect(instance.componentName).toBe("AssemblySubassembly")
  }
})
