import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblySubassembly } from "lib/components"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import "lib/register-catalogue"

test("both assembly spellings instantiate the same canonical class", () => {
  for (const Component of [assembly.subassembly, assembly.cadassembly]) {
    const instance = createInstanceFromReactElement(<Component name="module" />)
    expect(instance).toBeInstanceOf(AssemblySubassembly)
    expect(instance.componentName).toBe("AssemblySubassembly")
  }
})
