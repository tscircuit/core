import { expect, it } from "bun:test"
import { InvalidProps } from "lib/errors/InvalidProps"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it.skip("Chip with pin labels as strings and duplicates", async () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schPinSpacing={0.75}
        schPortArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["B2", "B1"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["A1", "A2"],
          },
          topSide: {
            direction: "left-to-right",
            pins: ["B1", "B2"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["B3", "B3"],
          },
        }}
        supplierPartNumbers={{
          lcsc: ["C165948"],
        }}
      />
    </board>,
  )

  project.render()

  const chip = project.selectOne("chip")
  expect(chip).not.toBeNull()

  // Check if ports are created correctly in the database
  const schematicPorts = project.db.schematic_port.list()
  expect(schematicPorts).toHaveLength(8) // 2 pins per side * 4 sides

  // Check port properties
  for (const port of schematicPorts) {
    const sourcePort = project.db.source_port.get(port.source_port_id!)
    expect(sourcePort).toBeDefined()
    expect(sourcePort!.pin_number).toBeDefined()
  }

  // Get source ports and check their pin numbers
  const sourcePorts = project.db.source_port.list()
  const portNames = sourcePorts.map(p => p.name)
  
  // Should have 8 ports total (2 per side)
  expect(sourcePorts).toHaveLength(8)
  
  // Check duplicates
  expect(portNames.filter(p => p.startsWith("B1"))).toHaveLength(2)
  expect(portNames.filter(p => p.startsWith("B2"))).toHaveLength(2)
  expect(portNames.filter(p => p.startsWith("B3"))).toHaveLength(2)

  expect(project.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})

it("Chip with pin labels as numbers, decimals and duplicates", async () => {
  const { circuit } = getTestFixture()

  try {
    circuit.add(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          schPinSpacing={0.75}
          schPortArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: [1, 2],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: [3, -4],
            },
            topSide: {
              direction: "left-to-right",
              pins: [2, 6.5],
            },
            bottomSide: {
              direction: "left-to-right",
              pins: [7, 7],
            },
          }}
          supplierPartNumbers={{
            lcsc: ["C165948"],
          }}
        />
      </board>,
    )
  } catch (e: unknown) {
    expect(e).toBeInstanceOf(InvalidProps)
    expect((e as InvalidProps).message).toContain("-4")
  }
  
})

// TODO
it.skip("Chip with pin labels as duplicates", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schPinSpacing={0.75}
        schPortArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin3", "pin3", "pin3"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["pin4", "pin2", "pin3"],
          },
        }}
        supplierPartNumbers={{
          lcsc: ["C165948"],
        }}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
