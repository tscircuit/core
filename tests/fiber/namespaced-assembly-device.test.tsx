import { expect, test } from "bun:test"
import { AssemblyDevice } from "lib/components"
import { isAssemblyDeviceContainer } from "lib/components/base-components/is-assembly-device-container"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { assembly } from "lib/namespaced-elements"
import "lib/register-catalogue"

test("creates a namespaced assembly device container", () => {
  const instance = createInstanceFromReactElement(
    <assembly.device name="controller">
      <board name="B1" width="20mm" height="10mm" />
    </assembly.device>,
  )

  expect(instance).toBeInstanceOf(AssemblyDevice)
  expect(isAssemblyDeviceContainer(instance)).toBe(true)
})
