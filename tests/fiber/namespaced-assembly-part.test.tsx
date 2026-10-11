import { expect, test } from "bun:test"
import { assembly } from "lib"
import { AssemblyPart } from "lib/components"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"

test("assembly.part instantiates the generic part and validates its props", () => {
  const instance = createInstanceFromReactElement(
    <assembly.part name=" bracket " displayName="Mounting bracket" />,
  )
  expect(instance).toBeInstanceOf(AssemblyPart)
  expect(instance._parsedProps).toEqual({
    name: "bracket",
    displayName: "Mounting bracket",
  })
  for (const props of [
    {},
    { name: " " },
    { name: "part", model: "nema17", modelUrl: "part.glb" },
    { name: "part", modelUrl: "part.glb", cadModel: null },
  ]) {
    // @ts-expect-error Deliberately invalid author input must fail at runtime.
    expect(() => new AssemblyPart(props)).toThrow()
  }
})
