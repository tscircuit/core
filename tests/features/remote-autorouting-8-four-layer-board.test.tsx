import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test(
  "builtin autorouter handles four-layer board",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="40mm" height="40mm" layers={4} autorouter="auto-local">
        <chip name="U1" footprint="soic8" pcbX={-12} pcbY={12} />
        <chip name="U2" footprint="soic8" pcbX={12} pcbY={12} />
        <chip name="U3" footprint="soic8" pcbX={12} pcbY={-12} />
        <chip name="U4" footprint="soic8" pcbX={-12} pcbY={-12} />
        <chip name="U5" footprint="soic8" pcbX={0} pcbY={2} />
        <chip name="U6" footprint="soic8" pcbX={0} pcbY={-18} />
        <resistor
          name="R1"
          pcbX={0}
          pcbY={16}
          resistance={100}
          footprint="0402"
        />
        <resistor
          name="R2"
          pcbX={0}
          pcbY={-14}
          resistance={220}
          footprint="0402"
        />
        <resistor
          name="R3"
          pcbX={-18}
          pcbY={4}
          resistance={330}
          footprint="0402"
        />
        <resistor
          name="R4"
          pcbX={18}
          pcbY={-4}
          resistance={470}
          footprint="0402"
        />
        <resistor
          name="R5"
          pcbX={-6}
          pcbY={-12}
          resistance={510}
          footprint="0402"
        />
        <capacitor
          name="C1"
          pcbX={-6}
          pcbY={4}
          capacitance="10nF"
          footprint="0402"
        />
        <capacitor
          name="C2"
          pcbX={8}
          pcbY={-2}
          capacitance="1uF"
          footprint="0402"
        />
        <capacitor
          name="C3"
          pcbX={-2}
          pcbY={10}
          capacitance="22nF"
          footprint="0402"
        />
        <capacitor
          name="C4"
          pcbX={4}
          pcbY={-10}
          capacitance="47nF"
          footprint="0402"
        />
        <trace from=".U1 > .pin1" to=".U2 > .pin5" />
        <trace from=".U1 > .pin4" to=".R1 > .pin1" />
        <trace from=".R1 > .pin2" to=".U3 > .pin4" />
        <trace from=".U1 > .pin6" to=".R2 > .pin2" />
        <trace from=".U2 > .pin1" to=".U3 > .pin5" />
        <trace from=".U2 > .pin3" to=".C2 > .pin1" />
        <trace from=".U2 > .pin8" to=".U4 > .pin3" />
        <trace from=".U3 > .pin2" to=".C2 > .pin2" />
        <trace from=".U3 > .pin7" to=".U4 > .pin6" />
        <trace from=".U4 > .pin1" to=".R2 > .pin1" />
        <trace from=".U4 > .pin7" to=".C1 > .pin2" />
        <trace from=".C1 > .pin1" to=".U1 > .pin2" />
        <trace from=".U5 > .pin1" to=".U1 > .pin5" />
        <trace from=".U5 > .pin2" to=".U2 > .pin4" />
        <trace from=".U5 > .pin3" to=".R3 > .pin1" />
        <trace from=".R3 > .pin2" to=".U6 > .pin4" />
        <trace from=".U5 > .pin5" to=".U2 > .pin2" />
        <trace from=".U5 > .pin6" to=".R4 > .pin2" />
        <trace from=".R4 > .pin1" to=".U3 > .pin6" />
        <trace from=".U5 > .pin7" to=".C3 > .pin2" />
        <trace from=".C3 > .pin1" to=".U4 > .pin5" />
        <trace from=".U5 > .pin8" to=".U6 > .pin6" />
        <trace from=".U6 > .pin1" to=".C4 > .pin1" />
        <trace from=".C4 > .pin2" to=".U2 > .pin7" />
        <trace from=".U6 > .pin2" to=".R5 > .pin1" />
        <trace from=".R5 > .pin2" to=".U3 > .pin1" />
        <trace from=".U6 > .pin3" to=".U1 > .pin7" />
        <trace from=".U6 > .pin8" to=".U4 > .pin2" />
        <trace from=".U4 > .pin8" to=".R4 > .pin2" />
      </board>,
    )

    await circuit.renderUntilSettled()

    const boards = circuit.db.pcb_board.list()
    expect(boards).toHaveLength(1)
    expect(boards[0]?.num_layers).toBe(4)

    const traces = circuit.selectAll("trace")
    expect(traces.length).toBeGreaterThanOrEqual(24)

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 20_000 },
)
