import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb rotation top-bottom resistor example with dual 3d views", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={12} height={4}>
      <resistor name="R1" pcbX={-5} footprint="0402" resistance="1k" />
      <resistor
        name="R2"
        pcbX={5}
        footprint="0402"
        resistance="1k"
        pcbRotation={90}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.getCircuitJson()).toMatch3dSnapshot(
    import.meta.path.replace("-rotation", "-rotation-top"),
  )
  expect(circuit.getCircuitJson()).toMatch3dSnapshot(
    import.meta.path.replace("-rotation", "-rotation-bottom"),
    {
      cameraPreset: "bottom_angled",
    },
  )
})
