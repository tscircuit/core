import { jsx } from "react/jsx-runtime"
import { test, expect } from "@jest/globals"
import { Board, Chip, Footprint, SmtPad } from "lib/components"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip footprint determines schematic port arrangement", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <Board width="10mm" height="10mm">
      <Chip
        name="U1"
        footprint={
          <Footprint>
            <SmtPad
              pcbX={0}
              pcbY={0}
              shape="rect"
              width={1}
              height={1}
              portHints={["pin1"]}
            />
          </Footprint>
        }
      />
    </Board>
  )
  circuit.render()

  const schematicComponent = circuit.db.schematic_component.list()[0]

  expect(schematicComponent).toBeDefined()

  const schematicPorts = circuit.db.schematic_port.list()
  expect(schematicPorts).toHaveLength(1)

  expect(schematicPorts[0].schematic_component_id).toBe(schematicComponent.schematic_component_id)

  const pcbPorts = circuit.db.pcb_port.list()
  expect(pcbPorts).toHaveLength(1)
  expect(pcbPorts[0].pcb_component_id).toBe(circuit.db.pcb_component.list()[0].pcb_component_id)
})

test("chip footprint does not cause extra pins in schematic view", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <Board width="10mm" height="10mm">
      <Chip
        name="U1"
        footprint={
          <Footprint>
            <SmtPad
              pcbX={0}
              pcbY={0}
              shape="rect"
              width={1}
              height={1}
              portHints={["pin1"]}
            />
            <silkscreenpath
              route={[
                { x: 0, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 0 },
              ]}
              strokeWidth="0.2mm"
              layer="top"
            />
          </Footprint>
        }
      />
    </Board>
  )
  circuit.render()

  const schematicPins = circuit.db.schematic_port.list()

  expect(schematicPins.length).toBe(1)

  expect(circuit.db.schematic_component.list()).toHaveLength(1)
})
