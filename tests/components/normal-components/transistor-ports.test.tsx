import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Transistor } from "lib/components/normal-components/Transistor"

it("should have base, emitter, and collector port mappings", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q3" type="npn" schRotation={0} />
    </board>,
  )
  circuit.render()
  const transistorInstance = circuit.selectOne("Transistor") as Transistor
  expect(transistorInstance).toBeDefined()
  expect(transistorInstance.base).toBeDefined()
  expect(transistorInstance.emitter).toBeDefined()
  expect(transistorInstance.collector).toBeDefined()
})

it("should initialize base, emitter, and collector ports correctly for an NPN transistor", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" type="npn" schRotation={0} />
    </board>,
  )
  circuit.render()

  const components = circuit.db.pcb_component.list()
  expect(components).toHaveLength(1)
  const component = components[0]

  const ports = circuit.db.pcb_port.list()

  const base = ports.find(
    (port) => circuit.db.source_port.get(port.source_port_id!)?.name === "base",
  )
  const collector = ports.find(
    (port) =>
      circuit.db.source_port.get(port.source_port_id!)?.name === "collector",
  )
  const emitter = ports.find(
    (port) =>
      circuit.db.source_port.get(port.source_port_id!)?.name === "emitter",
  )

  expect(base).not.toBeNull()
  expect(collector).not.toBeNull()
  expect(emitter).not.toBeNull()
})
