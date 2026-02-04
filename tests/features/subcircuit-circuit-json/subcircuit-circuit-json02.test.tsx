import { expect, test } from "bun:test"
import type { PcbSmtPad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json02 - chip inflation", async () => {
  const { circuit } = await getTestFixture()

  const subcircuitCircuitJson = await renderToCircuitJson(
    <group name="G1">
      <chip
        name="U1"
        manufacturerPartNumber="MPN123"
        supplierPartNumbers={{ digikey: ["DIGI-123"] }}
        footprint={"soic8"}
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
      />
    </group>,
  )

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

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
