import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Transistor } from "lib/components/normal-components/Transistor"

it("should render an NPN transistor with 0° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" type="npn" schRotation={0} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".npn.0")
})

it("should render an NPN transistor with 90° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" type="npn" schRotation={90} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".npn.90")
})

it("should render an NPN transistor with 180° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" type="npn" schRotation={180} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".npn.180")
})

it("should render an NPN transistor with 270° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" type="npn" schRotation={270} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".npn.270")
})

it("should render a PNP transistor with 0° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" type="pnp" schRotation={0} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".pnp.0")
})

it("should render a PNP transistor with 90° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" type="pnp" schRotation={90} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".pnp.90")
})

it("should render a PNP transistor with 180° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" type="pnp" schRotation={180} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".pnp.180")
})

it("should render a PNP transistor with 270° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" type="pnp" schRotation={270} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".pnp.270")
})
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

  const base = ports.find((port) => port.source_port_id === "b")
  const collector = ports.find((port) => port.source_port_id === "c")
  const emitter = ports.find((port) => port.source_port_id === "e")

  expect(base).not.toBeNull()
  expect(collector).not.toBeNull()
  expect(emitter).not.toBeNull()
})

it("should generate transistor pcb ports aliases", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" type="npn" footprint="sot23" />
      <resistor name="R1" resistance="10k" footprint="0402" />
      <trace from=".Q1 > .emitter" to=".R1 > .pin1" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
