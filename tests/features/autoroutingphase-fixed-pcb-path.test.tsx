import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.each([
  { phased: false, nested: false, simplify: false },
  { phased: true, nested: false, simplify: false },
  { phased: false, nested: true, simplify: false },
  { phased: true, nested: true, simplify: false },
  { phased: false, nested: false, simplify: true },
])(
  "pcbPath bends and vias are fixed during autorouting (%j)",
  async ({ phased, nested, simplify }) => {
    const { circuit } = getTestFixture()
    const phaseInputs: SimpleRouteJson[] = []
    let originalManualTrace: PcbTrace | undefined
    circuit.on("autorouting:start", (event) => {
      originalManualTrace ??= structuredClone(circuit.db.pcb_trace.list()[0]!)
      phaseInputs.push(event.simpleRouteJson)
    })
    circuit.add(
      <board width={20} height={18}>
        <pcbnotetext
          pcbY={6}
          fontSize={0.6}
          text="Fixed manual bends + via; automatic routes below"
        />
        <group name="manual" subcircuit={nested}>
          <chip
            name="U1"
            pcbX={-4}
            pinLabels={{ pin1: "MANUAL_START" }}
            footprint={
              <footprint>
                <smtpad
                  portHints={["1"]}
                  width={0.6}
                  height={0.6}
                  shape="rect"
                />
              </footprint>
            }
          />
          <chip
            name="U2"
            pcbX={4}
            layer="bottom"
            pinLabels={{ pin1: "MANUAL_END" }}
            footprint={
              <footprint>
                <smtpad
                  portHints={["1"]}
                  width={0.6}
                  height={0.6}
                  shape="rect"
                />
              </footprint>
            }
          />
          <trace
            from="U1.1"
            to="U2.1"
            thickness={0.2}
            pcbPath={[
              { x: 2, y: 2 },
              { x: 4, y: 2 },
              { x: 4, y: 2, via: true, toLayer: "bottom" },
              { x: 4, y: 2 },
              { x: 6, y: 2 },
            ]}
          />
        </group>
        <resistor
          name="R1"
          pcbX={-4}
          pcbY={-3}
          resistance="1k"
          footprint="0402"
        />
        <resistor
          name="R2"
          pcbX={4}
          pcbY={-3}
          resistance="1k"
          footprint="0402"
        />
        <resistor
          name="R3"
          pcbX={-4}
          pcbY={-6}
          resistance="1k"
          footprint="0402"
        />
        <resistor
          name="R4"
          pcbX={4}
          pcbY={-6}
          resistance="1k"
          footprint="0402"
        />
        {phased && <autoroutingphase phaseIndex={0} connection="R1.1" />}
        {simplify && <autoroutingphase reroute autorouter="simplify" />}
        <trace from="R1.1" to="R2.1" />
        <trace from="R3.1" to="R4.1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(circuit.db.pcb_trace_error.list()).toEqual([])
    expect(phaseInputs).toHaveLength(
      (phased || simplify ? 2 : 1) + (nested ? 1 : 0),
    )
    expect(originalManualTrace).toBeDefined()
    for (const input of phaseInputs) {
      // The solver must see this copper only as obstacles, never as editable
      // preloaded traces. Check the via away from either component's pads.
      expect(
        input.traces?.some(
          (trace) =>
            trace.connection_name === originalManualTrace!.source_trace_id,
        ) ?? false,
      ).toBe(false)
      expect(input.obstacles).toContainEqual(
        expect.objectContaining({
          center: { x: 0, y: 2 },
          layers: ["top", "bottom"],
          connectedTo: expect.arrayContaining([
            originalManualTrace!.source_trace_id,
          ]),
        }),
      )
    }
    const manualTraces = circuit.db.pcb_trace
      .list()
      .filter(
        (trace) =>
          trace.source_trace_id === originalManualTrace!.source_trace_id,
      )
    expect(manualTraces).toHaveLength(1)
    expect(manualTraces[0]!.route).toEqual(originalManualTrace!.route)
    expect(circuit.db.pcb_trace.list()).toHaveLength(3)
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path +
        (phased ? "-phased" : "-unphased") +
        (nested ? "-nested" : "") +
        (simplify ? "-simplify" : ""),
    )
  },
)
