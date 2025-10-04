import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import { sel } from "tscircuit"

test(
  "autorouter uses inner layers on a four-layer board with dense crossings",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="60mm" height="40mm" layers={4}>
        <pinheader
          name="J1"
          pinCount={8}
          footprint="pinrow8_p2.54"
          pcbX={-22}
          pcbY={0}
          pcbRotation={90}
        />
        <pinheader
          name="J2"
          pinCount={8}
          footprint="pinrow8_p2.54"
          pcbX={22}
          pcbY={0}
          pcbRotation={-90}
        />
        <chip
          name="U1"
          footprint="soic16"
          pcbX={0}
          pcbY={0}
          connections={{
            pin1: sel.J2.pin8,
            pin2: sel.J2.pin7,
            pin3: sel.J2.pin6,
            pin4: sel.J2.pin5,
            pin5: sel.J2.pin4,
            pin6: sel.J2.pin3,
            pin7: sel.J2.pin2,
            pin8: sel.J2.pin1,
            pin9: sel.J1.pin1,
            pin10: sel.J1.pin2,
            pin11: sel.J1.pin3,
            pin12: sel.J1.pin4,
            pin13: sel.J1.pin5,
            pin14: sel.J1.pin6,
            pin15: sel.J1.pin7,
            pin16: sel.J1.pin8,
          }}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const board = circuit.db.pcb_board.list()[0]
    expect(board.num_layers).toBe(4)

    const traces = circuit.db.pcb_trace.list()
    expect(traces.length).toBeGreaterThan(10)

    const usesInnerLayers = traces.some((trace) =>
      trace.route?.some(
        (segment) =>
          segment.route_type === "wire" &&
          (segment.layer === "inner1" || segment.layer === "inner2"),
      ),
    )

    expect(usesInnerLayers).toBe(true)
  },
  { timeout: 60_000 },
)
