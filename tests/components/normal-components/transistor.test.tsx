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

it("should render a PNP transistor", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor
        name="Q2"
        type="pnp"
        schRotation={90}
        connections={{ pin1: "net.pin1", pin2: "net.pin2", pin3: "net.pin3" }}
      />
      <transistor
        name="Q1"
        type="pnp"
        schRotation={90}
        schX={3.5}
        connections={{
          collector: "net.collector",
          emitter: "net.emitter",
          base: "net.base",
        }}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".connection")
})

it("should render a PNP and NPN transistor", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor
        name="Q1"
        type="npn"
        schRotation={90}
        schX={-2}
        connections={{
          collector: "net.collector",
          emitter: "net.emitter",
          base: "net.base",
        }}
      />
      <transistor
        name="Q1"
        type="pnp"
        schRotation={90}
        schX={3.5}
        connections={{
          collector: "net.collector",
          emitter: "net.emitter",
          base: "net.base",
        }}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".connection2")
})
