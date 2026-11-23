import { expect, test } from "bun:test"
import {
  doSegmentsIntersect,
  pointToSegmentDistance,
} from "@tscircuit/math-utils"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reference divider reproduces a backtracking schematic wire", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })

  // Reduced from imrishabh18/rp2040-motor-controller v1.0.52.
  // The generic driver retains only the three reference pins used by this section.
  circuit.add(
    <board schMaxTraceDistance={4}>
      <chip
        name="DRIVER"
        pinLabels={{ pin1: "V3P3OUT", pin2: "AVREF", pin3: "BVREF" }}
      />
      <group name="reference" schAutoLayoutEnabled>
        <schematicsection
          name="driver_reference"
          displayName="1 A Current Reference"
        />
        <capacitor
          name="C_DRV_3V3"
          capacitance="470nF"
          schOrientation="vertical"
          schSectionName="driver_reference"
        />
        <resistor
          name="R_DRV_REF_TOP"
          resistance="2.4k"
          schOrientation="pos_bottom"
          schSectionName="driver_reference"
        />
        <resistor
          name="R_DRV_REF_BOTTOM"
          resistance="2k"
          schOrientation="vertical"
          schSectionName="driver_reference"
        />
        <capacitor
          name="C_DRV_REF"
          capacitance="100nF"
          schOrientation="vertical"
          schSectionName="driver_reference"
        />
      </group>
      <trace
        from=".C_DRV_3V3 > .pin1"
        to=".DRIVER > .V3P3OUT"
        schDisplayLabel="DRV_3V3"
      />
      <trace
        from=".R_DRV_REF_TOP > .pin1"
        to=".DRIVER > .V3P3OUT"
        schDisplayLabel="DRV_3V3"
      />
      <trace from=".C_DRV_3V3 > .pin2" to="net.GND" />
      <trace
        from=".R_DRV_REF_TOP > .pin2"
        to=".R_DRV_REF_BOTTOM > .pin1"
        schDisplayLabel="DRV_VREF"
      />
      <trace
        from=".R_DRV_REF_BOTTOM > .pin1"
        to=".DRIVER > .AVREF"
        schDisplayLabel="DRV_VREF"
      />
      <trace
        from=".DRIVER > .AVREF"
        to=".DRIVER > .BVREF"
        schDisplayLabel="DRV_VREF"
      />
      <trace
        from=".C_DRV_REF > .pin1"
        to=".DRIVER > .AVREF"
        schDisplayLabel="DRV_VREF"
      />
      <trace from=".R_DRV_REF_BOTTOM > .pin2" to="net.GND" />
      <trace from=".C_DRV_REF > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 800,
    height: 1000,
  })

  const referencePorts = [
    ".R_DRV_REF_TOP > .pin2",
    ".R_DRV_REF_BOTTOM > .pin1",
    ".C_DRV_REF > .pin1",
  ].map((selector) => {
    const port = circuit.selectOne(selector) as Port
    return circuit.db.schematic_port.get(port.schematic_port_id!)!
  })
  const referenceNet = circuit.db.source_port.get(
    referencePorts[0]!.source_port_id!,
  )!.subcircuit_connectivity_map_key
  const referenceEdges = circuit.db.schematic_trace
    .list({ subcircuit_connectivity_map_key: referenceNet })
    .flatMap((trace) => trace.edges)
  const connectedEdges = new Set(
    referenceEdges.filter(
      (edge) =>
        pointToSegmentDistance(referencePorts[0]!.center, edge.from, edge.to) <
        1e-6,
    ),
  )
  // Follow touching wires; Set iteration also visits newly reached edges.
  for (const { from, to } of connectedEdges) {
    for (const edge of referenceEdges) {
      if (!doSegmentsIntersect(edge.from, edge.to, from, to)) continue
      connectedEdges.add(edge)
    }
  }
  for (const port of referencePorts) {
    expect(
      [...connectedEdges].some(
        (edge) =>
          pointToSegmentDistance(port.center, edge.from, edge.to) < 1e-6,
      ),
    ).toBe(true)
  }
  const groundPort = circuit.selectOne(".R_DRV_REF_BOTTOM > .pin2") as Port
  const groundCenter = circuit.db.schematic_port.get(
    groundPort.schematic_port_id!,
  )!.center
  expect(
    referenceEdges.some(
      (edge) => pointToSegmentDistance(groundCenter, edge.from, edge.to) < 1e-6,
    ),
  ).toBe(false)
})
