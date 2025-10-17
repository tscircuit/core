import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("component on invalid layer should throw error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" layer="inner1" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.pcb_component_invalid_layer_error.list()

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain(
    "Component cannot be placed on layer 'inner1'",
  )
  expect(errors[0].layer).toBe("inner1")
  expect(errors[0].source_component_id).toBeDefined()
})

test("chip on invalid layer should throw error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        layer="inner2"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              pcbX={0}
              pcbY={0}
              width="1mm"
              height="1mm"
              portHints={["1"]}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.pcb_component_invalid_layer_error.list()

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain(
    "Component cannot be placed on layer 'inner2'",
  )
  expect(errors[0].layer).toBe("inner2")
})

test("component on top layer should not throw error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" layer="top" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.pcb_component_invalid_layer_error.list()

  expect(errors).toHaveLength(0)
})

test("component on bottom layer should not throw error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" layer="bottom" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.pcb_component_invalid_layer_error.list()

  expect(errors).toHaveLength(0)
})

test("component with default layer (top) should not throw error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const errors = circuit.db.pcb_component_invalid_layer_error.list()

  expect(errors).toHaveLength(0)
})
