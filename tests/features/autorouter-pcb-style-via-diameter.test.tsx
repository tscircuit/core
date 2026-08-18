import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test(
  "autorouter uses pcbStyle via dimensions for routed vias",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board
        width="12mm"
        height="12mm"
        layers={2}
        pcbStyle={{
          viaHoleDiameter: "0.35mm",
          viaPadDiameter: "0.8mm",
        }}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
        }}
        autorouterVersion="beta_pipeline4"
      >
        <testpoint
          name="TP_TOP"
          footprintVariant="pad"
          pcbX={0}
          pcbY={4}
          layer="top"
        />
        <testpoint
          name="TP_BOTTOM"
          footprintVariant="pad"
          pcbX={0}
          pcbY={-4}
          layer="bottom"
        />

        <trace from=".TP_TOP > .pin1" to=".TP_BOTTOM > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()

    const board = circuit.db.pcb_board.list()[0]
    expect(board.min_via_hole_diameter).toBe(0.35)
    expect(board.min_via_pad_diameter).toBe(0.8)

    const vias = circuit.db.pcb_via.list()
    expect(vias.length).toBeGreaterThan(0)
    expect(vias.every((via) => via.outer_diameter === 0.8)).toBe(true)
    expect(vias.every((via) => via.hole_diameter === 0.35)).toBe(true)

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 30_000 },
)
