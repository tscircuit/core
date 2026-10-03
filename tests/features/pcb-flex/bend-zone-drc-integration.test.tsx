import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("core runs published bend-zone DRC for emitted pads, vias, backing and traces", async () => {
  for (const passing of [false, true]) {
    const { circuit } = getTestFixture()
    const partX = passing ? -4 : 0
    const route = (
      passing
        ? [
            { route_type: "wire", x: -6, y: -1, width: 0.2, layer: "top" },
            { route_type: "wire", x: 5, y: -1, width: 0.2, layer: "top" },
          ]
        : [
            { route_type: "wire", x: -6, y: -1, width: 0.2, layer: "top" },
            { route_type: "wire", x: 0, y: -1, width: 0.2, layer: "top" },
            { route_type: "wire", x: 2, y: -2.5, width: 0.2, layer: "top" },
          ]
    ) satisfies PcbTraceRoutePoint[]
    // Keep routing checks enabled so the manually emitted pcbtrace receives DRC.
    circuit.add(
      <board
        material="flex"
        width={28}
        height={24}
        thickness={0.12}
        schematicDisabled
      >
        <pcbbend
          name="B1"
          x1={0}
          y1={-6}
          x2={0}
          y2={6}
          bendRadius={1}
          bendAngle={90}
          bendSide="left"
        />
        <smtpad
          name="PAD"
          shape="rect"
          width={0.5}
          height={0.5}
          pcbX={partX}
          pcbY={1}
        />
        <via
          name="VIA"
          pcbX={partX}
          pcbY={4}
          holeDiameter={0.2}
          outerDiameter={0.5}
        />
        <via
          name="BEYOND_END"
          pcbX={0}
          pcbY={7}
          holeDiameter={0.2}
          outerDiameter={0.5}
        />
        <pcbstiffener
          name="BACKING"
          shape="rect"
          pcbX={partX}
          pcbY={-4}
          width={2}
          height={2}
          layer="bottom"
          material="polyimide"
          thickness={0.2}
        />
        <pcbtrace route={route} />
        <silkscreenrect pcbX={partX} pcbY={-4} width={2} height={2} />
        <silkscreentext
          text="Bottom backing footprint"
          pcbX={partX}
          pcbY={-6}
          fontSize={0.45}
        />
        <silkscreentext text="PAD" pcbX={partX - 1.5} pcbY={1} fontSize={0.4} />
        <silkscreentext text="VIA" pcbX={partX - 1.5} pcbY={4} fontSize={0.4} />
        <silkscreentext
          text="Beyond end: OK"
          pcbX={3}
          pcbY={7}
          fontSize={0.4}
        />
        <silkscreentext
          text={
            passing
              ? "PASS: parts clear; straight crossing"
              : "FAIL: pad, via, backing and corner"
          }
          pcbY={10}
          fontSize={0.65}
        />
        <silkscreentext
          text="B1: 1mm radius, 90deg, finite 12mm line"
          pcbY={9}
          fontSize={0.5}
        />
        <silkscreentext
          text="Via beyond bend end passes in both layouts"
          pcbY={-9}
          fontSize={0.5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const placement = circuit.db.pcb_placement_error
      .list()
      .filter((error) => error.message.includes("overlaps PCB bend zone"))
    const routing = circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("PCB bend zone"))
    expect(placement).toHaveLength(passing ? 0 : 3)
    expect(routing).toHaveLength(passing ? 0 : 1)
    if (!passing) {
      const pad = circuit.db.pcb_smtpad.list()[0]
      const via = circuit.db.pcb_via.list()[0]
      const backing = circuit.db.pcb_stiffener.list()[0]
      for (const error of placement) {
        for (const id of [
          pad.pcb_smtpad_id,
          via.pcb_via_id,
          backing.pcb_stiffener_id,
        ]) {
          expect(error.message).not.toContain(id)
        }
      }
      expect(placement.some((error) => error.message.includes("BACKING"))).toBe(
        true,
      )
      expect(routing[0].pcb_trace_id).toBe(
        circuit.db.pcb_trace.list()[0].pcb_trace_id,
      )
    }
    const before = circuit.getCircuitJson()
    await circuit.renderUntilSettled()
    expect(circuit.getCircuitJson()).toEqual(before)
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(
        ".test.tsx",
        `-${passing ? "passing" : "failing"}.test.tsx`,
      ),
      { showBendLines: true },
    )
  }
})
