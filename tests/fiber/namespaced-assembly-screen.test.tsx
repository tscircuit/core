import { expect, test } from "bun:test"
import { AssemblyScreen } from "lib/components"
import { isAssemblyDeviceContainer } from "lib/components/base-components/is-assembly-device-container"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { assembly } from "lib/namespaced-elements"
import { ER_OLED096_1_3W_FLEXSCREEN_MODEL } from "tests/assembly/fixtures/er-oled096-1-3w"
import "lib/register-catalogue"

test("creates a namespaced assembly screen", () => {
  const instance = createInstanceFromReactElement(
    <assembly.screen
      name="SCREEN"
      connectsTo=".B1 .J1"
      cadModel={ER_OLED096_1_3W_FLEXSCREEN_MODEL}
    />,
  )

  expect(instance).toBeInstanceOf(AssemblyScreen)
  expect(isAssemblyDeviceContainer(instance)).toBe(true)
})
