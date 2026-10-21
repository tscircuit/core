import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("plated hole layers inside a four-layer panel board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel width="28mm" height="16mm" panelizationMethod="none">
      <board width="24mm" height="12mm" layers={4}>
        <pinheader
          name="J1"
          pinCount={2}
          pitch={2.54}
          holeDiameter={1}
          platedDiameter={1.8}
        />
        <pcbnotetext
          text="INNER1: both J1 pins must have copper rings"
          pcbY={3}
          fontSize={0.6}
        />
        <pcbnotetext
          text="Four-layer board inside a native panel"
          pcbY={-3}
          fontSize={0.6}
        />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  // Show only plated holes that actually expose copper on the selected layer.
  const innerLayerView = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type !== "pcb_plated_hole" || element.layers.includes("inner1"),
    )
  await expect(innerLayerView).toMatchPcbSnapshot(import.meta.path, {
    layer: "inner1",
    showPinNumbers: false,
  })

  expect(circuit.db.pcb_plated_hole.list().map((hole) => hole.layers)).toEqual([
    ["top", "bottom"],
    ["top", "bottom"],
  ])
})
