import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render an NPN transistor with 0° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" transistorType="npn" schRotation={0} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".npn.0")
})

it("should render an NPN transistor with 90° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" transistorType="npn" schRotation={90} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".npn.90")
})

it("should render an NPN transistor with 180° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" transistorType="npn" schRotation={180} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".npn.180")
})

it("should render an NPN transistor with 270° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" transistorType="npn" schRotation={270} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".npn.270")
})

it("should render a PNP transistor with 0° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" transistorType="pnp" schRotation={0} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".pnp.0")
})

it("should render a PNP transistor with 90° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" transistorType="pnp" schRotation={90} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".pnp.90")
})

it("should render a PNP transistor with 180° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" transistorType="pnp" schRotation={180} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".pnp.180")
})

it("should render a PNP transistor with 270° rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" transistorType="pnp" schRotation={270} />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".pnp.270")
})

it("should initialize base, emitter, and collector ports correctly for an NPN transistor", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" transistorType="npn" schRotation={0} />
    </board>,
  )
  circuit.render()

  const components = circuit.db.schematic_component.list()
  expect(components).toHaveLength(1)
  const component = components[0]

  const ports = circuit.db.schematic_port.list()
  expect(ports).toHaveLength(3)

  const base = ports.find((port) => port.display_pin_label === "B")
  const collector = ports.find((port) => port.display_pin_label === "C")
  const emitter = ports.find((port) => port.display_pin_label === "E")

  expect(base).not.toBeNull()
  expect(collector).not.toBeNull()
  expect(emitter).not.toBeNull()
})

it("should initialize base, emitter, and collector ports correctly for a PNP transistor", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" transistorType="pnp" schRotation={0} />
    </board>,
  )
  circuit.render()

  const components = circuit.db.schematic_component.list()
  expect(components).toHaveLength(1)
  const component = components[0]

  const ports = circuit.db.schematic_port.list()
  expect(ports).toHaveLength(3)

  const base = ports.find((port) => port.display_pin_label === "B")
  const collector = ports.find((port) => port.display_pin_label === "C")
  const emitter = ports.find((port) => port.display_pin_label === "E")

  expect(base).not.toBeNull()
  expect(collector).not.toBeNull()
  expect(emitter).not.toBeNull()
})
