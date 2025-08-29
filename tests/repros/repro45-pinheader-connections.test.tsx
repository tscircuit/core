import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

export default test("pinheader connections using labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="J1"
        pinCount={3}
        pinLabels={{ pin1: "VCC", pin2: "OUT", pin3: "GND" }}
        connections={{ VCC: "net.VCC", OUT: "net.OUT", GND: "net.GND" }}
      />
    </board>,
  )

  await circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
