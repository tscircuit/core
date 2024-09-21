import { it, expect } from "bun:test"
import { Circuit } from "lib/Project"
import { Chip } from "lib/components/normal-components/Chip"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

it("should create a Chip component with correct properties", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPortArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip") as Chip

  expect(chip).not.toBeNull()
  expect(chip.props.name).toBe("U1")

  // Check if ports are created correctly
  const ports = chip.children.filter((c) => c.componentName === "Port")
  expect(ports).toHaveLength(8)

  // Check specific ports
  const vccPort = chip.selectOne("port[name='VCC']")
  expect(vccPort).not.toBeNull()
  expect(vccPort!.props.pinNumber).toBe(1)

  const gndPort = chip.selectOne("port[name='GND']")
  expect(gndPort).not.toBeNull()
  expect(gndPort!.props.pinNumber).toBe(8)

  // Test schematic rendering
  expect(chip.schematic_component_id).not.toBeNull()

  // Test PCB rendering
  expect(chip.pcb_component_id).not.toBeNull()

  const schematic_component = circuit.db.schematic_component.get(
    chip.schematic_component_id!,
  )

  expect(schematic_component?.port_labels).toBeTruthy()
  expect(schematic_component?.port_arrangement).toBeTruthy()

  expect(
    convertCircuitJsonToSchematicSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
})
