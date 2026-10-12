import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Reduced from tscircuit/sparkfun-boards#361. The footprint string emits
// 90-degree rotated pads whose geometry is misread when assigning source traces.
test("INA237 footprint string assigns routed traces to adjacent pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={18} autorouter="auto_local" schematicDisabled>
      <chip
        name="U2"
        pcbY={2}
        footprint="dfn10_p0.5mm_w6mm_pw0.3mm_pl1.3mm_pin1location(leftside,bottom)"
        pinLabels={{
          pin1: ["A1"],
          pin2: ["A0"],
          pin3: ["ALERT"],
          pin4: ["SDA"],
          pin5: ["SCL"],
          pin6: ["VS"],
          pin7: ["GND"],
          pin8: ["VBUS"],
          pin9: ["IN_NEG"],
          pin10: ["IN_POS"],
        }}
        connections={{
          pin3: "net.ALERT",
          pin4: "net.SDA",
          pin5: "net.SCL",
        }}
      />
      <resistor
        name="R_ALERT"
        resistance="2.2k"
        footprint="0603"
        pcbX={-4}
        pcbY={1}
        connections={{ pin1: "net.ALERT" }}
      />
      <resistor
        name="R_SDA"
        resistance="2.2k"
        footprint="0603"
        pcbX={-4}
        pcbY={-3}
        connections={{ pin1: "net.SDA" }}
      />
      <resistor
        name="R_SCL"
        resistance="2.2k"
        footprint="0603"
        pcbX={4}
        pcbY={-3}
        connections={{ pin1: "net.SCL" }}
      />
      <fabricationnotetext
        text="INA237: footprint string routing repro"
        pcbY={7.4}
        fontSize={0.55}
        color="#ffffff"
      />
      <fabricationnotetext
        text="Pads: 1.3 x 0.3 mm, rotated 90 degrees"
        pcbY={6.4}
        fontSize={0.4}
        color="#ffbb55"
      />
      <fabricationnotetext
        text="BUG: SDA (pin4) is assigned to ALERT (pin3)"
        pcbY={-6}
        fontSize={0.4}
        color="#ffbb55"
      />
      <fabricationnotetext
        text="BUG: SCL (pin5) is assigned to SDA (pin4)"
        pcbY={-7}
        fontSize={0.4}
        color="#ffbb55"
      />
      <fabricationnotetext
        text="Routes exist; pin/net attribution is wrong."
        pcbY={-8}
        fontSize={0.4}
        color="#ffffff"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sensor = circuit.db.source_component
    .list()
    .find((sourceComponent) => sourceComponent.name === "U2")!
  const sensorPorts = circuit.db.source_port
    .list()
    .filter(
      (sourcePort) =>
        sourcePort.source_component_id === sensor.source_component_id,
    )

  // Pin the defect illustrated by the notes to the emitted route metadata.
  // Update these expectations and the visual notes when the bug is fixed.
  for (const [routedPinName, assignedPinName] of [
    ["SDA", "ALERT"],
    ["SCL", "SDA"],
  ] as const) {
    const routedPort = sensorPorts.find(
      (sourcePort) => sourcePort.name === routedPinName,
    )!
    const assignedPort = sensorPorts.find(
      (sourcePort) => sourcePort.name === assignedPinName,
    )!
    const pcbPort = circuit.db.pcb_port
      .list()
      .find((pcbPort) => pcbPort.source_port_id === routedPort.source_port_id)!
    const copperTrace = circuit.db.pcb_trace
      .list()
      .find((pcbTrace) =>
        pcbTrace.route.some(
          (routePoint) =>
            routePoint.route_type === "wire" &&
            (routePoint.start_pcb_port_id === pcbPort.pcb_port_id ||
              routePoint.end_pcb_port_id === pcbPort.pcb_port_id),
        ),
      )!
    const assignedSourceTrace = circuit.db.source_trace.get(
      copperTrace.source_trace_id!,
    )!

    expect(assignedSourceTrace.connected_source_port_ids).toContain(
      assignedPort.source_port_id,
    )
    expect(assignedSourceTrace.connected_source_port_ids).not.toContain(
      routedPort.source_port_id,
    )
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPinNumbers: true,
  })
})
