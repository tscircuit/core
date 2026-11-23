import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bottom-side group flips mixed-side components, positions and rotations", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm" schematicDisabled routingDisabled>
      <group name="G1" pcbX={3} pcbY={-2} layer="bottom">
        <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0603"
          pcbX={5}
          pcbY={2}
          pcbRotation={90}
        />
        <capacitor
          name="C2"
          capacitance="1nF"
          footprint="0603"
          layer="bottom"
          pcbX={-4}
          pcbY={-3}
          pcbRotation={180}
        />
      </group>
    </board>,
  )

  circuit.render()

  const sourceNames = new Map(
    circuit.db.source_component
      .list()
      .map((source) => [source.source_component_id, source.name]),
  )
  const components = Object.fromEntries(
    circuit.db.pcb_component
      .list()
      .map((pcb) => [sourceNames.get(pcb.source_component_id), pcb]),
  )

  expect(components.U1.layer).toBe("bottom")
  expect(components.U1.center.x).toBeCloseTo(3)
  expect(components.U1.center.y).toBeCloseTo(-2)
  expect(components.U1.rotation % 360).toBeCloseTo(0)

  expect(components.C1.layer).toBe("bottom")
  expect(components.C1.center.x).toBeCloseTo(-2)
  expect(components.C1.center.y).toBeCloseTo(0)
  expect(components.C1.rotation % 360).toBeCloseTo(270)

  expect(components.C2.layer).toBe("top")
  expect(components.C2.center.x).toBeCloseTo(7)
  expect(components.C2.center.y).toBeCloseTo(-5)
  expect(components.C2.rotation % 360).toBeCloseTo(180)

  const pads = circuit.db.pcb_smtpad.list()
  expect(
    pads
      .filter((pad) => pad.pcb_component_id === components.C1.pcb_component_id)
      .map((pad) => pad.layer),
  ).toEqual(["bottom", "bottom"])
  expect(
    pads
      .filter((pad) => pad.pcb_component_id === components.C2.pcb_component_id)
      .map((pad) => pad.layer),
  ).toEqual(["top", "top"])
})
