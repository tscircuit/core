import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("solderjumper bridged props resolve bridged PCB footprints", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="8mm">
      {/* Repro: bridgedPins should add PCB copper bridges for unbridged footprint strings. */}
      <solderjumper
        name="SJ1"
        footprint="solderjumper2"
        bridgedPins={[["1", "2"]]}
        pcbX={-5}
      />
      <solderjumper
        name="SJ2"
        footprint="solderjumper3"
        bridgedPins={[["2", "3"]]}
        pcbX={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
