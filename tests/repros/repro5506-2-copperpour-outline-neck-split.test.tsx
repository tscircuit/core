import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// https://github.com/tscircuit/core/issues/5506
// An explicit copperpour outline should not be inset by boardEdgeMargin
// (which defaults to clearance) when it is far from the board edge.

test("repro5506: narrow neck in copperpour outline is removed, splitting the pour", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={4}
        connections={{ pin1: "net.GND" }}
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        clearance="0.2mm"
        outline={[
          { x: -4, y: -1 },
          { x: -2, y: -1 },
          { x: -2, y: -0.15 },
          { x: 2, y: -0.15 },
          { x: 2, y: -1 },
          { x: 4, y: -1 },
          { x: 4, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 0.15 },
          { x: -2, y: 0.15 },
          { x: -2, y: 1 },
          { x: -4, y: 1 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pours = circuit.db.pcb_copper_pour.list() as PcbCopperPourBRep[]
  // BUG: the 0.3mm neck is eaten by the 0.2mm inset, giving two pours
  expect(pours).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
