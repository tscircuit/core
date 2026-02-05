import { expect, test } from "bun:test"
import type { PcbSmtPad, PcbTrace, PcbVia } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit-circuit-json02 - chip inflation", async () => {
  const initialCircuit = getTestFixture().circuit
  const { circuit } = getTestFixture()

  initialCircuit.add(
    <group name="G1">
      <chip
        name="U1"
        manufacturerPartNumber="MPN123"
        supplierPartNumbers={{ digikey: ["DIGI-123"] }}
        footprint={"soic8"}
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
      />
      <resistor
        name="R1"
        footprint={"0402"}
        resistance={"1k"}
        pcbX={0}
        pcbY={0}
        connections={{
          pin1: "U1.pin8",
        }}
      />
      <resistor
        name="R2"
        footprint={"0402"}
        resistance={"1k"}
        pcbX={0}
        pcbY={-2}
        connections={{
          pin2: "U1.pin1",
        }}
      />
      <trace from={".R1 > .pin2"} to={".R2 > .pin1"} />
    </group>,
  )
  await initialCircuit.renderUntilSettled()
  const subcircuitCircuitJson = initialCircuit.getCircuitJson()

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  const chipSourceComponent = circuitJson.find(
    (element) =>
      element.type === "source_component" &&
      (element as any).ftype === "simple_chip" &&
      (element as any).name === "U1",
  ) as any

  expect(chipSourceComponent).toBeDefined()
  expect(chipSourceComponent?.manufacturer_part_number).toBe("MPN123")

  const chipPorts = circuitJson.filter(
    (element) =>
      element.type === "source_port" &&
      (element as any).source_component_id ===
        chipSourceComponent?.source_component_id,
  ) as any[]

  expect(chipPorts.length).toBeGreaterThanOrEqual(2)
  const portNames = chipPorts.map((port) => (port as any).name)
  expect(portNames).toEqual(expect.arrayContaining(["VCC", "GND"]))

  const pcbComponent = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      (element as any).source_component_id ===
        chipSourceComponent?.source_component_id,
  ) as any

  expect(pcbComponent).toBeDefined()
  expect(pcbComponent?.layer).toBe("top")

  const cadComponent = circuitJson.find(
    (element) =>
      element.type === "cad_component" &&
      (element as any).source_component_id ===
        chipSourceComponent?.source_component_id,
  ) as any

  expect(cadComponent).toBeDefined()
  expect(cadComponent?.footprinter_string).toBe("soic8")

  // Verify that pcb_ports exist and are linked to their source_ports
  const pcbPorts = circuitJson.filter((element) => element.type === "pcb_port")

  // Find pcb_ports for the chip's source_ports
  const chipPcbPorts = pcbPorts.filter((pcbPort) =>
    chipPorts.some(
      (sourcePort) => sourcePort.source_port_id === pcbPort.source_port_id,
    ),
  )

  // Should have pcb_ports for VCC and GND pins
  expect(chipPcbPorts.length).toBeGreaterThanOrEqual(2)

  // Verify pcb_ports have valid coordinates
  for (const pcbPort of chipPcbPorts) {
    expect(typeof pcbPort.x).toBe("number")
    expect(typeof pcbPort.y).toBe("number")
  }

  // Verify that pcb_smtpads exist and are linked to pcb_ports
  const pcbSmtpads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      element.pcb_component_id === pcbComponent?.pcb_component_id,
  )

  // SOIC8 should have 8 pads
  expect(pcbSmtpads.length).toBe(8)

  // Verify that pads have pcb_port_id linking them to ports
  const padsWithPorts = (pcbSmtpads as PcbSmtPad[]).filter(
    (pad) => pad.pcb_port_id !== undefined && pad.pcb_port_id !== null,
  )
  expect(padsWithPorts.length).toBe(8)

  // Get pcb_traces from both circuits to verify route preservation
  const originalPcbTraces = subcircuitCircuitJson.filter(
    (el) => el.type === "pcb_trace",
  ) as PcbTrace[]
  const inflatedPcbTraces = circuitJson.filter(
    (el) => el.type === "pcb_trace",
  ) as PcbTrace[]

  // Should have the same number of pcb_traces
  expect(inflatedPcbTraces.length).toBe(originalPcbTraces.length)

  // Verify the routes have the same structure (same number of points, same route types)
  // Match traces by source_trace_id since order may differ
  for (const originalTrace of originalPcbTraces) {
    const inflatedTrace = inflatedPcbTraces.find(
      (t) => t.source_trace_id === originalTrace.source_trace_id,
    )
    expect(inflatedTrace).toBeDefined()
    if (!inflatedTrace) continue

    const originalRoute = originalTrace.route
    const inflatedRoute = inflatedTrace.route

    // Same number of route points
    expect(inflatedRoute.length).toBe(originalRoute.length)

    // The route may be reversed depending on which port is the anchor.
    // Check if the routes match in either direction.
    const routesMatchForward = originalRoute.every((origPt, j) => {
      const inflPt = inflatedRoute[j]
      return (
        origPt.route_type === inflPt.route_type &&
        Math.abs(origPt.x - inflPt.x) < 0.0001 &&
        Math.abs(origPt.y - inflPt.y) < 0.0001
      )
    })

    const routesMatchReverse = originalRoute.every((origPt, j) => {
      const inflPt = inflatedRoute[originalRoute.length - 1 - j]
      return (
        origPt.route_type === inflPt.route_type &&
        Math.abs(origPt.x - inflPt.x) < 0.0001 &&
        Math.abs(origPt.y - inflPt.y) < 0.0001
      )
    })

    expect(routesMatchForward || routesMatchReverse).toBe(true)
  }

  // Get pcb_vias from both circuits
  const originalPcbVias = subcircuitCircuitJson.filter(
    (el) => el.type === "pcb_via",
  ) as PcbVia[]
  const inflatedPcbVias = circuitJson.filter(
    (el) => el.type === "pcb_via",
  ) as PcbVia[]

  // Should have the same number of pcb_vias
  expect(inflatedPcbVias.length).toBe(originalPcbVias.length)

  // Verify via positions match
  for (let i = 0; i < originalPcbVias.length; i++) {
    const origVia = originalPcbVias[i]
    // Find matching via by position
    const matchingVia = inflatedPcbVias.find(
      (v) =>
        Math.abs(v.x - origVia.x) < 0.0001 &&
        Math.abs(v.y - origVia.y) < 0.0001,
    )
    expect(matchingVia).toBeDefined()
    if (matchingVia) {
      expect(matchingVia.from_layer).toBe(origVia.from_layer)
      expect(matchingVia.to_layer).toBe(origVia.to_layer)
    }
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
