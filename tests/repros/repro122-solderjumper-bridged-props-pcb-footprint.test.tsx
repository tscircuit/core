import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("solderjumper bridged props resolve bridged PCB footprints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="8mm">
      {/* bridgedPins should create PCB copper bridges even when the footprint string is unbridged. */}
      <solderjumper
        name="SJ1"
        footprint="solderjumper2"
        bridgedPins={[["1", "2"]]}
        pcbX={-3}
      />
      <solderjumper
        name="SJ2"
        footprint="solderjumper3"
        bridgedPins={[["2", "3"]]}
        pcbX={3}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
