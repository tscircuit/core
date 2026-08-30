import { expect, test } from "bun:test"
import { AssemblyScreen } from "lib/components"
import { isAssemblyDeviceContainer } from "lib/components/base-components/is-assembly-device-container"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { assembly } from "lib/namespaced-elements"
import "lib/register-catalogue"

test("creates a namespaced assembly screen", () => {
  const instance = createInstanceFromReactElement(
    <assembly.screen
      name="SCREEN"
      connectsTo=".B1 .J1"
      width="2.3in"
      height="1.8in"
    />,
  )

  expect(instance).toBeInstanceOf(AssemblyScreen)
  expect(isAssemblyDeviceContainer(instance)).toBe(true)
})
