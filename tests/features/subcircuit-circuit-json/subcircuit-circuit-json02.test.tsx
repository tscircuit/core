import { expect, test } from "bun:test"
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
      <port name="VIN" direction="left" connectsTo="U1.pin1" />
      <port name="VSS" direction="right" connectsTo="U1.pin2" />
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

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
