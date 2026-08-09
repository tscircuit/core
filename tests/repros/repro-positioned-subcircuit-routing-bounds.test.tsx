import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "positioned auto-sized subcircuit routing bounds should follow its content",
  async () => {
    const { circuit: unpositionedCircuit } = getTestFixture()
    unpositionedCircuit.add(
      <board width="40mm" height="20mm" layers={2}>
        <subcircuit name="POWER" padding="1mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={8}
            pcbY={4}
          />
          <resistor
            name="R2"
            resistance="1k"
            footprint="0402"
            pcbX={14}
            pcbY={4}
          />
          <trace from=".R1 > .pin1" to=".R2 > .pin1" />
        </subcircuit>
      </board>,
    )
    await unpositionedCircuit.renderUntilSettled()

    expect(
      unpositionedCircuit.db.pcb_group.getWhere({ name: "POWER" })?.center,
    ).toEqual({ x: 11, y: 4 })
    expect(unpositionedCircuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(unpositionedCircuit.db.pcb_trace_error.list()).toEqual([])

    const { circuit: positionedCircuit } = getTestFixture()
    positionedCircuit.add(
      <board width="40mm" height="20mm" layers={2}>
        <subcircuit name="POWER" pcbX={-10} pcbY={-5} padding="1mm">
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={8}
            pcbY={4}
          />
          <resistor
            name="R2"
            resistance="1k"
            footprint="0402"
            pcbX={14}
            pcbY={4}
          />
          <trace from=".R1 > .pin1" to=".R2 > .pin1" />
        </subcircuit>
        <pcbnotetext
          pcbX={-10}
          pcbY={-7}
          fontSize="0.5mm"
          text="BUG: dashed routing bounds stay at the subcircuit anchor"
        />
        <pcbnotetext
          pcbX={1}
          pcbY={1}
          fontSize="0.5mm"
          text="Actual translated subcircuit content"
        />
      </board>,
    )
    await positionedCircuit.renderUntilSettled()

    expect(positionedCircuit).toMatchPcbSnapshot(import.meta.path, {
      showPcbGroups: true,
    })

    // pcbX/pcbY translates the content center from (11, 4) to (1, -1).
    // The pcb_group incorrectly remains centered at the (-10, -5) anchor,
    // so local autorouting receives a routing boundary displaced from its pads.
    expect({
      center: positionedCircuit.db.pcb_group.getWhere({ name: "POWER" })
        ?.center,
      autoroutingErrors:
        positionedCircuit.db.pcb_autorouting_error.list().length,
      traceErrors: positionedCircuit.db.pcb_trace_error.list().length,
    }).toEqual({
      center: { x: 1, y: -1 },
      autoroutingErrors: 0,
      traceErrors: 0,
    })
  },
)
