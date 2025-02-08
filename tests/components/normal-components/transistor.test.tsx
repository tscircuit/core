import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

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
