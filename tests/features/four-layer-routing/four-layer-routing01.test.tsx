import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import { sel } from "lib/sel"

test.skip(
  "autorouter uses inner layers on a four-layer board with dense crossings",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="60mm" height="40mm" layers={4}>
        <pinheader
          name="J1"
          pinCount={12}
          footprint="pinrow12_p2.54"
          pcbX={-21.5}
          pcbY={0}
          pcbRotation={90}
        />
        <pinheader
          name="J2"
          pinCount={12}
          footprint="pinrow12_p2.54"
          pcbX={21.5}
          pcbY={0}
          pcbRotation={-90}
        />
        <chip
          name="U1"
          footprint="soic24"
          pcbX={0}
          pcbY={0}
          connections={{
            pin1: sel.J2.pin12,
            pin2: sel.J2.pin1,
            pin3: sel.J2.pin11,
            pin4: sel.J2.pin2,
            pin5: sel.J2.pin10,
            pin6: sel.J2.pin3,
            pin7: sel.J2.pin9,
            pin8: sel.J2.pin4,
            pin9: sel.J2.pin8,
            pin10: sel.J2.pin5,
            pin11: sel.J2.pin7,
            pin12: sel.J2.pin6,
            pin13: sel.J1.pin1,
            pin14: sel.J1.pin12,
            pin15: sel.J1.pin2,
            pin16: sel.J1.pin11,
            pin17: sel.J1.pin3,
            pin18: sel.J1.pin10,
            pin19: sel.J1.pin4,
            pin20: sel.J1.pin9,
            pin21: sel.J1.pin5,
            pin22: sel.J1.pin8,
            pin23: sel.J1.pin6,
            pin24: sel.J1.pin7,
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
  { timeout: 120_000 },
)
