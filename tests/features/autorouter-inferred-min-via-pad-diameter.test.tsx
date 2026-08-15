import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test(
  "autorouter infers the minimum via pad diameter from the configured hole diameter",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board
        width="12mm"
        height="12mm"
        layers={2}
        minViaHoleDiameter="0.3mm"
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

    const board = circuit.db.pcb_board.list()[0]!
    expect(board.min_via_hole_diameter).toBe(0.3)
    expect(board.min_via_pad_diameter).toBeCloseTo(0.45)

    const vias = circuit.db.pcb_via.list()
    expect(vias.length).toBeGreaterThan(0)
    expect(vias.every((via) => via.hole_diameter === 0.3)).toBe(true)
    expect(
      vias.every((via) => Math.abs(via.outer_diameter - 0.45) < 1e-10),
    ).toBe(true)

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 30_000 },
)
