import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import c1526234Footprint from "./assets/c1526234-footprint.json"

const incorrectU1Bounds = {
  center: { x: 7.3, y: -18.9949984 },
  width: 11.119993,
  height: 11.4398298,
}

test("repro: rotated C1526234 has incorrect component bounds", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({
          footprintCircuitJson: c1526234Footprint as AnyCircuitElement[],
        }),
      },
    },
  })

  circuit.add(
    <board
      outline={[
        { x: 1, y: -29 },
        { x: 19, y: -29 },
        { x: 19, y: -9 },
        { x: 1, y: -9 },
      ]}
      routingDisabled
    >
      <chip
        name="U1"
        footprint="jlcpcb:C1526234"
        pcbX={7.3}
        pcbY={-20.1}
        pcbRotation={-90}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={13}
        pcbY={-21.2}
      />
      <pcbnoterect
        pcbX={incorrectU1Bounds.center.x}
        pcbY={incorrectU1Bounds.center.y}
        width={incorrectU1Bounds.width}
        height={incorrectU1Bounds.height}
        color="#ef4444"
        strokeWidth="0.12mm"
        isStrokeDashed
      />
      <pcbnotetext
        text="RED = incorrect U1 bounds overlap C2 by 0.64mm"
        pcbX={10}
        pcbY={-10}
        fontSize="0.45mm"
      />
      <pcbnotetext
        text="MAGENTA = actual courtyards are clear by 0.996mm"
        pcbX={10}
        pcbY={-10.75}
        fontSize="0.42mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const u1Source = circuit.db.source_component.getWhere({ name: "U1" })!
  const u1 = circuit.db.pcb_component.getWhere({
    source_component_id: u1Source.source_component_id,
  })!

  expect(u1.width).toBeCloseTo(incorrectU1Bounds.width, 6)
  expect(u1.height).toBeCloseTo(incorrectU1Bounds.height, 6)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
