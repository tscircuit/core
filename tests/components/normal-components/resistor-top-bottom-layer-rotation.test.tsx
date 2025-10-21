import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistors on top and bottom layers with 45deg rotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        pcbX={-2}
        resistance="1k"
        footprint="0402"
        name="R1"
        layer="top"
        pcbRotation="45deg"
      />
      <resistor
        pcbX={2}
        resistance="1k"
        footprint="0402"
        name="R2"
        layer="bottom"
        pcbRotation="45deg"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatch3dSnapshot(
    import.meta.path.replace("-rotation", "-rotation-top"),
  )
  expect(circuit).toMatch3dSnapshot(
    import.meta.path.replace("-rotation", "-rotation-bottom"),
    {
      cameraPreset: "bottom_angled",
    },
  )
})
